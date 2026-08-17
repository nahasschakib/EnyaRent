# Audit 04 — Traçage du workflow métier bout en bout

Chaîne auditée :
`inscription → organisation → asset → client → booking → contrat → signature électronique → état des lieux ENTRY → paiement → facture → état des lieux EXIT → restitution caution`

Méthode : lecture directe des pages, composants et routes API concernés (voir chemins cités). Toute affirmation est **constatée** (lue dans le code) sauf mention explicite « hypothèse à vérifier ».

---

## 1. Tableau de synthèse

| Étape | État | Preuve (fichier:ligne) | Rupture de chaîne |
|---|---|---|---|
| Inscription (sign-up) | **implémenté** | `src/app/auth/sign-up/page.tsx:112` POST `/api/v1/auth/complete-signup` ↔ `src/app/api/v1/auth/complete-signup/route.ts:18` | non |
| Création organisation (via sign-up PROFESSIONAL) | **implémenté** | `src/app/api/v1/auth/complete-signup/route.ts:38-57` crée `db.organization` + assigne `role: "PROFESSIONAL"` | non |
| Création organisation (onboarding standalone) | **implémenté** | `src/app/onboarding/page.tsx:20` POST `/api/v1/organizations` ↔ `src/app/api/v1/organizations/route.ts:5-47` (assigne `role: "ADMIN"`) | non |
| Création asset | **implémenté** | `src/components/assets/AssetForm.tsx:408` POST `/api/v1/assets` ↔ `src/app/api/v1/assets/route.ts:172-262` (validation sectorielle + `guard(req,"asset:create")`) | non |
| Création client | **implémenté** | `src/app/(dashboard)/dashboard/customers/new/page.tsx:63` POST `/api/v1/customers` ↔ `src/app/api/v1/customers/route.ts:58-122` (garant optionnel inclus) | non |
| Réservation (booking) | **implémenté** | `src/app/(dashboard)/dashboard/bookings/new/page.tsx:72` POST `/api/v1/bookings` ↔ `src/app/api/v1/bookings/route.ts:60-143` (vérifie conflit via `checkConflict`, email de confirmation) | non |
| Contrat (génération) | **implémenté** | `src/app/(dashboard)/dashboard/bookings/[id]/page.tsx:73` POST `/api/v1/contracts` ↔ `src/app/api/v1/contracts/route.ts:51-127` | non |
| Contrat (PDF) | **implémenté** | `src/app/(dashboard)/dashboard/contracts/[id]/page.tsx:80` POST `/api/v1/contracts/{id}/pdf` ↔ `src/app/api/v1/contracts/[id]/pdf/route.ts:219-313` — 4 templates sectoriels réels (`@react-pdf/renderer`) | non, mais `uploadToR2` (ligne 14-18) est un stub qui renvoie un `data:` URL base64 au lieu d'un vrai upload R2 |
| Signature électronique (envoi) | **partiel** | `src/app/(dashboard)/dashboard/contracts/[id]/page.tsx:105` POST `/api/v1/contracts/{id}/send-signature` ↔ route complète (`src/app/api/v1/contracts/[id]/send-signature/route.ts`) | non côté code, **oui côté environnement** : `YOUSIGN_API_KEY=""` dans `.env` et `.env.local` (confirmé lignes 28/18) → tout appel à l'API YouSign échouera avec un header `Authorization: Bearer ` vide, provoquant un 500 |
| Signature électronique (webhook retour) | **implémenté** | `src/app/api/webhooks/yousign/route.ts:1-99` — vérifie HMAC si `YOUSIGN_WEBHOOK_SECRET` défini, met le contrat à `SIGNED`, notifie l'ADMIN, envoie un email | non (mais dépend de l'étape précédente pour être atteint en pratique) |
| État des lieux ENTRY (équipement) | **implémenté** | `src/components/bookings/EquipmentInspectionForm.tsx:35` POST `/api/v1/bookings/{id}/inspection` ↔ `src/app/api/v1/bookings/[id]/inspection/route.ts:99-213` — refuse la création si `booking.contract` absent (ligne 124-129) | non |
| État des lieux ENTRY (hôtellerie, "check-in") | **absent (rupture de route)** | `src/components/bookings/HotelCheckinForm.tsx:45` fetch `/api/v1/bookings/{bookingId}/checkin` — **aucun fichier route à ce chemin** ; le fichier réel est `src/app/api/v1/bookings/[id]/chekin/route.ts` (dossier `chekin`, faute de frappe) | **oui** — 404 garanti, la fonctionnalité check-in hôtelier est inaccessible depuis l'UI |
| État des lieux ENTRY (immobilier, "planifier"/échéancier) | **absent (rupture de route)** | `src/app/(dashboard)/dashboard/bookings/[id]/schedule/page.tsx:58` fetch `/api/v1/bookings/{bookingId}/schedule` — **aucun fichier route à ce chemin** ; le fichier réel est `src/app/api/v1/bookings/[id]/schuedule/route.ts` (dossier `schuedule`, faute de frappe) | **oui** — 404 garanti sur GET et POST (révision IPC) |
| Paiement (portail client, DGateway) | **implémenté** | `src/app/(portal)/portal/pay/[bookingId]/page.tsx:90` POST `/api/v1/payments/intent` ↔ `src/app/api/v1/payments/intent/route.ts:14-93` (orthographe correcte, chemin vérifié) | non |
| Paiement (route dupliquée orpheline) | **absent (mort)** | `src/app/api/v1/payements/intent/route.ts` existe mais aucune référence `payements` (faute de frappe) n'a été trouvée dans `src/` — code mort, jamais appelé | non pour la chaîne réelle (le bon chemin est utilisé), mais confusion / dette |
| Paiement (webhook DGateway confirmation) | **partiel** | Route réellement servie : `src/app/api/webhooks/dgateway/route.ts:4-62` — **aucune vérification de signature** (le fichier avec vérification HMAC, `validateWebhookSignature`, se trouve dans `src/app/api/webhooks/dgateway/rout.ts`, nommé `rout.ts` sans "e" finale — Next.js App Router n'exécute que les fichiers nommés exactement `route.ts`, donc ce code plus complet est **mort**, jamais exécuté) | **oui** — la version vivante ne vérifie pas la signature du webhook (n'importe qui peut POST un faux événement `payment.completed`) |
| Paiement manuel (espèces/chèque/virement) | **partiel** | Route API complète et fonctionnelle : `src/app/api/v1/payments/manual/route.ts:16-134`. Composant `src/components/payments/ManualPaymentForm.tsx` existe et appelle cette route (ligne 39) | **oui** — `ManualPaymentForm` n'est importé nulle part ailleurs dans `src/` (recherche exhaustive) : composant orphelin, jamais monté dans une page. Aucun bouton "Ajouter un paiement" dans `src/app/(dashboard)/dashboard/bookings/[id]/page.tsx` (section Paiements, lignes 311-337, purement en lecture) |
| Facture / quittance (génération auto) | **implémenté** | Générée automatiquement dans le webhook DGateway vivant (`route.ts:34-51`) et dans `payments/manual/route.ts:88-110` — `db.invoice.create` avec calcul TVA 20% | non |
| Facture (page dashboard) | **absent** | Aucun fichier `src/app/(dashboard)/dashboard/invoices/page.tsx` (confirmé par `Glob` — 0 résultat), alors que le menu latéral y renvoie : `src/components/dashboard/sidebar.tsx:65` `{ href: "/dashboard/invoices", ... }` | **oui** — lien de navigation vers une page inexistante (404 App Router) |
| Facture (portail client) | **implémenté** | `src/app/(portal)/portal/documents/page.tsx:18` GET `/api/v1/portal/documents` — liste contrats/factures/quittances, ouverture PDF | non |
| État des lieux EXIT (équipement) | **implémenté** | Même route que ENTRY : `src/app/api/v1/bookings/[id]/inspection/route.ts:167-192` calcule `depositResolution` via `calcDepositResolution` + `compareInspectionStates` | non |
| Restitution caution (deposit refund) — calcul | **implémenté** | `calcDepositResolution` appelé et renvoyé dans la réponse JSON de POST/GET `inspection` (`route.ts:84-90` et `168-191`) — mais **jamais persisté** comme paiement | — |
| Restitution caution (deposit refund) — exécution paiement | **absent en pratique / partiel en théorie** | Type `DEPOSIT_REFUND` défini dans l'enum Prisma (`src/generated/prisma/enums.ts:103`) et accepté par `payments/manual/route.ts:10` (zod enum) et par le webhook mort `rout.ts:94-106` | **oui** — 3 chemins possibles pour créer un `Payment` de type `DEPOSIT_REFUND`, et les 3 sont inatteignables : (1) `ManualPaymentForm` n'offre que `RENT`/`DEPOSIT` dans son sélecteur (`ManualPaymentForm.tsx:69-73`, pas de `DEPOSIT_REFUND`) ; (2) le composant lui-même est orphelin (voir ligne "Paiement manuel" ci-dessus) ; (3) la logique de remboursement automatique via webhook `payment.refunded` existe uniquement dans `rout.ts` (fichier mort, jamais routé par Next.js) |

---

## 2. Ruptures de chaîne critiques

### 2.1 Check-in hôtelier — 404 garanti
- Frontend : `src/components/bookings/HotelCheckinForm.tsx:45` → `fetch(`/api/v1/bookings/${bookingId}/checkin`, { method: "POST" })`
- Backend réel : `src/app/api/v1/bookings/[id]/chekin/route.ts` (dossier `chekin`, sans le second "c")
- Le commentaire d'en-tête du fichier lui-même dit `// src/app/api/v1/bookings/[id]/checkin/route.ts` (ligne 1) — preuve que le développeur visait le chemin correct mais a créé le dossier avec une faute de frappe.
- Constaté : aucun dossier `checkin/` n'existe sous `src/app/api/v1/bookings/[id]/` (vérifié par `Glob`). Le clic sur "Enregistrer le check-in" dans la modale de `src/app/(dashboard)/dashboard/bookings/[id]/page.tsx` échouera systématiquement (404).

### 2.2 Échéancier / révision de loyer immobilier — 404 garanti
- Frontend : `src/app/(dashboard)/dashboard/bookings/[id]/schedule/page.tsx:58` (GET) et `:66` (POST) → `/api/v1/bookings/${bookingId}/schedule`
- Backend réel : `src/app/api/v1/bookings/[id]/schuedule/route.ts` (dossier `schuedule`)
- Même schéma que ci-dessus : le commentaire d'en-tête du fichier route dit `// src/app/api/v1/bookings/[id]/schedule/route.ts` (ligne 1).
- Constaté : aucun dossier `schedule/` sous `src/app/api/v1/bookings/[id]/`. La page `/dashboard/bookings/{id}/schedule` (elle, correctement nommée) affichera un état de chargement infini / erreur, car son `useQuery` échoue toujours.

### 2.3 Webhook DGateway vivant sans vérification de signature, version sécurisée jamais exécutée
- Fichier réellement routé par Next.js : `src/app/api/webhooks/dgateway/route.ts` (62 lignes) — ne vérifie aucune signature, ne gère pas `payment.refunded`.
- Fichier contenant la vraie logique (vérification HMAC `validateWebhookSignature`, gestion complète de `payment.refunded` avec création d'un `Payment` `DEPOSIT_REFUND`) : `src/app/api/webhooks/dgateway/rout.ts` — nommé `rout.ts` (il manque le "e" final). Next.js App Router n'exécute que les fichiers strictement nommés `route.ts` dans un dossier ; ce fichier est donc **du code mort**, jamais atteint par une requête HTTP.
- Conséquence directe sur la chaîne : la boucle de remboursement de caution déclenchée par DGateway (`payment.refunded` → création `DEPOSIT_REFUND`) n'existe pas dans le chemin réellement exécuté.

### 2.4 Restitution de caution — calcul présent, exécution absente
- Le calcul du montant à restituer (`calcDepositResolution`) est correctement effectué côté serveur dès qu'un état des lieux EXIT est créé (`src/app/api/v1/bookings/[id]/inspection/route.ts:167-191`), et renvoyé au frontend (`EquipmentInspectionForm.tsx` reçoit `depositResolution` dans son callback `onSuccess`, ligne 12).
- Mais ce résultat n'est stocké nulle part et ne déclenche aucune écriture de `Payment`. Aucun bouton, aucune route accessible depuis l'UI ne permet de matérialiser ce remboursement :
  - `ManualPaymentForm.tsx` (le seul composant capable d'appeler `payments/manual` avec un `type` choisi) ne propose que `RENT` et `DEPOSIT` (lignes 70-73) — pas `DEPOSIT_REFUND`, bien que l'API l'accepte.
  - `ManualPaymentForm` n'est importé/monté dans aucune page (`Grep "ManualPaymentForm"` dans `src/` → 1 seul résultat, le fichier lui-même).
  - La voie automatique via webhook DGateway `payment.refunded` existe seulement dans le fichier mort `rout.ts` (§2.3).
- Conclusion : la restitution de caution est **absente en pratique**, bien que le modèle de données et une partie de la logique métier existent.

### 2.5 Page facture dashboard manquante mais liée dans le menu
- `src/components/dashboard/sidebar.tsx:65` référence `/dashboard/invoices`.
- Aucun fichier `src/app/(dashboard)/dashboard/invoices/page.tsx` n'existe (confirmé par recherche de fichiers, 0 résultat). Un ADMIN/MANAGER cliquant sur "Factures" dans le menu obtiendra une 404 Next.js.
- Les factures existent bel et bien en base (`db.invoice.create` fonctionne, cf. §1) et sont visibles côté client via `/portal/documents`, mais il n'y a **aucune vue de gestion côté organisation**.

### 2.6 Signature électronique bloquée par configuration d'environnement
- Code applicatif complet et cohérent (`send-signature/route.ts`, webhook `yousign/route.ts`).
- Mais `.env:28` et `.env.local:18` contiennent `YOUSIGN_API_KEY=""`. L'appel `fetch(...,{ headers: { Authorization: `Bearer ${apiKey}` } })` avec `apiKey` vide (`send-signature/route.ts:53-54`) échouera côté API YouSign, provoquant un statut non-`ok` et donc un `throw new Error(...)` intercepté par le `catch` global (ligne 149-152), qui renvoie une 500 au frontend. C'est un blocage d'environnement, pas un bug de code — confirmé, pas re-dérivé (déjà signalé dans le contexte de la tâche).

### 2.7 Route de paiement dupliquée mais inoffensive (dette, pas rupture)
- `src/app/api/v1/payements/intent/route.ts` (faute de frappe "payements") existe en parallèle de la version correcte `src/app/api/v1/payments/intent/route.ts`.
- Recherche exhaustive (`Grep "payements"` dans `src/`) : aucune référence dans le frontend. Le composant `portal/pay/[bookingId]/page.tsx` appelle bien le chemin correct `/api/v1/payments/intent`. Ce doublon est du code mort inoffensif pour la chaîne, mais une source de confusion pour la maintenance.

### 2.8 Deux implémentations concurrentes pour créer un état des lieux
- `src/app/api/v1/inspections/route.ts` (utilisée par `dashboard/contracts/[id]/page.tsx:139`, formulaire libre sans champ `condition` obligatoire, sans calcul de caution, sans vérification anti-doublon de type ENTRY/EXIT).
- `src/app/api/v1/bookings/[id]/inspection/route.ts` (utilisée par `EquipmentInspectionForm.tsx`, exige `condition`, empêche les doublons, calcule `depositResolution`).
- Les deux écrivent dans la même table `Inspection` liée au même `contractId`. Il n'y a pas de rupture de chaîne au sens 404, mais une incohérence fonctionnelle : un utilisateur passant par la page contrat peut créer un état des lieux sans condition renseignée ni calcul de caution, contournant la logique métier de la route "riche".

---

## 3. Constaté vs hypothèse à vérifier

Tout ce qui précède est **constaté** par lecture directe du code (chemins de fichiers, numéros de ligne cités). Aucune exécution réelle de l'application n'a été effectuée (audit strictement en lecture, aucune modification, aucun `pnpm dev`).

Une seule zone reste à la limite de l'hypothèse :
- **Hypothèse à vérifier** : le rôle `PROFESSIONAL` attribué par `complete-signup/route.ts:76` (au lieu de `ADMIN`, documenté dans `CLAUDE.md`) est correctement couvert dans la matrice de permissions (`src/lib/authz.ts:5-23`, `PERMISSIONS` inclut `PROFESSIONAL` partout où `ADMIN` apparaît). Le comportement observé dans le code est cohérent, mais je n'ai pas testé un parcours réel bout en bout (inscription → connexion → création d'asset) pour confirmer l'absence d'effet de bord runtime.
