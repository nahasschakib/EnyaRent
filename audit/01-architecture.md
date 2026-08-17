# 01 — Architecture

Sources : lecture directe de `package.json`, `prisma/schema.prisma`, `middleware.ts`, `src/proxy.ts`,
`next.config.ts`, `.env` / `.env.local` / `.env.example`, arborescence complète (`find`).

---

## 1. Stack réellement installée (constaté, `package.json`)

| Couche | package.json | CLAUDE.md documente | Écart |
|---|---|---|---|
| Next.js | `16.2.4` | `16.2.4` | ✅ conforme |
| React | `19.2.4` | non précisé | — |
| Prisma | `^7.8.0` (client, `prisma`, `@prisma/adapter-neon`, `@prisma/adapter-pg`) | `v7.8` | ✅ conforme. **Constaté** (`src/lib/db.ts:3,15`) : seul `PrismaNeon` (`@prisma/adapter-neon`) est instancié, avec `neonConfig.webSocketConstructor = ws` (`db.ts:7`) — conforme à la doc « Neon PostgreSQL … WebSocket ». `@prisma/adapter-pg` est une dépendance installée mais **sans aucun import dans `src/`** (grep) — dépendance orpheline, sans impact fonctionnel, à retirer si confirmé inutile ailleurs. |
| Better Auth | `^1.6.9` | `^1.6.9` | ✅ conforme |
| next-intl | `^4.11.0` | `^4` | ✅ conforme |
| Tailwind | `^4` | `v4` | ✅ conforme |
| @react-pdf/renderer | `^4.5.1` | `^4` | ✅ conforme |
| xlsx | `^0.18.5` | `^0.18` | ✅ conforme |
| **@aws-sdk/client-s3** | `^3.1041.0` (dépendance présente) | R2 documenté comme stockage fichiers | **constaté** : le SDK S3 (compatible R2) est installé mais aucune variable `CLOUDFLARE_R2_*` n'est lue par le code applicatif (`grep process.env.` sur `src/` ne retourne aucune occurrence de `CLOUDFLARE_R2_*`, voir §3). Les photos d'assets sont stockées sur le filesystem local (`public/uploads/assets/`, confirmé par les fichiers présents et par le message de commit `30a6d8f` « stockage local fs »). **Le SDK R2 est installé mais non câblé.** |
| Resend | `^6.12.2` | présent | non audité en détail dans cette passe |
| YouSign | pas de SDK dédié, appels `fetch` directs vers `api.yousign.app/v3` | v3 | conforme à l'intention, mais bloqué par variables d'environnement vides (voir §3) |
| Turbopack | absent de `next dev` (`"dev": "next dev"`, pas de `--turbopack`) et absent de `next.config.ts` (`experimental` vide) | interdit par CLAUDE.md règles 7 et 8 | ✅ conforme aux règles absolues |

## 2. Fichiers de configuration critiques

### 2.1 Deux middlewares actifs en parallèle, l'un mort

**Constaté** : il existe deux fichiers de garde de routes :

- `middleware.ts` (racine du projet) — **c'est le seul reconnu par Next.js** comme point d'entrée middleware (nom de fichier imposé par le framework). Protège `/dashboard`, `/portal`, `/admin` (middleware.ts:3) en vérifiant uniquement la **présence** d'un cookie de session (`better-auth.session_token` ou `__Secure-better-auth.session_token`, middleware.ts:16-18) — **aucune vérification de rôle, aucune vérification d'appartenance à une organisation**.
- `src/proxy.ts` — définit une logique similaire (protège `/dashboard`, `/mon-espace`, src/proxy.ts:3) mais **exporte une fonction nommée `proxy`, pas `middleware`**, et n'est importé nulle part dans le code (`grep -rn "proxy"` ne retourne que `src/proxy.ts` lui-même et un faux positif dans `package-lock.json`). **Ce fichier est mort : il ne s'exécute jamais.**

Conséquence directe : la route `/admin` est « protégée » par le middleware actif alors qu'**aucune page `admin/page.tsx` n'existe** sur le disque (`src/app/admin` absent, vérifié). La route `/mon-espace` (qui existe, `src/app/mon-espace/page.tsx`) n'est protégée par **aucun** des deux fichiers dans leur état actuel (le middleware actif ne liste pas `/mon-espace` dans `PROTECTED_PREFIXES`, middleware.ts:3 ; le fichier qui la protège, `proxy.ts`, est mort).

**Le middleware actif ne fait qu'une chose : vérifier qu'un cookie existe.** Il ne décode pas la session, ne vérifie pas le rôle, ne vérifie pas que l'utilisateur a une organisation. Toute logique d'autorisation fine repose donc entièrement sur les routes API elles-mêmes (voir `03-securite-authz.md`) — le middleware n'offre aucune défense en profondeur pour les pages elles-mêmes (une page `/dashboard/assets/new` s'affichera côté client pour n'importe quel rôle authentifié tant que la route API sous-jacente ne bloque pas la mutation).

### 2.2 Fichier webhook DGateway dupliqué, la meilleure version est morte

**Constaté** : `src/app/api/webhooks/dgateway/` contient deux fichiers :
- `route.ts` — **seul fichier réellement chargé par Next.js**. Aucune vérification de signature (`src/app/api/webhooks/dgateway/route.ts`, lu intégralement : aucune référence à un header de signature ou à un secret). N'importe qui peut POSTer un payload arbitraire et faire passer un `Payment` existant en `COMPLETED`, ce qui déclenche la génération automatique d'une facture (`route.ts:40-51`) et l'activation de la réservation (`route.ts:29-31`).
- `rout.ts` (typo — lettre « e » manquante) — **jamais chargé par Next.js** (le framework exige littéralement `route.ts`). Contient une implémentation plus complète et plus sûre : vérification HMAC conditionnelle via `validateWebhookSignature` (`rout.ts:39`), gestion de `payment.refunded` avec création d'un `Payment` de type `DEPOSIT_REFUND` (`rout.ts:89-107`), notification client (`rout.ts:163-172`), audit log (`rout.ts:175-188`).

C'est un cas net de régression accidentelle : la version la plus aboutie et la plus sûre du webhook de paiement a été écrite puis n'a jamais pu s'exécuter à cause d'une faute de frappe dans le nom de fichier, et la version en production (`route.ts`) est la version dégradée sans aucune authentification. Voir `11-backlog-p0.md` pour l'action corrective proposée (à valider, non appliquée).

### 2.3 Autres duplications de fichiers/routes détectées par fautes de frappe

**Constaté**, à vérifier route par route dans `04-workflows.md` (quel côté frontend appelle quelle route) :

| Chemin correct présumé | Chemin dupliqué/fauté présent |
|---|---|
| `src/app/api/v1/payments/intent/route.ts` | `src/app/api/v1/payements/intent/route.ts` |
| `src/app/api/v1/bookings/[id]/schuedule/route.ts` *(sic, faute conservée)* | page frontend correctement nommée `src/app/(dashboard)/dashboard/bookings/[id]/schedule/page.tsx` |
| — | `src/app/api/v1/bookings/[id]/chekin/route.ts` *(faute de frappe, "checkin" attendu)* |

Ces deux répertoires API (`payements` et `payments`) coexistent tous les deux comme fichiers `route.ts` valides — contrairement au cas `rout.ts`/`route.ts`, **les deux sont donc potentiellement actifs**, ce qui pose la question de savoir lequel le frontend appelle réellement (traité dans `04-workflows.md`).

### 2.4 Fichier hors convention documentée

**Constaté** : `src/app/lib/sectorLogic.ts` existe et contient une logique métier substantielle par secteur (calcul kilométrage véhicule, échéancier de loyer immobilier avec révision IPC, résolution de caution équipement, suppléments hôteliers — voir `08-data-model-cible.md` / question sectorielle). CLAUDE.md documente `Utils : src/lib/utils.ts` et une arborescence `src/lib/` pour toute la logique partagée — `src/app/lib/` n'est pas un chemin documenté. Le commentaire en tête de fichier (`sectorLogic.ts:1`, `// src/lib/sector-logic.ts`) indique que le fichier a probablement été déplacé ou dupliqué à un moment donné et n'a pas été remis à l'emplacement prévu.

**Usage réel (constaté par grep)** : parmi les 7 fonctions exportées, seules `calcKmReturn`, `checkVehicleAlerts` et `generateMonthlySchedule` ont des appelants trouvés (dans les routes `chekin`, `inspection`, `schuedule`, `return-km`). `calcHotelTotal`, `calcNights`, `calcRentRevision`, `calcDepositResolution` et `compareInspectionStates` n'ont **aucun appelant détecté** ailleurs dans `src/` — hypothèse à vérifier (le grep peut manquer un import dynamique, mais c'est improbable ici) : code mort ou fonctionnalité commencée puis abandonnée.

## 3. Variables d'environnement (constaté, noms et longueurs de valeur seulement — aucun secret exposé dans ce rapport)

| Variable | Lue par le code (`src/`) | Définie `.env` | Définie `.env.local` | Vide/placeholder |
|---|---|---|---|---|
| `DATABASE_URL` | oui (Prisma) | oui | absente (héritée de `.env`) | non |
| `BETTER_AUTH_URL` | oui (`src/lib/auth.ts:7`) | oui | oui | non |
| `BETTER_AUTH_SECRET` | lue en interne par Better Auth (pas de `process.env` direct dans `src/`) | oui | oui | non |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | oui (`src/lib/auth.ts:20-21`) | oui | oui | non |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | oui | oui | oui | non |
| `NEXT_PUBLIC_APP_URL` | oui | oui | oui | non |
| `DGATEWAY_API_URL` | oui (`src/lib/payment/dgateway.ts`) | oui | oui | non |
| `DGATEWAY_API_KEY` | oui | oui, **placeholder vide (2 caractères = `""`)** | oui, **placeholder vide (3 car.)** | **oui — vide** |
| `DGATEWAY_WEBHOOK_SECRET` | oui, mais uniquement dans le fichier mort `rout.ts:37` (jamais exécuté) — **le webhook actif `route.ts` ne lit pas du tout cette variable** | **absente des trois fichiers `.env*`** | absente | absente |
| `YOUSIGN_API_URL` | oui (`send-signature/route.ts:52`, `webhooks/yousign/route.ts:31`) | oui | oui | non |
| `YOUSIGN_API_KEY` | oui, avec assertion non-null `!` (`send-signature/route.ts:53`) | oui, **placeholder vide (2 car.)** | oui, **placeholder vide (3 car.)** | **oui — vide** |
| `YOUSIGN_WEBHOOK_SECRET` | oui, vérification conditionnelle (`webhooks/yousign/route.ts:9-17`) | **absente** | **absente** | absente → vérification de signature toujours désactivée en l'état |
| `CLOUDFLARE_R2_*` (5 variables) | **aucune occurrence dans `src/`** | oui (déclarées) | oui (déclarées, certaines vides) | non câblées côté code quoi qu'il en soit |
| `NEXT_PUBLIC_API_URL` | non trouvée dans `src/` par le grep `process.env.` | absente `.env` | présente `.env.local` | probablement inutilisée — à confirmer |

**Comportement en cas d'absence, constaté** :
- `YOUSIGN_API_KEY` vide → `send-signature/route.ts:53` construit `Bearer ` (vide) → l'appel YouSign échoue avec un statut non-`ok` → `throw new Error(...)` (`send-signature/route.ts:69`) → capturé par le `catch` englobant → réponse **500** (`send-signature/route.ts:151`). Confirme et sourcemap précisément le constat de la mission (§4.5 du brief).
- `DGATEWAY_WEBHOOK_SECRET` absente **et** non lue par le fichier actif → aucun impact d'échec, mais absence totale de protection (voir §2.2 et `03-securite-authz.md`).
- `CLOUDFLARE_R2_*` définies mais non lues → échec silencieux total : le code ne tente jamais R2, bascule sur stockage local sans qu'aucune configuration ne le signale.

## 4. Cartographie des routes API (constaté, `find src/app/api -name route.ts`)

41 fichiers `route.ts` sous `src/app/api/`. Répartition :
- `api/auth/[...all]/route.ts` — catch-all Better Auth
- `api/v1/*` — 37 routes métier
- `api/webhooks/{dgateway,yousign}/route.ts` — 2 webhooks (+ 1 fichier mort `dgateway/rout.ts`)

Détail rôle/auth/tenant par route : voir `03-securite-authz.md`.

## 5. Cartographie des pages (constaté, `find src/app -name page.tsx`)

40 fichiers `page.tsx` répartis en 4 groupes de routes Next.js : `(dashboard)`, `(portal)`, `(public)`, plus `auth/`, `mon-espace/`, `onboarding/`, et la page racine.

Routes documentées dans CLAUDE.md mais **absentes du disque** (constaté) : `/dashboard/invoices`, `/dashboard/maintenance`, `/dashboard/notifications`, `/admin`, `/admin/organizations`. Détail des liens morts associés : voir `05-ux.md`.

## 6. Arborescence (profondeur 4, hors `node_modules`/`.next`/`generated`/`.git`)

Voir sortie brute de cartographie STEP 1 (fournie en tout début de mission) pour le détail complet. Points structurants :
- `src/generated/prisma` — client Prisma généré (conforme à CLAUDE.md)
- `prisma.config.ts` à la racine — **constaté conforme** à la règle absolue #5 : `datasource.url: process.env.DATABASE_URL ?? ''` déclaré dans `prisma.config.ts:10-12` ; `schema.prisma` (lu intégralement) ne contient que `provider = "postgresql"` dans le bloc `datasource db` (schema.prisma:7-9), sans `url`.
- Un seul dossier `src/lib/` documenté, mais logique métier dispersée aussi dans `src/app/lib/` (voir §2.4)
- `public/uploads/{assets,covers,logos}` contient des fichiers déjà uploadés — confirme le stockage local actif en production/dev, contredisant la doc R2 de CLAUDE.md pour ce périmètre précis
