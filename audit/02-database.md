# 02 — Modèle de données

Source : `prisma/schema.prisma` (509 lignes), lu intégralement. Toutes les références de ligne
ci-dessous pointent vers ce fichier sauf mention contraire.

---

## 1. Enums

```
Role             { SUPER_ADMIN, PROFESSIONAL, ADMIN, MANAGER, OWNER, CLIENT }   (13-20)
OrganizationType { PROFESSIONAL, PERSONAL }                                      (22-25)
AssetStatus, Sector, BookingType, BookingStatus, ContractStatus, InspectionType,
PaymentStatus, PaymentType, InvoiceStatus, TicketStatus, MaintenanceStatus,
Priority, CustomerType
```

### 1.1 Confusion d'axes — `PROFESSIONAL` dans deux enums indépendants (constaté)

`Role.PROFESSIONAL` (13-20) et `OrganizationType.PROFESSIONAL` (22-25) partagent le même
identifiant pour deux dimensions différentes : *qui est l'utilisateur* vs *quel type d'organisation
il gère*. Le flux d'inscription (`src/app/api/v1/auth/complete-signup/route.ts:5,38-57`, lu
intégralement) fait littéralement :

```ts
const VALID_ROLES = ["PROFESSIONAL", "OWNER", "CLIENT"] as const;
if (role === "PROFESSIONAL") {
  // crée une Organization de type "PROFESSIONAL"
  // ET assigne User.role = "PROFESSIONAL"
}
```

Le rôle utilisateur `PROFESSIONAL` n'a **aucune définition opérationnelle propre** ailleurs dans
le code : ce n'est ni un synonyme d'`ADMIN`, ni un rôle avec un jeu de permissions dédié pensé
comme tel. `src/lib/authz.ts:12-22` l'inclut dans presque toutes les permissions (au même niveau
qu'`ADMIN`), ce qui semble être un patch après-coup plutôt qu'une décision de modélisation :
**constaté**, `PROFESSIONAL` apparaît dans 9 des 11 permissions de `PERMISSIONS`, avec exactement
les mêmes droits qu'`ADMIN` sauf `asset:delete`, `contract:manage`, `org:settings` (où il est
absent — asymétrie non expliquée dans le code, hypothèse à vérifier : oubli plutôt qu'intention).

### 1.2 `User.role` n'est pas typé par l'enum `Role`

**Constaté**, `schema.prisma:152` : `role String @default("CLIENT")`. L'enum `Role` existe
(13-20) mais n'est utilisé nulle part comme type de champ dans un modèle — aucune table du schéma
ne référence `Role` comme type. Conséquences :
- Aucune contrainte en base (`CHECK` ou type enum PostgreSQL) empêchant une valeur arbitraire.
- Aucune erreur de compilation TypeScript si une route écrit une valeur de rôle qui n'existe pas
  dans l'enum ni dans `authz.ts:5-7` (`ROLES`, qui duplique manuellement la liste de l'enum Prisma
  — deux sources de vérité distinctes à maintenir en synchronisation manuelle).
- `src/lib/authz.ts:56` fait `session.user.role as Role` — une assertion de type, pas une
  validation runtime.

## 2. Modèles et portée multi-tenant

| Modèle | `organizationId` | Type | Remarque |
|---|---|---|---|
| Organization | — (racine) | — | |
| User | `organizationId String?` (153) | **nullable** | Un `CLIENT` n'a typiquement pas d'organizationId (le flux de complete-signup ne lui en assigne jamais un, `complete-signup/route.ts:58-71` ne couvre que `PROFESSIONAL`/`OWNER`) — voir `04-workflows.md` pour la mécanique réelle de rattachement d'un CLIENT à une organisation via `Customer.email` |
| Session, Account, Verification | absent | — | interne Better Auth, hors périmètre tenant, normal |
| AuditLog | `organizationId String?` (210) | **nullable** | un log d'audit sans organisation est possible — perte de traçabilité potentielle sur les actions SUPER_ADMIN ou pré-onboarding |
| AssetType | `organizationId String` (228) | requis | ✅ |
| Asset | `organizationId String` (239) | requis | ✅ |
| AssetPhoto | **absent** | — | rattaché uniquement via `assetId` (274) → `Asset.organizationId` accessible seulement par jointure. Toute requête directe sur `AssetPhoto` par `id` doit donc systématiquement joindre `Asset` pour vérifier le tenant — point de vigilance signalé pour `03-securite-authz.md` |
| AvailabilityBlock | **absent** | — | idem, via `assetId` (284) |
| Customer | `organizationId String` (295) | requis | ✅ |
| Guarantor | **absent** | — | via `customerId` (317) → `Customer.organizationId` |
| Booking | `organizationId String` (330) | requis | ✅ |
| Contract | `organizationId String` (353) | requis | ✅ |
| Inspection | **absent** | — | via `contractId` (371) → `Contract.organizationId` |
| Payment | `organizationId String` (384) | requis | ✅ |
| Invoice | `organizationId String` (403) | requis | ✅ |
| MaintenanceTicket | `organizationId String` (423) | requis | ✅ |
| SupportTicket | `organizationId String` (444) | requis | ✅ |
| TicketComment | **absent** | — | via `ticketId` (465) → `SupportTicket.organizationId` |
| TicketActivity | **absent** | — | via `ticketId` (478) → idem |
| TicketLabel | `organizationId String` (490) | requis | ✅ |
| Notification | `organizationId String?` (500) | **nullable** | |

**Lecture** : les modèles sans `organizationId` propre (`AssetPhoto`, `AvailabilityBlock`,
`Guarantor`, `Inspection`, `TicketComment`, `TicketActivity`) ne sont pas anormaux en soi — c'est
un choix de normalisation valide tant que **toute** requête Prisma qui les cible passe par une
jointure ou une vérification préalable d'appartenance de leur parent au tenant courant. La
vérification systématique de ce point, fichier par fichier, est faite dans `03-securite-authz.md`.

## 3. Champs `Json` non typés (constaté)

| Modèle.champ | Contenu observé/attendu | Typé où ? |
|---|---|---|
| `Organization.settings` (127) | `@default("{}")`, structure jamais définie dans le schéma | aucun type TS partagé trouvé pour sa forme — à vérifier dans les routes qui l'écrivent (`organizations/settings/route.ts`) |
| `Asset.metadata` (253) | `@default("{}")` — contient au moins les champs sectoriels (`insuranceExpiry`, `vignetteExpiry` lus par `sectorLogic.ts:63,69`) de façon non déclarée dans le schéma malgré l'existence de champs véhicule dédiés et typés juste au-dessus (`immatriculation`, `vin`, `marque`, `modele`, `annee`, `couleur`, 255-260) — **incohérence de modélisation** : certains attributs sectoriels sont des colonnes SQL typées, d'autres vivent dans un blob JSON non typé, sans règle apparente distinguant les deux |
| `Contract.content` (356) | `@default("{}")` | structure du contrat généré, à corréler avec `src/lib/pdf/templates/*` |
| `Inspection.photos` (374), `Inspection.signedBy` (375) | `@default("[]")` / `@default("{}")` | `signedBy` — un exemple de forme est visible dans `src/components/bookings/EquipmentInspectionForm.tsx:43` : `{ name: "Gestionnaire", role: "MANAGER" }`, mais aucune interface TS partagée trouvée pour ce type côté serveur |
| `Payment` — pas de champ Json | — | — |
| `Invoice.lines` (407) | `@default("[]")` — structure `{ label, quantity, unitPrice, total }` observée dans `webhooks/dgateway/route.ts:46` et `rout.ts:215-228` (les deux versions du webhook génèrent la même forme) | cohérent entre les deux fichiers mais non déclaré comme type partagé |
| `SupportTicket.labels` (452) | `@default("[]")` | non audité en détail dans cette passe |
| `TicketComment.attachments` (468) | `@default("[]")` | non audité en détail dans cette passe |
| `TicketActivity.metadata` (481) | `@default("{}")` | non audité en détail dans cette passe |

**Conséquence générale** : aucun de ces champs `Json` n'a de schéma Zod ou de type TypeScript
partagé identifié entre écriture et lecture — le risque de dérive de forme entre deux routes qui
écrivent le même champ (ex. `Invoice.lines`, écrit à l'identique par deux implémentations
concurrentes du webhook DGateway, voir `01-architecture.md` §2.2) est réel et déjà illustré par
le cas du webhook dupliqué.

## 4. Index

**Constaté** : aucune déclaration `@@index` n'est présente nulle part dans `schema.prisma` (509
lignes lues intégralement, recherche du littéral `@@index` infructueuse). Toutes les colonnes
`organizationId` (13 occurrences) et toutes les clés étrangères (`assetId`, `bookingId`,
`customerId`, `contractId`, `ticketId`, etc.) reposent uniquement sur l'index implicite créé par
Prisma/PostgreSQL pour les contraintes `@relation` (index sur la colonne FK elle-même côté
PostgreSQL n'est **pas automatique** sauf si Prisma le génère pour la relation — à vérifier via
`db:studio` ou le SQL généré, hors périmètre de cette lecture statique). Aucun index composite
(ex. `[organizationId, status]` sur `Booking` pour les filtres de dashboard, ou
`[organizationId, createdAt]` pour les listes triées) n'est déclaré. CLAUDE.md prescrit
explicitement `@@index([organizationId])` comme règle multi-tenant (section « Modules Prisma
schema ») — **cette règle n'est appliquée sur aucun modèle**, y compris les modèles ajoutés en
Phase 2 auxquels la règle s'adresse directement.

## 5. Duplications et incohérences de nommage (constaté)

- `Payment.method` (389) est une `String?` libre, sans enum — pas d'énumération des méthodes de
  paiement possibles (CMI, mobile money, virement mentionnés dans CLAUDE.md) malgré l'existence
  d'enums pour presque tous les autres champs de statut du schéma.
- Champs véhicule en français directement sur `Asset` (`immatriculation`, `marque`, `modele`,
  `annee`, `couleur`, 255-260) alors que le reste du schéma est en anglais (`name`, `status`,
  `description`…) — mélange de langue dans les noms de colonnes, à trancher (voir question
  sectorielle, `06-gap-analysis.md`).
- `annee` est typé `String?` (259) plutôt que `Int?` — pas de contrainte numérique sur une année.
- `Customer.score` (303) est `String?` sans que sa sémantique (score de fiabilité ? note libre ?)
  soit documentée dans le schéma ; utilisé en lecture simple dans
  `portal/dashboard/route.ts:104` sans transformation, ce qui suggère un champ texte libre plutôt
  qu'un score calculé.

## 6. Modèles orphelins (déclarés, jamais requêtés) — à confirmer par grep exhaustif

**Hypothèse à vérifier** (non exhaustivement confirmée dans cette passe, portée limitée aux
fichiers lus) : `Guarantor` n'apparaît dans aucun des fichiers API lus jusqu'ici (`customers/*`,
`bookings/*`) — le modèle existe dans le schéma (316-326) et est relié à `Customer` (310) mais
aucune route `db.guarantor.*` n'a été rencontrée pendant cette passe. À confirmer par un grep
dédié `db\.guarantor\.` sur l'ensemble de `src/` avant de le classer comme définitivement mort.

## 7. Synthèse — dette du modèle de données

| Point | Sévérité | Action proposée (à valider — non appliquée) |
|---|---|---|
| `User.role: String` non contraint par l'enum `Role` | Élevée | migrer vers `role Role` typé, avec migration de données pour les valeurs existantes hors enum |
| Aucun `@@index([organizationId])` | Élevée (perf à l'échelle, pas fonctionnel) | ajouter les index composites sur tous les modèles tenant-scopés, en particulier `Booking`, `Payment`, `Invoice` pour les dashboards |
| Confusion `Role.PROFESSIONAL` / `OrganizationType.PROFESSIONAL` | Élevée (sécurité + lisibilité) | clarifier si `PROFESSIONAL` doit devenir un alias d'`ADMIN` à la création du compte, ou un rôle à part entière avec permissions propres définies explicitement |
| Champs `Json` non typés (`Asset.metadata`, `Contract.content`, `Invoice.lines`, etc.) | Moyenne | définir des schémas Zod partagés client/serveur par champ, réutilisés à l'écriture et la lecture |
| Mélange de langue dans les noms de colonnes véhicule | Faible | à trancher lors de la conception du modèle cible multi-secteurs |
