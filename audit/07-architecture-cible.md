# 07 — Architecture cible (modular monolith)

Pas de microservices (exclu explicitement par le brief). L'objectif ici est de proposer des
**frontières de domaine** à l'intérieur du monolithe Next.js existant, en indiquant pour chacune
ce qui existe déjà et où il vit dans l'arborescence actuelle — pas une réécriture.

| Domaine | Existe aujourd'hui | Où il vit actuellement | État des frontières |
|---|---|---|---|
| **Identity** | Oui — Better Auth + `User`/`Session`/`Account`/`Verification` | `src/lib/auth.ts`, `src/lib/authz.ts`, `api/auth/[...all]`, `api/v1/auth/complete-signup` | Frontière floue avec Organizations : `complete-signup` crée à la fois l'identité (rôle) et le tenant (org) dans le même handler |
| **Organizations** | Oui | `api/v1/organizations*`, modèle `Organization` | Deux points d'entrée de création (`complete-signup` et `onboarding`/`organizations/route.ts`) non unifiés (`04-workflows.md` L15-16) |
| **Assets (Fleet)** | Oui, avec spécialisation véhicule | `api/v1/assets*`, `api/v1/asset-types`, `components/assets/AssetForm.tsx`, `src/app/lib/sectorLogic.ts` (mal placé, voir `01-architecture.md` §2.4) | Relativement propre en surface, mais `sectorLogic.ts` hors de `src/lib/` et fonctions orphelines mélangées avec des fonctions actives |
| **Customers** | Oui | `api/v1/customers*` | Propre |
| **Rental / Booking** | Oui | `api/v1/bookings*`, `src/lib/booking-conflicts.ts` | Contient les routes typo'd (`chekin`, `schuedule`) qui devraient plutôt être vues comme sous-domaine « Rental Operations » distinct de la simple réservation |
| **Contracts / e-signature** | Oui | `api/v1/contracts*`, `src/lib/render-contract-pdf.ts`, `src/lib/pdf/*`, `api/webhooks/yousign` | Couplage direct à l'API YouSign dans la route (`send-signature/route.ts`) plutôt que derrière une interface — migration de fournisseur coûteuse en l'état |
| **Inspections** | Oui mais dupliqué | `api/v1/inspections`, `api/v1/bookings/[id]/inspection`, `components/bookings/*Form.tsx` | Deux implémentations concurrentes (`04-workflows.md` §2.8) — à unifier avant toute extension |
| **Payments** | Oui | `api/v1/payments*`, `src/lib/payment/dgateway.ts`, `api/webhooks/dgateway` (+ fichier mort `rout.ts`) | Couplage direct DGateway dans les routes ; webhook non sécurisé dans le fichier vivant |
| **Finance (Invoices)** | Partiel | `db.invoice.create` dispersé dans le webhook DGateway et `payments/manual` (deux implémentations qui génèrent la même forme de `Json`, `02-database.md` §3) | Pas de service « Finance » centralisé — la génération de facture est un effet de bord de deux routes de paiement différentes, dupliqué plutôt que partagé |
| **Maintenance** | Modèle seul, quasi inexploité | `MaintenanceTicket` (schema), référencé uniquement dans `api/v1/analytics/route.ts` | Domaine à construire quasiment de zéro côté API/UI |
| **Support** | Oui | `api/v1/tickets*`, `api/v1/portal/tickets`, modèles `SupportTicket`/`TicketComment`/`TicketActivity`/`TicketLabel` | Faille IDOR à corriger avant extension (`03-securite-authz.md` §2.5) |
| **Marketing / CRM / Leads / Partners** | Absents | — | Domaines entièrement à créer pour la trajectoire cible |
| **Analytics** | Oui | `api/v1/analytics`, `dashboard/analytics` | Isolé et propre en surface |
| **Notifications** | Backend seul | modèle `Notification`, écrit par les webhooks | Pas de service de notification centralisé — chaque webhook écrit directement dans la table |

## Principe de découpage proposé (à valider — non implémenté)

1. **Un dossier de domaine par sous-arbre**, ex. `src/domains/rental/`, `src/domains/finance/`,
   chacun exposant ses propres handlers de route, sa logique métier, et ses types partagés — plutôt
   que la structure actuelle où `src/app/api/v1/*` est un plat de routes sans regroupement logique
   et où `src/lib/` mélange logique métier générique et logique métier sectorielle
   (`sectorLogic.ts` égaré dans `src/app/lib/`).
2. **Un point d'entrée unique pour la création d'organisation** — fusionner
   `complete-signup` et `organizations/route.ts` ou clarifier explicitement pourquoi deux chemins
   coexistent, avant d'ajouter un domaine CRM qui dépendra de la notion d'organisation.
3. **Une interface de paiement et de signature abstraite** (`PaymentProvider`,
   `SignatureProvider`) derrière laquelle DGateway et YouSign seraient des implémentations — les
   webhooks actuels appellent directement les specifics DGateway/YouSign dans le handler de route,
   ce qui rend tout changement de fournisseur ou ajout d'un second fournisseur coûteux.
4. **`guard()` (`src/lib/authz.ts`) doit devenir le seul point d'entrée d'autorisation** pour
   toutes les routes API, quel que soit le domaine — c'est déjà le mécanisme correct, il n'est
   simplement pas généralisé (2 usages sur ~45 endpoints, `03-securite-authz.md`).

Aucune de ces migrations n'est nécessaire pour corriger les points P0 listés dans
`11-backlog-p0.md` — elles concernent la préparation du terrain pour la trajectoire
Rental SaaS → Rental Business OS, pas la stabilisation du produit actuel.
