# Universal Rental Management System (EnyaRent) — Project Description

## What This App Does
EnyaRent est une plateforme SaaS multi-tenant unifiée permettant à des agences et entreprises de gérer plusieurs types de locations (immobilier, véhicules, hôtellerie, équipements) depuis un seul tableau de bord. Elle couvre le cycle complet : gestion des assets, réservations, contrats PDF conformes droit marocain/international, e-signature, paiements en ligne, tickets de support GitHub-style et analytics. Le tout adapté au marché marocain avec support multi-devises (MAD, EUR, USD) et multi-langues (FR, AR, EN).

## Target Users
- **Primary user:** Agences et PME marocaines gérant des biens locatifs — ont besoin d'un outil tout-en-un pour remplacer Excel, Word et la paperasse
- **Secondary users:** Clients/locataires — accèdent à leur portail pour consulter contrats, payer et ouvrir des tickets ; Propriétaires — suivent leurs revenus et biens

## Core Value Proposition
EnyaRent remplace 5 outils séparés (CRM, tableur, générateur de contrats, système de tickets, outil comptable) par une seule plateforme modulaire adaptée au droit et aux modes de paiement marocains.

## User Roles & Permissions

- **Super Admin (plateforme):** Gère tous les tenants (organisations), plans SaaS, facturation globale, statistiques globales, accès total
- **Admin Organisation:** Crée et configure son organisation, gère tous les modules activés, invite des membres, accède à tous les rapports de son tenant
- **Gestionnaire:** Crée et gère assets, clients, contrats, réservations, tickets ; ne peut pas configurer l'organisation ni gérer les abonnements
- **Propriétaire:** Rôle spécifique immobilier — voit ses biens, ses revenus, ses locataires ; ne voit pas les données des autres propriétaires
- **Client / Locataire:** Portail client dédié — consulte ses réservations/contrats, paie en ligne, ouvre des tickets, télécharge quittances et factures

## Features — Complete List

### Core Platform
1. **Multi-tenant avec isolation totale** — chaque organisation a ses données isolées via `organization_id` sur toutes les tables
2. **RBAC complet** — 5 rôles avec permissions granulaires par module et par action (create/read/update/delete)
3. **Audit logs** — historique de toutes les actions (qui, quoi, quand) par organisation
4. **Système de configuration par module** — activer/désactiver les modules (immobilier, véhicules, hôtellerie, équipements) par organisation
5. **Multi-langues** — FR, AR (RTL), EN avec switcher dans le header ; next-intl

### Gestion des Assets (commun à tous les secteurs)
6. **Fiches assets détaillées** — nom, description, photos multiples (R2), localisation, équipements, statut, prix/nuit ou /mois ou /jour
7. **AssetType configurable** — Appartement, Villa, Voiture, Chambre d'hôtel, Grue, Salle de réunion, etc.
8. **Galerie photos** — upload multiple via Cloudflare R2, réordonnancement drag-and-drop
9. **Statut temps réel** — Disponible / Réservé / En maintenance / Hors service
10. **Import CSV** des assets en masse

### Booking Engine
11. **Calendrier de disponibilité interactif** — par asset, vue mensuelle/hebdomadaire, drag-and-drop pour bloquer des dates
12. **Détection automatique des conflits** — impossible de créer deux réservations qui se chevauchent
13. **Réservations multi-types** — courte durée (nuit/heure), longue durée (mois), ponctuelle (journée)
14. **Workflow de réservation** — Demande → Confirmation → Contrat → Paiement → Actif → Terminé
15. **Blocage manuel de dates** — pour maintenance, usage personnel, etc.

### Gestion Clients
16. **Fiche client complète** — nom, CIN/Passeport, téléphone, email, adresse, profession, garant(s)
17. **Gestion des garants** — fiche garant avec documents joints (CIN, justificatif)
18. **Historique client** — toutes les locations passées, paiements, tickets, solde impayé
19. **Scoring locataire** — badge fiabilité basé sur historique paiements (Excellent / Bon / À surveiller)
20. **Import clients CSV**

### Contrats & Juridique
21. **Génération contrats PDF** — templates conformes droit marocain (bail résidentiel, contrat location véhicule, contrat équipement, contrat hôtelier) via @react-pdf/renderer
22. **Templates multi-secteurs** — 4 templates de base + personnalisation par organisation
23. **E-signature intégrée** — via YouSign API, workflow : envoi → signature → archivage automatique
24. **États des lieux digitalisés** — formulaire structuré avec photos, signé électroniquement
25. **Conformité internationale** — clauses adaptables au droit marocain et droit international (OHADA)
26. **Archivage contrats** — stockage signé sur Cloudflare R2, accès auditable

### Paiements & Finance
27. **Paiements en ligne DGateway** — carte bancaire marocaine (CMI), virement, mobile money via DGateway API
28. **Multi-devises** — MAD, EUR, USD avec taux de conversion configurable
29. **Quittances automatiques** — générées et envoyées par email après chaque paiement
30. **Factures PDF** — @react-pdf/renderer, numérotation automatique, export
31. **Cautions (dépôt de garantie)** — suivi montant, statut (retenu/restitué), déductions
32. **Suivi des impayés** — tableau de bord impayés, relances automatiques par email à J+3, J+7, J+15
33. **Rapports financiers** — revenus par période, par asset, par secteur, export Excel (xlsx)
34. **Abonnements SaaS** — plans Free/Starter/Pro/Enterprise pour les organisations via DGateway

### Maintenance & Incidents
35. **Tickets de maintenance** — création par gestionnaire ou client, assignation à prestataire
36. **Suivi interventions** — statuts : Ouvert → En cours → Résolu → Fermé
37. **Coût d'intervention** — enregistrement du coût, impact sur ROI asset
38. **Calendrier maintenance préventive** — rappels automatiques (vidange, révision, etc.)

### Système de Tickets GitHub-Style
39. **Issues/Tickets** — titre, description markdown, pièces jointes, secteur concerné
40. **Labels & priorités** — labels colorés customisables (Bug, Demande, Urgent, Info) + priorité (Low/Medium/High/Critical)
41. **Assignation** — assigner à un membre de l'équipe, @mentions dans commentaires
42. **Fil de commentaires** — commentaires avec markdown, pièces jointes, réactions emoji
43. **Timeline d'activité** — log de tous les changements (statut, assignation, labels) comme GitHub
44. **Statuts** — Open / In Progress / On Hold / Resolved / Closed
45. **Notifications temps réel** — email (Resend) à chaque changement de statut, mention, ou nouveau commentaire
46. **Filtres avancés** — par statut, label, assigné, date, secteur, priorité

### Portail Client
47. **Espace client dédié** — dashboard avec réservations actives, prochaines échéances, solde dû
48. **Téléchargement documents** — contrats signés, quittances, factures
49. **Paiement en ligne** — payer son loyer/réservation directement depuis le portail via DGateway
50. **Ouverture de tickets** — client peut ouvrir une réclamation/demande depuis son portail
51. **Messagerie** — échange avec le gestionnaire via le système de tickets

### Analytics & Reporting
52. **Dashboard KPIs** — taux d'occupation par asset, revenus du mois, impayés en cours, tickets ouverts
53. **Taux d'occupation** — graphique par période, par type d'asset
54. **ROI par asset** — revenus générés - coûts maintenance = ROI net
55. **Rapport revenus** — par période, par secteur, par propriétaire, export Excel
56. **Carte de chaleur disponibilité** — visualisation calendrier des assets

### Module Immobilier (Spécifique)
57. **Baux longue durée** — durée configurable (6 mois, 1 an, 2 ans), renouvellement automatique
58. **Loyers mensuels** — échéancier automatique, quittances mensuelles
59. **Révision de loyer** — calcul selon indice marocain IPC
60. **Multi-propriétaires** — un bien peut appartenir à un propriétaire externe à l'agence

### Module Véhicules (Spécifique)
61. **Fiche véhicule** — marque, modèle, immatriculation, kilométrage, assurance, vignette
62. **Location courte durée** — tarif/jour, tarif/semaine, tarif/mois
63. **Kilométrage** — saisie km départ/retour, calcul dépassement
64. **Gestion flotte** — vue d'ensemble de toute la flotte, statuts, prochaines révisions

### Module Hôtellerie (Spécifique)
65. **Booking par nuit** — check-in / check-out, durée minimale configurable
66. **Gestion chambres** — types (Simple, Double, Suite), numérotation, étage
67. **Channel manager simplifié** — gestion des disponibilités manuellement
68. **Petit-déjeuner / Options** — ajout de suppléments à la réservation

### Module Équipements (Spécifique)
69. **Caution obligatoire** — montant caution + état matériel à la sortie/retour
70. **État du matériel** — formulaire entrée/sortie avec photos, signé
71. **Tarification flexible** — /heure, /jour, /semaine avec dégressivité
72. **Suivi usure** — état de l'équipement dans le temps

## Data Model

- **Organization:** id, name, slug, plan, logo, settings (JSON: modules activés, devises, langue par défaut), createdAt
- **User:** id, name, email, passwordHash, role (SUPER_ADMIN | ADMIN | MANAGER | OWNER | CLIENT), organizationId, avatar, language, createdAt
- **Asset:** id, organizationId, name, description, assetTypeId, status (AVAILABLE|RESERVED|MAINTENANCE|OUT_OF_SERVICE), pricePerNight, pricePerDay, pricePerMonth, deposit, address, city, latitude, longitude, metadata (JSON: spécifiques au secteur), createdAt
- **AssetType:** id, organizationId, name, sector (REAL_ESTATE|VEHICLE|HOSPITALITY|EQUIPMENT), icon
- **AssetPhoto:** id, assetId, url, order
- **Customer:** id, organizationId, name, email, phone, cin, passportNumber, address, type (INDIVIDUAL|COMPANY), guarantorId, score, createdAt
- **Guarantor:** id, customerId, name, cin, phone, address, documentUrl
- **Booking:** id, organizationId, assetId, customerId, startDate, endDate, type (NIGHTLY|DAILY|MONTHLY), status (PENDING|CONFIRMED|ACTIVE|COMPLETED|CANCELLED), totalAmount, depositAmount, notes, createdAt
- **Contract:** id, organizationId, bookingId, templateType, content (JSON), pdfUrl, signedPdfUrl, status (DRAFT|SENT|SIGNED|ARCHIVED), yousignRequestId, createdAt
- **Inspection:** id, contractId, type (ENTRY|EXIT), notes, photos (JSON), signedBy (JSON), signatureUrl, createdAt
- **Payment:** id, organizationId, bookingId, customerId, amount, currency, method, status (PENDING|COMPLETED|FAILED|REFUNDED), dgatewayRef, invoiceId, type (RENT|DEPOSIT|DEPOSIT_REFUND|SUBSCRIPTION), createdAt
- **Invoice:** id, organizationId, number, bookingId, customerId, lines (JSON), totalHT, tva, totalTTC, currency, status (DRAFT|SENT|PAID), pdfUrl, createdAt
- **MaintenanceTicket:** id, organizationId, assetId, reportedById, assignedToId, title, description, status (OPEN|IN_PROGRESS|RESOLVED|CLOSED), priority (LOW|MEDIUM|HIGH|CRITICAL), cost, resolvedAt, createdAt
- **SupportTicket:** id, organizationId, reportedById, assignedToId, title, body, status (OPEN|IN_PROGRESS|ON_HOLD|RESOLVED|CLOSED), priority, sector, labels (JSON), createdAt
- **TicketComment:** id, ticketId, authorId, body, attachments (JSON), createdAt
- **TicketActivity:** id, ticketId, userId, action, metadata (JSON), createdAt
- **TicketLabel:** id, organizationId, name, color
- **Notification:** id, userId, organizationId, type, title, body, read, link, createdAt
- **AuditLog:** id, organizationId, userId, action, entity, entityId, oldValue (JSON), newValue (JSON), ip, createdAt
- **AvailabilityBlock:** id, assetId, startDate, endDate, reason, createdAt

**Relationships:**
- Organization has many Users, Assets, Customers, Bookings, Contracts, Payments, Invoices, SupportTickets
- Asset belongs to Organization, has many Bookings, Photos, MaintenanceTickets, AvailabilityBlocks
- Booking belongs to Asset + Customer, has one Contract, many Payments
- Contract belongs to Booking, has many Inspections
- SupportTicket has many TicketComments, TicketActivity; belongs to Organization
- User has many Notifications, AuditLogs

## Pages / Screens

### Landing & Auth
1. `/` — Landing page multi-langue (hero, features par secteur, pricing, testimonials, CTA)
2. `/auth/sign-in` — Connexion
3. `/auth/sign-up` — Inscription organisation
4. `/auth/forgot-password` — Mot de passe oublié
5. `/auth/reset-password` — Réinitialisation

### Super Admin
6. `/admin` — Dashboard global (organisations, revenus plateforme, statistiques)
7. `/admin/organizations` — Liste toutes les organisations
8. `/admin/organizations/[id]` — Détail organisation, modules activés, plan
9. `/admin/users` — Tous les utilisateurs plateforme

### Dashboard Organisation
10. `/dashboard` — KPIs globaux (taux occupation, revenus mois, impayés, tickets ouverts)
11. `/dashboard/assets` — Liste assets (data table, filtres par secteur/statut)
12. `/dashboard/assets/new` — Créer un asset
13. `/dashboard/assets/[id]` — Détail asset (infos, photos, calendrier, historique bookings, ROI)
14. `/dashboard/assets/[id]/edit` — Modifier asset
15. `/dashboard/bookings` — Liste réservations (data table, filtres)
16. `/dashboard/bookings/new` — Nouvelle réservation (sélection asset + client + dates)
17. `/dashboard/bookings/[id]` — Détail réservation (statut, contrat, paiements, timeline)
18. `/dashboard/customers` — Liste clients
19. `/dashboard/customers/new` — Créer client
20. `/dashboard/customers/[id]` — Fiche client (infos, historique, score, tickets)
21. `/dashboard/contracts` — Liste contrats (data table)
22. `/dashboard/contracts/[id]` — Détail contrat (preview PDF, statut signature, e-signature)
23. `/dashboard/payments` — Liste paiements et impayés
24. `/dashboard/payments/[id]` — Détail paiement
25. `/dashboard/invoices` — Liste factures
26. `/dashboard/invoices/[id]` — Détail facture + aperçu PDF
27. `/dashboard/maintenance` — Tickets maintenance
28. `/dashboard/maintenance/new` — Créer ticket maintenance
29. `/dashboard/maintenance/[id]` — Détail ticket maintenance
30. `/dashboard/tickets` — Tickets support GitHub-style (liste avec filtres)
31. `/dashboard/tickets/new` — Ouvrir un ticket
32. `/dashboard/tickets/[id]` — Détail ticket (commentaires, timeline, labels, assignation)
33. `/dashboard/calendar` — Calendrier global disponibilité tous assets
34. `/dashboard/analytics` — Rapports (taux occupation, revenus, ROI par asset, export Excel)
35. `/dashboard/settings` — Config organisation (modules, devises, langue, logo, plan)
36. `/dashboard/settings/members` — Gestion membres et rôles
37. `/dashboard/settings/templates` — Templates contrats
38. `/dashboard/notifications` — Centre de notifications

### Portail Client
39. `/portal` — Dashboard client (réservations actives, prochaines échéances)
40. `/portal/bookings` — Mes réservations
41. `/portal/bookings/[id]` — Détail réservation + contrat + paiements
42. `/portal/payments` — Mes paiements, historique
43. `/portal/pay/[bookingId]` — Page paiement en ligne (DGateway)
44. `/portal/documents` — Mes documents (contrats signés, quittances, factures)
45. `/portal/tickets` — Mes tickets/réclamations
46. `/portal/tickets/new` — Ouvrir une réclamation
47. `/portal/tickets/[id]` — Détail ticket client
48. `/portal/profile` — Mon profil

## Integrations
- **Auth:** Better Auth + Google OAuth + Email/Password
- **Email:** Resend + React Email (quittances, relances, notifications tickets, bienvenue)
- **Payments:** DGateway (carte marocaine CMI, mobile money, virement) — MAD/EUR/USD
- **File uploads:** Cloudflare R2 (photos assets, documents contrats, pièces jointes tickets)
- **E-signature:** YouSign API (envoi, signature, webhook statut)
- **PDF:** @react-pdf/renderer (contrats, factures, quittances, états des lieux)
- **Excel:** xlsx (export rapports)
- **i18n:** next-intl (FR, AR avec RTL, EN)
- **Dark mode:** Oui — ThemeProvider + next-themes

## JB Components to Install
- JB Better Auth UI: `pnpm dlx shadcn@latest add https://better-auth-ui.desishub.com/r/auth-components.json`
- JB Data Table: `pnpm dlx shadcn@latest add https://jb.desishub.com/r/data-table.json`
- JB Searchable Select: `pnpm dlx shadcn@latest add https://jb.desishub.com/r/searchable-select.json`
- Website UI (landing): `pnpm dlx shadcn@latest add https://ui-components.desishub.com/r/website-ui.json`
- DGateway Shop: `pnpm dlx shadcn@latest add https://ui-components.desishub.com/r/dgateway-shop.json`
- File Storage UI: `pnpm dlx shadcn@latest add https://file-storage-registry.vercel.app/r/file-storage.json`

## Out of Scope (v1)
- IA prédiction impayés et scoring automatique avancé (→ v3)
- Recommandations pricing dynamique par IA (→ v3)
- Application mobile native iOS/Android (→ v2)
- Channel manager avec OTA (Booking.com, Airbnb) (→ v2)
- Module Coworking, Événementiel, Agriculture (→ v2)
- Comptabilité avancée (intégration Sage/Odoo) (→ v2)
- Signature multi-parties simultanée (→ v2)
