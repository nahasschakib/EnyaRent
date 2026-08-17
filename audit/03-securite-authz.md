# Audit 03 — Sécurité AuthZ / Isolation multi-tenant

Périmètre : toutes les routes sous `src/app/api/v1/`, `src/app/api/webhooks/`, `src/app/api/auth/`.
Méthode : lecture directe de chaque handler exporté (GET/POST/PUT/PATCH/DELETE). Chaque ligne du tableau est **constatée** (lue dans le code) sauf mention explicite « hypothèse à vérifier ».

Rappel de contexte déjà établi (non re-vérifié ici) :
- `src/lib/authz.ts` → `guard(req, permission)` est le seul mécanisme centralisé (session + permission + résolution `organizationId` depuis la DB). Utilisé dans **2 fichiers seulement** : `src/lib/authz.ts` (définition) et `src/app/api/v1/assets/route.ts` (GET/POST).
- `middleware.ts` ne vérifie que la présence d'un cookie de session sur `/dashboard`, `/portal`, `/admin` — aucun contrôle de rôle ni de tenant.
- `src/proxy.ts` est du code mort (jamais chargé par Next.js).
- `src/app/api/webhooks/dgateway/route.ts` (fichier réellement chargé) n'a **aucune vérification de signature** — confirmé ci-dessous, ligne exacte incluse.
- `src/app/api/webhooks/dgateway/rout.ts` (faute de frappe, jamais chargé par Next.js) contient `validateWebhookSignature`.

---

## 1. Tableau détaillé par route × méthode

| Route | Méthode | Auth vérifiée | Rôle vérifié | Isolation tenant | `guard()` | Fichier:ligne |
|---|---|---|---|---|---|---|
| `/api/auth/[...all]` | GET/POST | Délégué à Better Auth (`toNextJsHandler`) | N/A (auth système) | N/A | Non | `src/app/api/auth/[...all]/route.ts:4` |
| `/api/v1/analytics` | GET | Oui | Non (tout rôle avec org) | Oui (`orgId` partout) | Non | `src/app/api/v1/analytics/route.ts:18-26` |
| `/api/v1/assets/[id]/availability-blocks` | POST | Oui | Non | Oui (asset vérifié par `id+organizationId` avant écriture) | Non | `src/app/api/v1/assets/[id]/availability-blocks/route.ts:9-22` |
| `/api/v1/assets/[id]/availability-blocks` | DELETE | Oui | Non | Oui (`assetId` déjà vérifié tenant, `blockId` filtré par `assetId`) | Non | `.../availability-blocks/route.ts:55-76` |
| `/api/v1/assets/[id]/photos` | POST | Oui | Non | Oui | Non | `src/app/api/v1/assets/[id]/photos/route.ts:20-36` |
| `/api/v1/assets/[id]/photos` | DELETE | Oui | Non | Oui | Non | `.../photos/route.ts:82-98` |
| `/api/v1/assets/[id]/published` | PATCH | Oui | Non | Oui | Non | `src/app/api/v1/assets/[id]/published/route.ts:10-27` |
| `/api/v1/assets/[id]` | GET | Oui | Non | Oui | Non | `src/app/api/v1/assets/[id]/route.ts:9-25` |
| `/api/v1/assets/[id]` | PUT | Oui | Non — **`asset:update` selon `PERMISSIONS` exclut CLIENT mais rien ici ne le fait respecter** | Oui | Non | `.../assets/[id]/route.ts:54-69` |
| `/api/v1/assets/[id]` | DELETE | Oui | Non — **`asset:delete` selon `PERMISSIONS` exclut MANAGER, mais cette route ad-hoc ne vérifie aucun rôle : un MANAGER peut supprimer un asset** | Oui | Non | `.../assets/[id]/route.ts:118-133` |
| `/api/v1/assets/fleet` | GET | Oui | Non | Oui | Non | `src/app/api/v1/assets/fleet/route.ts:18-26` |
| `/api/v1/assets` | GET | Oui | Oui (`asset:read`) | Oui (`g.organizationId`) | **Oui** | `src/app/api/v1/assets/route.ts:102,129` |
| `/api/v1/assets` | POST | Oui | Oui (`asset:create`) | Oui | **Oui** | `.../assets/route.ts:174,220` |
| `/api/v1/asset-types` | GET | Oui | Non | Oui | Non | `src/app/api/v1/asset-types/route.ts:7-23` |
| `/api/v1/asset-types` | POST | Oui | Non | Oui | Non | `.../asset-types/route.ts:36-58` |
| `/api/v1/auth/complete-signup` | POST | Oui | Non (rôle choisi par le client, restreint à une whitelist) | N/A (crée l'org) | Non | `src/app/api/v1/auth/complete-signup/route.ts:20-32` |
| `/api/v1/availability` | GET | Oui | Non | Oui | Non | `src/app/api/v1/availability/route.ts:7-26` |
| `/api/v1/bookings/[id]/chekin` | POST | Oui | Non | **Vulnérable (voir IDOR §2.1)** | Non | `src/app/api/v1/bookings/[id]/chekin/route.ts:52-61` |
| `/api/v1/bookings/[id]/chekin` | PUT | Oui | Non | **Vulnérable (IDOR §2.1)** | Non | `.../chekin/route.ts:156-165` |
| `/api/v1/bookings/[id]/inspection` | GET | Oui | Non | **Vulnérable (IDOR §2.1)** | Non | `src/app/api/v1/bookings/[id]/inspection/route.ts:40-49` |
| `/api/v1/bookings/[id]/inspection` | POST | Oui | Non | **Vulnérable (IDOR §2.1)** | Non | `.../inspection/route.ts:104-113` |
| `/api/v1/bookings/[id]/return-km` | PUT | Oui | Non | Oui — pattern correct (fetch par id puis comparaison manuelle `organizationId`, rejette si mismatch même si `orgId` est `null`) | Non | `src/app/api/v1/bookings/[id]/return-km/route.ts:21-44` |
| `/api/v1/bookings/[id]` | GET | Oui | Non | Oui (`findFirst` avec `organizationId`) | Non | `src/app/api/v1/bookings/[id]/route.ts:9-22` |
| `/api/v1/bookings/[id]` | PUT | Oui | Non | Oui | Non | `.../bookings/[id]/route.ts:41-55` |
| `/api/v1/bookings/[id]` | DELETE | Oui | Non | Oui | Non | `.../bookings/[id]/route.ts:106-120` |
| `/api/v1/bookings/[id]/schuedule` | GET | Oui | Non | **Vulnérable (IDOR §2.1)** | Non | `src/app/api/v1/bookings/[id]/schuedule/route.ts:18-27` |
| `/api/v1/bookings/[id]/schuedule` | POST | Oui | Non | **Vulnérable (IDOR §2.1)** | Non | `.../schuedule/route.ts:96-105` |
| `/api/v1/bookings` | GET | Oui | Non | Oui | Non | `src/app/api/v1/bookings/route.ts:9-29` |
| `/api/v1/bookings` | POST | Oui | Non | Oui (`asset`/`customer` re-vérifiés dans l'org avant création) | Non | `.../bookings/route.ts:62-91` |
| `/api/v1/contracts/[id]/pdf` | POST | Oui | Non | Oui (`fetchContract` compare `contract.organizationId !== orgId`) | Non | `src/app/api/v1/contracts/[id]/pdf/route.ts:224-240,213` |
| `/api/v1/contracts/[id]` | GET | Oui | Non | Oui | Non | `src/app/api/v1/contracts/[id]/route.ts:9-21` |
| `/api/v1/contracts/[id]` | PUT | Oui | Non | Oui | Non | `.../contracts/[id]/route.ts:44-57` |
| `/api/v1/contracts/[id]/send-signature` | POST | Oui | Non (déjà signalé — aucune restriction ADMIN/MANAGER) | Oui | Non | `src/app/api/v1/contracts/[id]/send-signature/route.ts:11-24` |
| `/api/v1/contracts` | GET | Oui | Non | Oui | Non | `src/app/api/v1/contracts/route.ts:8-25` |
| `/api/v1/contracts` | POST | Oui | Non | Oui (`booking` re-vérifié dans l'org) | Non | `.../contracts/route.ts:53-70` |
| `/api/v1/customers/[id]` | GET | Oui | Non | Oui | Non | `src/app/api/v1/customers/[id]/route.ts:9-25` |
| `/api/v1/customers/[id]` | PUT | Oui | Non | Oui | Non | `.../customers/[id]/route.ts:51-66` |
| `/api/v1/customers/[id]` | DELETE | Oui | Non | Oui | Non | `.../customers/[id]/route.ts:131-145` |
| `/api/v1/customers` | GET | Oui | Non | Oui | Non | `src/app/api/v1/customers/route.ts:7-27` |
| `/api/v1/customers` | POST | Oui | Non | Oui | Non | `.../customers/route.ts:60-83` |
| `/api/v1/inspections` | POST | Oui | Non | Oui (`contract` re-vérifié dans l'org) | Non | `src/app/api/v1/inspections/route.ts:7-26` |
| `/api/v1/organizations` | POST | Oui | **Aucune** — voir §2.2 | N/A (crée un nouveau tenant) | Non | `src/app/api/v1/organizations/route.ts:8,34-40` |
| `/api/v1/organizations/settings` | GET | Oui (via `getOrgId`) | Non | Oui | Non | `src/app/api/v1/organizations/settings/route.ts:17-21` |
| `/api/v1/organizations/settings` | PATCH | Oui | **Aucune** — voir §2.3 | Oui | Non | `.../organizations/settings/route.ts:43-66` |
| `/api/v1/payements/intent` (typo, dupliqué) | POST | Oui | Non | Oui — pattern correct (fetch sans filtre org, puis vérif `isClient`/`isManager` avant tout accès) | Non | `src/app/api/v1/payements/intent/route.ts:16-40` |
| `/api/v1/payments/intent` | POST | Oui | Non | Oui — même pattern correct | Non | `src/app/api/v1/payments/intent/route.ts:34-76` |
| `/api/v1/payments/manual` | POST | Oui | Oui, ad-hoc (`SUPER_ADMIN`,`ADMIN`,`MANAGER`) | Oui (`booking` fetché avec `organizationId: orgId`) | Non | `src/app/api/v1/payments/manual/route.ts:18-24,45-46` |
| `/api/v1/portal/bookings/[id]/payment-info` | GET | Oui | Non (portail client — vérif ownership par email) | Oui — `isClient`/`isManager` | Non | `src/app/api/v1/portal/bookings/[id]/payment-info/route.ts:7-30` |
| `/api/v1/portal/bookings` | GET | Oui | Non | Oui (scopé par `customer.email === session.user.email`) | Non | `src/app/api/v1/portal/bookings/route.ts:7-14` |
| `/api/v1/portal/dashboard` | GET | Oui | Non | Oui (idem, scopé par email) | Non | `src/app/api/v1/portal/dashboard/route.ts:11-20` |
| `/api/v1/portal/documents` | GET | Oui | Non | Oui (idem) | Non | `src/app/api/v1/portal/documents/route.ts:7-10` |
| `/api/v1/portal/tickets` | GET | Oui | Non | Oui (`reportedById: session.user.id`) | Non | `src/app/api/v1/portal/tickets/route.ts:14-18` |
| `/api/v1/portal/tickets` | POST | Oui | Non | **Vulnérable (fuite inter-tenant, §2.4)** | Non | `.../portal/tickets/route.ts:41-62` |
| `/api/v1/public/agencies/[slug]` | GET | Non requise (intentionnel) | N/A | Oui (`isPublic: true`, `isPublished: true`) | Non | `src/app/api/v1/public/agencies/[slug]/route.ts:9-34` |
| `/api/v1/public/agencies` | GET | Non requise (intentionnel) | N/A | Oui (`isPublic: true`) | Non | `src/app/api/v1/public/agencies/route.ts:9-24` |
| `/api/v1/public/booking-requests` | POST | Non requise (intentionnel — formulaire public) | N/A | Oui (org résolue par `slug` + `isPublic`, `asset` re-vérifié `organizationId: org.id` + `isPublished`, `customer` scopé `organizationId: org.id`) | Non | `src/app/api/v1/public/booking-requests/route.ts:13-21,36` |
| `/api/v1/tickets/[id]/comments` | GET | Oui | Non | **Aucune (IDOR P0, §2.5)** | Non | `src/app/api/v1/tickets/[id]/comments/route.ts:27-34` |
| `/api/v1/tickets/[id]/comments` | POST | Oui | Non | **Aucune (IDOR P0, §2.5)** | Non | `.../comments/route.ts:52-60` |
| `/api/v1/tickets/[id]` | GET | Oui | Non | **Vulnérable (IDOR §2.1, même pattern `orgId ?? undefined`)** | Non | `src/app/api/v1/tickets/[id]/route.ts:25-32` |
| `/api/v1/tickets/[id]` | PUT | Oui | Non | **Vulnérable (IDOR §2.1)** | Non | `.../tickets/[id]/route.ts:76-83` |
| `/api/v1/tickets` | GET | Oui | Non | Oui (`orgId` vérifié non-null avant requête, ligne 23-24) | Non | `src/app/api/v1/tickets/route.ts:20-35` |
| `/api/v1/tickets` | POST | Oui | Non | Oui (idem) | Non | `.../tickets/route.ts:82-99` |
| `/api/v1/upload/image` | POST | Oui | Non | Non applicable / **path traversal potentiel (§2.6)** | Non | `src/app/api/v1/upload/image/route.ts:11-33` |
| `/api/webhooks/dgateway` (fichier réel `route.ts`) | POST | **Aucune** (pas de vérif de signature) | N/A | Partiel (paiement retrouvé par `id` puis org héritée du `payment`) | Non | `src/app/api/webhooks/dgateway/route.ts:4,11` |
| `/api/webhooks/yousign` | POST | Conditionnelle — HMAC vérifié seulement si `YOUSIGN_WEBHOOK_SECRET` est défini (non défini en environnement actuel, donc vérif désactivée de facto) | N/A | Oui (contrat retrouvé par `yousignRequestId`) | Non | `src/app/api/webhooks/yousign/route.ts:9-17` |

---

## 2. IDOR / fuites inter-tenant

### 2.1 — Pattern `organizationId: orgId ?? undefined` dans `findUnique` — IDOR conditionnel (P0)

**Constaté.** Six endpoints résolvent le tenant ainsi :
```ts
const orgId = await getOrgId(session.user.id);
const booking = await db.booking.findUnique({
  where: { id: bookingId, organizationId: orgId ?? undefined },
  ...
});
```
Fichiers concernés :
- `src/app/api/v1/bookings/[id]/chekin/route.ts:58-61` (POST) et `:162-165` (PUT)
- `src/app/api/v1/bookings/[id]/inspection/route.ts:46-49` (GET) et `:110-113` (POST)
- `src/app/api/v1/bookings/[id]/schuedule/route.ts:24-27` (GET) et `:102-105` (POST)
- `src/app/api/v1/tickets/[id]/route.ts:29-32` (GET) et `:80-83` (PUT)

**Scénario concret** : lorsque `orgId` vaut `null` (comportement documenté de Prisma : une clé `undefined` dans un `where` est ignorée, donc le filtre `organizationId` disparaît silencieusement), la requête devient équivalente à `findUnique({ where: { id: bookingId } })` — c'est-à-dire **sans aucun filtre de tenant**. `orgId` peut être `null` pour tout utilisateur authentifié mais pas encore rattaché à une organisation (`User.organizationId` est nullable dans le schema, cf. contexte déjà établi). Un tel utilisateur peut alors lire/modifier le check-in, l'état des lieux, l'échéancier de loyer ou le ticket support de **n'importe quelle organisation** en devinant/énumérant un `id`. Aucun garde-fou équivalent à celui de `bookings/[id]/return-km/route.ts:42-44` (comparaison manuelle post-fetch qui rejette même si `orgId` est `null`) n'est présent ici.

À contraster avec le pattern correct utilisé dans `return-km`, `payments/intent`, `payements/intent` et `portal/bookings/[id]/payment-info` : fetch sans filtre org puis **comparaison explicite** avant tout accès aux données — ce pattern reste sûr même si `orgId` est `null`.

### 2.2 — `POST /api/v1/organizations` sans restriction de rôle (P1)

**Constaté**, `src/app/api/v1/organizations/route.ts:8-40`. N'importe quel utilisateur authentifié (rôle quelconque, y compris déjà `ADMIN`/`MANAGER`/`OWNER` d'une organisation existante) peut créer une nouvelle organisation et voit son `organizationId` et son `role` **écrasés silencieusement** (`role: "ADMIN"`, ligne 38) sans aucune vérification qu'il n'appartient pas déjà à un tenant. Un `MANAGER` de l'organisation A peut ainsi se détacher de A et devenir `ADMIN` d'une organisation B fraîchement créée.

### 2.3 — `PATCH /api/v1/organizations/settings` sans vérification de rôle (P1)

**Constaté**, `src/app/api/v1/organizations/settings/route.ts:43-66`. La politique centrale (`PERMISSIONS["org:settings"]` dans `src/lib/authz.ts:22`) restreint la modification des paramètres d'organisation à `SUPER_ADMIN`, `PROFESSIONAL`, `ADMIN`, `OWNER` — mais cette route n'utilise pas `guard()` et ne vérifie **aucun rôle** : tout utilisateur rattaché à l'organisation (potentiellement un `MANAGER`, exclu de la policy) peut modifier `name`, `slug`, `logoUrl`, `coverUrl`, `isPublic` de l'organisation.

### 2.4 — `POST /api/v1/portal/tickets` : rattachement à une organisation arbitraire (P0 — fuite de données client)

**Constaté**, `src/app/api/v1/portal/tickets/route.ts:60-62` :
```ts
const orgId = user?.organizationId ?? (
  await db.organization.findFirst({ select: { id: true } })
)?.id;
```
**Scénario concret** : un utilisateur `CLIENT` sans `organizationId` (cas courant pour un client de portail qui n'a pas encore d'organisation propre) qui ouvre un ticket support voit son ticket rattaché à **la première organisation de toute la base de données** (ordre non déterministe, dépend de l'insertion), pas nécessairement celle du bailleur/loueur avec lequel il a réellement une relation. Le contenu du ticket (potentiellement des données personnelles ou une plainte) devient visible dans la file de support d'une organisation totalement tierce via `GET /api/v1/tickets` (dashboard staff de cette organisation).

### 2.5 — `GET`/`POST /api/v1/tickets/[id]/comments` sans aucune isolation tenant (P0)

**Constaté**, `src/app/api/v1/tickets/[id]/comments/route.ts`.
- GET (lignes 27-40) : `db.ticketComment.findMany({ where: { ticketId } })` — le `ticketId` vient directement de l'URL, **aucune vérification que le ticket appartient à l'organisation de l'utilisateur**, ni même que l'utilisateur a un rapport quelconque avec ce ticket.
- POST (lignes 52-81) : `db.supportTicket.findUnique({ where: { id: ticketId } })` (ligne 58-60) sans filtre `organizationId`, puis création d'un commentaire dessus.

**Scénario concret** : n'importe quel utilisateur authentifié (staff d'une organisation A, ou même un `CLIENT` quelconque) peut lire l'intégralité des commentaires de n'importe quel ticket de support de n'importe quelle autre organisation en itérant sur les `id` (CUID/UUID à deviner, mais aucune barrière métier), et peut y **écrire** des commentaires arbitraires qui seront visibles par le déclarant et les mentionnés du ticket ciblé, en usurpant une conversation de support d'un tenant tiers.

### 2.6 — `POST /api/v1/upload/image` : `folder` non validé → traversée de répertoire potentielle (P1, hypothèse à vérifier pour l'exploitabilité complète)

**Constaté**, `src/app/api/v1/upload/image/route.ts:16,29,33` :
```ts
const folder = (formData.get("folder") as string | null) ?? "uploads";
...
const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
await mkdir(uploadDir, { recursive: true });
...
await writeFile(path.join(uploadDir, filename), buffer);
```
`folder` est une chaîne entièrement contrôlée par le client, sans regex/whitelist (contrairement à `slug` dans `organizations/settings` qui, lui, est validé ligne 51). `path.join` ne bloque pas les séquences `../`. **Hypothèse à vérifier** : selon les permissions du process Node, une valeur comme `folder=../../../../tmp/evil` pourrait faire écrire (`mkdir` + `writeFile`) en dehors de `public/uploads/`. Le nom de fichier final est généré aléatoirement (ligne 27), donc l'attaque porte sur le **répertoire cible**, pas sur l'écrasement d'un fichier précis.

### 2.7 — Webhook DGateway sans vérification de signature (P0 — déjà confirmé en contexte, rappelé ici avec ligne)

**Constaté**, `src/app/api/webhooks/dgateway/route.ts:4-9` : aucune vérification HMAC/signature n'est appliquée avant de traiter `event === "payment.completed"` (ligne 24) et de passer un `Payment` à `COMPLETED` (ligne 25) puis générer une facture. `validateWebhookSignature` existe et est exporté dans `src/lib/payment/dgateway.ts:204-219`, mais n'est importé/appelé nulle part dans `route.ts`. Le fichier `rout.ts` (faute de frappe) contient une implémentation qui l'utilise mais n'est jamais chargé par Next.js.

---

## 3. `/api/v1/payments/intent` vs `/api/v1/payements/intent`

**Constaté par grep du frontend** (`fetch("/api/v1/payments/intent", ...)`) : `src/app/(portal)/portal/pay/[bookingId]/page.tsx:90` appelle exclusivement l'orthographe correcte `/api/v1/payments/intent`.

- `src/app/api/v1/payments/intent/route.ts` → **live et utilisé par le frontend**.
- `src/app/api/v1/payements/intent/route.ts` → **live mais non référencé par le frontend**. Contrairement au cas `dgateway/rout.ts` (faute de frappe sur le nom de fichier `route.ts`, donc jamais chargé par Next.js), ici c'est le **nom du dossier** qui contient la faute (`payements` au lieu de `payments`) ; le fichier s'appelle bien `route.ts`, donc Next.js l'enregistre normalement à l'URL `/api/v1/payements/intent`. C'est une route dupliquée, atteignable, avec une logique quasi identique (même schéma Zod, même vérif `isClient`/`isManager`) mais qui constitue une **surface d'attaque supplémentaire non maintenue en parallèle** — un correctif appliqué à `payments/intent` ne serait pas automatiquement répercuté ici (le commentaire d'en-tête ligne 1 du fichier dit même littéralement « `src/app/api/v1/payments/intent/route.ts` », preuve de copier-coller).

---

## 4. Findings P0 — liste courte pour backlog

1. **`src/app/api/v1/tickets/[id]/comments/route.ts:27-40` (GET) et `:52-60` (POST)** — Aucun filtre `organizationId` : lecture et écriture de commentaires sur des tickets de support de n'importe quelle organisation par n'importe quel utilisateur authentifié.
2. **`src/app/api/webhooks/dgateway/route.ts:4-25`** — Aucune vérification de signature webhook : un tiers non authentifié peut POST directement et faire passer n'importe quel paiement à `COMPLETED` (génération de facture incluse).
3. **Pattern `organizationId: orgId ?? undefined`** dans `bookings/[id]/chekin/route.ts:58-61,162-165`, `bookings/[id]/inspection/route.ts:46-49,110-113`, `bookings/[id]/schuedule/route.ts:24-27,102-105`, `tickets/[id]/route.ts:29-32,80-83` — Pour un utilisateur authentifié sans `organizationId`, le filtre tenant est silencieusement ignoré par Prisma, exposant check-in, états des lieux, échéanciers de loyer et tickets de toutes les organisations.
4. **`src/app/api/v1/portal/tickets/route.ts:60-62`** — Un ticket créé par un client sans organisation est rattaché à la première organisation de la base (`findFirst()` sans filtre), exposant potentiellement des données client à un tenant sans rapport.
5. **`src/app/api/v1/upload/image/route.ts:16,29,33`** — Le paramètre `folder` fourni par le client n'est pas validé avant d'être injecté dans un chemin de fichier système (`mkdir`/`writeFile`), risque de traversée de répertoire (hypothèse à vérifier pour l'exploitabilité complète selon permissions OS).

Findings additionnels notables (P1, hors P0 mais à intégrer au backlog) : absence de contrôle de rôle sur `POST /api/v1/organizations` (§2.2), absence de contrôle de rôle sur `PATCH /api/v1/organizations/settings` (§2.3) malgré une policy `org:settings` définie dans `PERMISSIONS`, absence de contrôle de rôle sur `DELETE /api/v1/assets/[id]:118-133` alors que `PERMISSIONS["asset:delete"]` exclut `MANAGER`, et généralisation quasi totale de `guard()` non adoptée (2 usages sur ~45 endpoints audités).
