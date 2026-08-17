# 06 — Gap Analysis

Note méthodologique : la colonne **Effort** est laissée à « à estimer » partout où aucune base
chiffrée fiable n'existe (pas de vélocité d'équipe connue, pas de référence de sprint passé
documentée dans le code). Aucune charge n'est inventée. La colonne **Qualité** note ce qui existe
réellement, sur 5, en tenant compte des ruptures constatées dans `03-`, `04-`, `05-`.

Priorité : **P0** bloque l'usage réel du produit — **P1** nécessaire pour vendre — **P2**
différenciant — **P3** vision long terme.

| Domaine | Existe | Qualité (0-5) | Ce qui manque | Effort | Priorité |
|---|---|---|---|---|---|
| Fleet/Assets | Oui — CRUD complet (`assets/route.ts`), vue générique + vue `fleet` spécialisée véhicule (alertes assurance/vignette) | 3 | La vue `fleet` est orpheline (aucun lien de nav, `05-ux.md` §3) ; pas de TCO/dépréciation ; page édition asset absente (`/dashboard/assets/[id]/edit` lien mort, `05-ux.md`) | à estimer | P0 (lien édition), P2 (TCO/dépréciation) |
| Customers | Oui — CRUD complet, garant optionnel (`Guarantor`, hypothèse à vérifier : jamais requêté, `02-database.md` §6) | 3 | Page édition client (`/dashboard/customers/[id]/edit` lien mort) ; usage réel de `Guarantor` à confirmer | à estimer | P1 |
| Bookings | Oui — création, conflits vérifiés (`checkConflict`), statuts, détail | 4 | Rien de bloquant identifié dans la boucle standard | à estimer | — |
| Contracts | Oui — génération, 4 templates PDF sectoriels réels | 4 | `uploadToR2` est un stub base64 (`04-workflows.md` L21) — pas de vrai stockage PDF durable | à estimer | P1 |
| Inspections (états des lieux) | Partiel — deux implémentations concurrentes incohérentes (`04-workflows.md` §2.8) ; ENTRY équipement fonctionnel ; EXIT calcule la caution mais ne la persiste jamais | 2 | Unifier les deux routes de création ; brancher le calcul de caution sur un vrai `Payment` | à estimer | P0 (restitution caution inexploitable) |
| Payments | Partiel — intent DGateway fonctionnel, mais webhook de confirmation sans vérification de signature (P0 sécurité) ; paiement manuel orphelin côté UI | 2 | Sécuriser le webhook ; monter `ManualPaymentForm` dans une page ; ajouter `DEPOSIT_REFUND` à son sélecteur | à estimer | P0 |
| Invoices | Partiel — génération auto fonctionnelle, visible côté portail client | 2 | Aucune vue de gestion côté organisation (`/dashboard/invoices` lien mort vers page inexistante) | à estimer | P0 |
| Maintenance | Modèle `MaintenanceTicket` existe en base, aucune route API ni page dashboard trouvée pour ce modèle spécifiquement (à distinguer de `SupportTicket`, qui lui a des pages `tickets/*`) | 1 | Tout le CRUD et l'UI ; pas de maintenance préventive à échéance (vision cible) | à estimer | P1 (le modèle existe mais est inexploité) |
| Support (tickets) | Oui — CRUD, commentaires, activité, labels, portail client | 3 | Faille IDOR critique sur les commentaires (`03-securite-authz.md` §2.5) ; rattachement tenant arbitraire pour clients sans org (§2.4) | à estimer | P0 (sécurité avant tout usage) |
| CRM | **Absent** — aucun modèle `Lead`, `Interaction`, `Opportunity` dans `schema.prisma` (509 lignes lues intégralement) | 0 | Tout | à estimer | P2/P3 selon roadmap |
| Leads | **Absent** — aucun modèle, aucune route | 0 | Tout | à estimer | P2 |
| Quotes (devis) | **Absent** — aucun modèle `Quote` | 0 | Tout | à estimer | P2 |
| Website public | Partiel — `(public)/agencies` liste/fiche agence + fiche asset, isolation `isPublic`/`isPublished` correcte (`03-securite-authz.md` L72-74) | 2 | Pas de landing par secteur, pas de SEO/CMS documenté observé | à estimer | P2 |
| Booking Engine (public) | Partiel — `public/booking-requests` fonctionnel et correctement isolé par tenant (`03-securite-authz.md` L74) | 2 | Pas de disponibilité temps réel visible publiquement au-delà du formulaire de demande ; pas de paiement à la réservation publique | à estimer | P1 |
| Pricing | Minimal — champs prix fixes par asset (`pricePerNight/Day/Month`), pas de règles dynamiques | 1 | `PricingRule`, saisonnalité, tarification dynamique (vision cible) — inexistant | à estimer | P2/P3 |
| Revenue Management | **Absent** — pas de saisonnalité, pas d'optimisation de taux d'occupation | 0 | Tout | à estimer | P3 |
| Analytics | Oui — page + route dédiées (`dashboard/analytics`, `api/v1/analytics`), isolation tenant correcte (`03-securite-authz.md` L20) | 3 | Non auditée en profondeur (contenu des KPI) dans cette passe | à estimer | P2 |
| Marketing | **Absent** — pas de `Campaign`, pas d'emailing marketing (Resend est utilisé uniquement pour des emails transactionnels : confirmation, contrat signé) | 0 | Tout | à estimer | P3 |
| B2B/Corporate | **Absent** — aucun modèle de compte corporate, aucune notion de contrat-cadre | 0 | Tout | à estimer | P3 |
| Partners | **Absent** — aucun modèle `Partner` | 0 | Tout | à estimer | P3 |
| Marketplace | **Absent** — hors périmètre de cette mission par instruction explicite (§8 du brief) | 0 | Tout (vient après l'OS, par principe directeur) | à estimer | P3 |
| APIs publiques | Minimal — `public/agencies*`, `public/booking-requests` : 3 endpoints non authentifiés, pas de clé API, pas de rate limiting observé | 1 | Authentification par clé API pour intégrateurs tiers ; documentation ; rate limiting | à estimer | P2 |
| AI | **Absent** — aucune intégration LLM/IA trouvée dans `src/`, conforme au principe directeur (§8 : ne pas ajouter d'IA avant les données) | 0 | Tout, mais volontairement hors scope actuel | — | P3 (par principe) |
| Notifications | Partiel — modèle `Notification` fonctionnel côté écriture (webhooks créent des notifications), page `/dashboard/notifications` liée dans la nav mais absente du disque (`05-ux.md` L23) | 2 | Page de consultation dashboard | à estimer | P1 |
| Onboarding | Oui — `src/app/onboarding/page.tsx`, seule page du panel UX avec gestion d'erreur explicite (`05-ux.md` L75) | 3 | Coexistence avec le flux `complete-signup` intégré au sign-up — deux chemins de création d'organisation (`04-workflows.md` L15-16) sans qu'on sache lequel est le chemin cible | à estimer | P1 (clarifier, pas dupliquer) |
| Multi-tenant | Partiel — la majorité des routes isolent correctement (`03-securite-authz.md` tableau §1), mais plusieurs failles IDOR concrètes (§2.1-2.5) et confusion de rôle (`Role.PROFESSIONAL`/`OrganizationType.PROFESSIONAL`, `02-database.md` §1.1) | 2 | Corriger les patterns `orgId ?? undefined`, généraliser `guard()` (utilisé sur 2 endpoints sur ~45) | à estimer | P0 |
| Sécurité | Partiel — voir `03-securite-authz.md` en intégralité : 5 findings P0, webhook DGateway non signé, IDOR tickets, upload non validé | 1 | Généralisation de `guard()`, correction des IDOR, activation de `DGATEWAY_WEBHOOK_SECRET` sur le fichier vivant | à estimer | P0 |
| Tests | **Absent** — recherche exhaustive de `*.test.ts`, `*.spec.ts`, config Vitest/Jest/Playwright : 0 résultat | 0 | Tout — aucune suite de tests, unitaire ou e2e, n'existe | à estimer | P0 (aucun filet de sécurité pour les corrections P0 elles-mêmes) |

## Question sectorielle (§6 du brief)

### 1. Part du code réellement sectorisée vs générique avec `switch (sector)`

**Constaté** : la sectorisation existe à trois niveaux distincts, de maturité inégale :
- **Colonnes SQL dédiées** : `Asset` porte 6 champs véhicule en dur (`immatriculation`, `vin`,
  `marque`, `modele`, `annee`, `couleur` — `schema.prisma:255-260`), aucun champ dédié en colonne
  pour les 3 autres secteurs.
- **Logique métier isolée par fonction** dans `src/app/lib/sectorLogic.ts` (mal placé, voir
  `01-architecture.md` §2.4) : une fonction (ou paire de fonctions) par secteur — véhicule
  (`calcKmReturn`, `checkVehicleAlerts`), immobilier (`generateMonthlySchedule`,
  `calcRentRevision`), équipement (`calcDepositResolution`, `compareInspectionStates`), hôtellerie
  (`calcHotelTotal`, `calcNights`). Ce n'est pas un `switch (sector)` au sens littéral, mais un
  découpage en modules par secteur.
- **Composants UI dédiés par secteur** : `EquipmentInspectionForm.tsx`, `HotelCheckinForm.tsx`,
  `VehicleReturnForm.tsx` — un composant par secteur pour les opérations de location.
- **Le reste (CRUD assets/customers/bookings/contracts/payments/invoices) est entièrement
  générique**, avec `Asset.metadata` (Json non typé) comme fourre-tout pour les attributs
  sectoriels qui n'ont pas eu de colonne dédiée (`02-database.md` §3).

**Sur le véhicule seul** : c'est le secteur le plus abouti — champs typés, vue `fleet` dédiée avec
alertes assurance/vignette (`api/v1/assets/fleet/route.ts`), fonctions `calcKmReturn`/
`checkVehicleAlerts` effectivement appelées (`04-workflows.md`, `return-km` route). **Les 3 autres
secteurs ont une logique écrite mais très partiellement ou pas du tout appelée** :
`generateMonthlySchedule` n'est atteignable qu'via la route `schuedule` (typo → 404 garanti,
`11-backlog-p0.md` item 8) ; `calcRentRevision`, `calcHotelTotal`, `calcNights`,
`compareInspectionStates` n'ont aucun appelant détecté en dehors de `sectorLogic.ts` lui-même
(`01-architecture.md` §2.4, hypothèse à vérifier par grep exhaustif complémentaire).

### 2. Coût de porter les modules avancés (TCO/dépréciation, maintenance préventive, revenue
management/saisonnalité) aux 4 secteurs

**À estimer.** Aucun de ces trois modules n'existe aujourd'hui pour *aucun* secteur, y compris le
véhicule (`06-gap-analysis.md`, lignes Maintenance et Revenue Management ci-dessus, toutes deux à
0/5). Il ne s'agit donc pas d'un coût de « généralisation » d'un module existant, mais d'une
construction neuve dans les 4 cas. La seule différence de coût entre secteurs tiendrait à la
maturité du socle de données par secteur (le véhicule a déjà des champs dédiés et un flux de
retour kilométrique fonctionnel, ce qui réduit le travail préparatoire) — pas à la complexité du
module lui-même, qui reste à concevoir dans tous les cas.

### 3. Coût de restreindre le produit au secteur véhicule

**À estimer** pour le chiffrage, mais le chemin est identifiable : le secteur véhicule est celui
qui nécessiterait le moins de travail de stabilisation avant extension, car sa logique est déjà la
plus câblée (voir §1). Restreindre au véhicule ne supprime pas la dette transversale (sécurité,
tests, IDOR, webhook non signé) qui affecte le produit indépendamment du secteur — cette dette
resterait à traiter de toute façon (Phase 0-1 de `09-roadmap.md`). Le gain principal d'une
restriction sectorielle serait de ne pas avoir à débloquer/finaliser les fonctionnalités
immobilier/hôtellerie/équipement actuellement cassées (échéancier immobilier 404, check-in
hôtelier 404, restitution de caution équipement inexploitable) ni à maintenir 4 jeux de composants
UI sectoriels.

### 4. L'architecture actuelle permet-elle de spécialiser un secteur sans casser les autres ?

**Constaté, avec réserve** : le découpage en composants et fonctions par secteur (§1) signifie que
la plupart des chemins de code sectoriels sont déjà indépendants les uns des autres — approfondir
le secteur véhicule (ex. ajouter TCO/dépréciation) n'implique pas de toucher
`calcHotelTotal`/`generateMonthlySchedule`. **Deux points de couplage à surveiller** :
- `api/v1/bookings/[id]/inspection/route.ts` sert à la fois le secteur équipement (calcul de
  caution) et potentiellement d'autres secteurs sans distinction claire de branchement par
  secteur observée dans cette passe (hypothèse à vérifier — non audité ligne à ligne dans cette
  mission au-delà de ce que `04-workflows.md` documente).
- `Asset.metadata` (Json non typé, `02-database.md` §3) est un point de couplage implicite : rien
  n'empêche un champ pensé pour un secteur d'être mal utilisé dans un autre, faute de schéma
  imposé.

Sous réserve de ces deux points, **rien dans l'architecture constatée n'empêche structurellement**
une spécialisation approfondie du secteur véhicule sans casser les 3 autres.

---

## Lecture transversale

- **Les domaines du produit actuel (« Rental SaaS ») sont globalement présents mais fragilisés par
  des ruptures ponctuelles et concrètes** (typos de route, fichier de webhook mort, page manquante)
  plutôt que par une absence de conception — le travail de correction P0 est chirurgical, pas une
  refonte.
- **Les domaines de la vision cible (« Rental Business OS » et au-delà) sont presque tous à l'état
  0** : CRM, Leads, Quotes, Marketing, Revenue Management, Partners, Marketplace, B2B n'ont ni
  modèle ni route. Le principe « EVOLVE, NOT RESTART » s'applique bien au périmètre actuel, mais
  la trajectoire vers l'OS suppose un volume de construction neuve important, pas une extension du
  code existant.
- **La sécurité et les tests sont transversalement à 0-1** et conditionnent la crédibilité de toute
  démonstration ou mise en production, indépendamment du domaine fonctionnel.
