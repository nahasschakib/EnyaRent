# Universal Rental Management System (EnyaRent) — Build Phases

## Phase 1 — Foundation
**Goal:** Projet scaffoldé, design system appliqué, env files créés, base de données connectée, auth multi-rôle fonctionnelle, layout dashboard + portail client, i18n (FR/AR/EN) initialisé.

### Tasks
- [ ] Initialiser Next.js 16 avec TypeScript, Tailwind v4, shadcn/ui
- [ ] Configurer next-intl pour i18n (FR, AR avec RTL, EN) — fichiers de traduction en `/messages/fr.json`, `/messages/ar.json`, `/messages/en.json`
- [ ] Créer `.env.example` (commité) et `.env.local` (gitignored) avec TOUTES les variables :
  ```
  # Database
  DATABASE_URL=                    # Neon PostgreSQL connection string
  
  # Better Auth
  BETTER_AUTH_SECRET=              # Random 32+ chars (randomkeygen.com)
  BETTER_AUTH_URL=                 # http://localhost:3000 en dev
  
  # OAuth Google
  GOOGLE_CLIENT_ID=                # Google Cloud Console
  GOOGLE_CLIENT_SECRET=            # Google Cloud Console
  
  # Resend (emails)
  RESEND_API_KEY=                  # Dashboard Resend
  RESEND_FROM_EMAIL=               # noreply@EnyaRent.ma (domaine vérifié Resend)
  
  # Cloudflare R2 (fichiers)
  CLOUDFLARE_R2_ACCESS_KEY_ID=     # R2 dashboard
  CLOUDFLARE_R2_SECRET_ACCESS_KEY= # R2 dashboard
  CLOUDFLARE_R2_ENDPOINT=          # https://<account>.r2.cloudflarestorage.com
  CLOUDFLARE_R2_BUCKET_NAME=       # EnyaRent-storage
  CLOUDFLARE_R2_PUBLIC_DEV_URL=    # URL publique du bucket R2
  
  # DGateway (paiements)
  DGATEWAY_API_URL=                # https://dgatewayapi.desispay.com
  DGATEWAY_API_KEY=                # Dashboard DGateway
  
  # YouSign (e-signature)
  YOUSIGN_API_KEY=                 # Dashboard YouSign
  YOUSIGN_API_URL=                 # https://api.yousign.app/v3 (prod) ou staging
  
  # App
  NEXT_PUBLIC_API_URL=             # http://localhost:3000
  NEXT_PUBLIC_APP_URL=             # http://localhost:3000
  ```
- [ ] Ajouter `.env.local` au `.gitignore`
- [ ] Configurer Prisma v7 avec Neon PostgreSQL (schema initial, prisma/db.ts client)
- [ ] Appliquer les tokens du design-style-guide.md dans `globals.css` (couleurs Orange brand, dark mode, RTL)
- [ ] Configurer la police Inter dans le root layout via `next/font/google`
- [ ] Créer root layout avec : QueryClientProvider, ThemeProvider (next-themes, dark mode), NextIntlClientProvider
- [ ] Créer layout sidebar dashboard (`/dashboard`) : collapsible, navigation par modules, section utilisateur, dark mode toggle, sélecteur langue
- [ ] Créer layout sidebar portail client (`/portal`) : navigation simplifiée client
- [ ] Créer composant PageHeader (breadcrumb + titre + actions)
- [ ] Installer JB Better Auth UI : `pnpm dlx shadcn@latest add https://better-auth-ui.desishub.com/r/auth-components.json`
- [ ] **Intégrer les fichiers auth dans les routes existantes — NE PAS écraser les page.tsx/layout.tsx existants. Éditer et fusionner.**
- [ ] Configurer Better Auth avec 5 rôles : SUPER_ADMIN, ADMIN, MANAGER, OWNER, CLIENT
- [ ] Créer middleware de protection des routes (`/dashboard/*` → ADMIN+MANAGER+OWNER, `/portal/*` → CLIENT, `/admin/*` → SUPER_ADMIN)
- [ ] Construire pages 404, error, et loading personnalisées (style brand EnyaRent)
- [ ] Configurer Prisma schema initial : Organization, User, AuditLog
- [ ] Vérifier : login, signup, Google OAuth, routes protégées, redirection par rôle

### Dependencies
- Neon database créé, DATABASE_URL configuré
- Compte Resend créé, RESEND_API_KEY configuré

---

## Phase 2 — Core Data Model & Asset Management
**Goal:** Toutes les entités métier créées en BDD, module Assets complet avec CRUD, photos, calendrier, et data tables.

### Tasks
- [ ] Définir le schéma Prisma complet pour :
  - `Organization` (multi-tenant, settings JSON)
  - `Asset`, `AssetType`, `AssetPhoto`
  - `Customer`, `Guarantor`
  - `Booking`, `AvailabilityBlock`
  - `Contract`, `Inspection`
  - `Payment`, `Invoice`
  - `MaintenanceTicket`
  - `SupportTicket`, `TicketComment`, `TicketActivity`, `TicketLabel`
  - `Notification`, `AuditLog`
- [ ] Exécuter migration : `pnpm db:push && pnpm db:generate`
- [ ] Installer JB Data Table : `pnpm dlx shadcn@latest add https://jb.desishub.com/r/data-table.json`
- [ ] Installer Searchable Select : `pnpm dlx shadcn@latest add https://jb.desishub.com/r/searchable-select.json`
- [ ] Installer File Storage UI (R2) : `pnpm dlx shadcn@latest add https://file-storage-registry.vercel.app/r/file-storage.json`
- [ ] Créer API Route `/api/v1/assets` — GET (pagination, filtres secteur/statut/search), POST
- [ ] Créer API Route `/api/v1/assets/[id]` — GET, PUT, DELETE
- [ ] Créer API Route `/api/v1/assets/[id]/photos` — POST (upload R2), DELETE
- [ ] Créer API Route `/api/v1/asset-types` — GET, POST (par organisation)
- [ ] Créer API Route `/api/v1/customers` — GET (pagination), POST
- [ ] Créer API Route `/api/v1/customers/[id]` — GET, PUT, DELETE
- [ ] Construire page `/dashboard/assets` — Data Table avec colonnes : nom, type, secteur, statut, prix, actions
- [ ] Construire page `/dashboard/assets/new` — formulaire React Hook Form + Zod (infos générales, upload photos R2, localisation)
- [ ] Construire page `/dashboard/assets/[id]` — onglets : Infos | Photos | Calendrier | Bookings | Maintenance | ROI
- [ ] Construire calendrier de disponibilité interactif (FullCalendar ou react-big-calendar) par asset
- [ ] Construire page `/dashboard/customers` — Data Table clients avec score badge
- [ ] Construire page `/dashboard/customers/new` — formulaire client complet + garant
- [ ] Construire page `/dashboard/customers/[id]` — fiche client, historique, tickets
- [ ] Ajouter skeleton loaders et empty states sur toutes les pages
- [ ] Implémenter middleware `organization_id` sur toutes les API routes (isolation multi-tenant)
- [ ] Implémenter AuditLog sur toutes les mutations (create/update/delete)

### Dependencies
- Phase 1 complète (auth + layout fonctionnels)

---

## Phase 3 — Booking Engine & Contrats
**Goal:** Réservations opérationnelles avec détection de conflits, génération contrats PDF par secteur, workflow e-signature YouSign.

### Tasks
- [ ] Créer API Route `/api/v1/bookings` — GET (pagination, filtres), POST (avec vérification conflits dates)
- [ ] Créer API Route `/api/v1/bookings/[id]` — GET, PUT (changement statut), DELETE
- [ ] Créer API Route `/api/v1/availability` — GET (créneaux disponibles par assetId + dates)
- [ ] Créer API Route `/api/v1/availability/block` — POST (blocage manuel dates)
- [ ] Logique détection conflits de réservation — fonction `checkConflict(assetId, startDate, endDate)`
- [ ] Construire page `/dashboard/bookings` — Data Table (statut coloré, asset, client, dates, montant)
- [ ] Construire page `/dashboard/bookings/new` — wizard 3 étapes : 1) Sélection asset + dates (avec calendrier dispo), 2) Sélection/création client, 3) Récapitulatif + confirmation
- [ ] Construire page `/dashboard/bookings/[id]` — timeline de statuts, contrat lié, paiements, actions (confirmer, annuler, générer contrat)
- [ ] Construire calendrier global `/dashboard/calendar` — vue multi-assets par mois/semaine
- [ ] Créer templates PDF contrats avec @react-pdf/renderer :
  - Template Bail Résidentiel (conforme droit marocain : Dahir 1994)
  - Template Location Véhicule
  - Template Location Équipement (avec caution)
  - Template Réservation Hôtelière
- [ ] Créer API Route `/api/v1/contracts` — GET, POST (génération PDF → upload R2)
- [ ] Créer API Route `/api/v1/contracts/[id]` — GET, PUT
- [ ] Créer API Route `/api/v1/contracts/[id]/send-signature` — POST (envoi YouSign)
- [ ] Créer webhook handler `/api/webhooks/yousign` — réception statut signature, mise à jour BDD, notification
- [ ] Créer API Route `/api/v1/inspections` — POST (état des lieux entrée/sortie avec photos)
- [ ] Construire page `/dashboard/contracts` — Data Table (statut signature, asset, client, date)
- [ ] Construire page `/dashboard/contracts/[id]` — aperçu PDF inline, boutons : Envoyer signature / Télécharger / Archiver
- [ ] Construire formulaire état des lieux avec upload photos R2
- [ ] Envoyer email (Resend) au client lors de : création booking, envoi contrat, confirmation signature

### Dependencies
- Phase 2 complète (assets + clients en BDD)
- Compte YouSign créé, YOUSIGN_API_KEY configuré

---

## Phase 4 — Paiements DGateway & Finance
**Goal:** Paiements en ligne opérationnels (DGateway), facturation automatique, suivi impayés, relances email, rapports financiers.

### Tasks
- [ ] Installer DGateway Shop : `pnpm dlx shadcn@latest add https://ui-components.desishub.com/r/dgateway-shop.json`
- [ ] Étudier et adapter la lib DGateway pour EnyaRent (paiements loyer/booking, multi-devises MAD/EUR/USD)
- [ ] Créer API Route `/api/v1/payments` — GET (pagination), POST (création intention de paiement DGateway)
- [ ] Créer API Route `/api/v1/payments/[id]` — GET
- [ ] Créer webhook handler `/api/webhooks/dgateway` — réception confirmation paiement, mise à jour statut, génération quittance
- [ ] Créer API Route `/api/v1/invoices` — GET, POST (génération facture PDF)
- [ ] Créer API Route `/api/v1/invoices/[id]` — GET, PUT
- [ ] Template PDF Quittance de loyer (@react-pdf/renderer) — numérotation auto, multidevise
- [ ] Template PDF Facture (@react-pdf/renderer) — avec TVA marocaine 20%, numérotation
- [ ] Construire page portail client `/portal/pay/[bookingId]` — interface paiement DGateway (carte, virement)
- [ ] Construire page `/dashboard/payments` — Data Table (statut, montant, méthode, client, booking)
- [ ] Construire page `/dashboard/invoices` — Data Table factures avec aperçu PDF
- [ ] Tableau de bord impayés — liste clients en retard, montants, jours de retard
- [ ] Cron job relances automatiques — email Resend à J+3, J+7, J+15 après échéance impayée
- [ ] Suivi cautions — montant retenu, déductions, restitution partielle/totale
- [ ] Page `/dashboard/analytics` — graphiques revenus (recharts), taux occupation, ROI par asset
- [ ] Export Excel (`xlsx`) — rapport revenus par période, par secteur, par propriétaire
- [ ] Construire page `/dashboard/payments/[id]` — détail paiement, reçu, actions (rembourser)

### Dependencies
- Phase 3 complète (bookings + contrats fonctionnels)
- Compte DGateway créé, credentials configurés

---

## Phase 5 — Système de Tickets GitHub-Style & Notifications
**Goal:** Système de tickets complet (support + maintenance) avec commentaires, labels, timeline, mentions, et notifications email temps réel.

### Tasks
- [ ] Créer API Route `/api/v1/tickets` — GET (pagination, filtres statut/label/assigné/priorité), POST
- [ ] Créer API Route `/api/v1/tickets/[id]` — GET (avec comments + activity), PUT (statut, assignation, labels)
- [ ] Créer API Route `/api/v1/tickets/[id]/comments` — GET, POST (avec parsing @mentions)
- [ ] Créer API Route `/api/v1/tickets/[id]/labels` — POST, DELETE
- [ ] Créer API Route `/api/v1/ticket-labels` — GET, POST, DELETE (labels par organisation)
- [ ] Créer API Route `/api/v1/notifications` — GET (non lues), PUT (marquer lues)
- [ ] Logique @mentions — parser le texte du commentaire, créer notification pour chaque @utilisateur mentionné
- [ ] Construire page `/dashboard/tickets` — liste GitHub-style (filtres sidebar : statut, labels, assigné, priorité)
- [ ] Construire page `/dashboard/tickets/new` — formulaire : titre, description (markdown editor), secteur, priorité, assigné, labels
- [ ] Construire page `/dashboard/tickets/[id]` — layout 2 colonnes : fil de commentaires (gauche) + sidebar infos (droite : statut, assigné, labels, dates)
- [ ] Composant TicketTimeline — log chronologique de toutes les actions (comme GitHub : "X a changé le statut en Résolu il y a 2h")
- [ ] Composant TicketComment — markdown render, pièces jointes, réactions (👍 ✅ 👀)
- [ ] Composant LabelBadge — badge coloré configurable
- [ ] Composant AssigneeSelect — dropdown membres organisation
- [ ] Construire page portail client `/portal/tickets` — vue simplifiée (ouvrir, suivre ses tickets)
- [ ] Construire `/portal/tickets/[id]` — client voit le fil de commentaires et peut répondre
- [ ] Tickets Maintenance `/dashboard/maintenance` — même moteur, vue filtrée par secteur Maintenance
- [ ] Email Resend — template "Nouveau ticket", "Nouveau commentaire", "Ticket résolu", "Mention @vous"
- [ ] Centre notifications `/dashboard/notifications` — liste toutes les notifications, marquer tout comme lu
- [ ] Notification badge en temps réel sur l'icône cloche du header (polling toutes les 30s ou Server-Sent Events)

### Dependencies
- Phase 2 complète (users, organisations en BDD)
- Phase 3 (bookings) pour lier tickets aux réservations

---

## Phase 6 — Portail Client & Modules Sectoriels
**Goal:** Portail client complet et opérationnel, modules spécifiques immobilier/véhicules/hôtellerie/équipements activés.

### Tasks

#### Portail Client
- [ ] Construire layout `/portal` — sidebar client (Mes réservations, Paiements, Documents, Tickets, Profil)
- [ ] Construire `/portal` dashboard — KPIs client : réservations actives, prochaine échéance, solde dû
- [ ] Construire `/portal/bookings` — liste réservations avec statuts
- [ ] Construire `/portal/bookings/[id]` — détail : asset, dates, contrat signé (téléchargeable), paiements
- [ ] Construire `/portal/documents` — liste documents (contrats, quittances, factures) téléchargeables
- [ ] Construire `/portal/payments` — historique paiements, bouton "Payer maintenant" si dû
- [ ] Construire `/portal/profile` — modifier informations personnelles

#### Module Immobilier
- [ ] Champs spécifiques Asset type REAL_ESTATE : surface m², étage, nombre pièces, DPE, charges incluses
- [ ] Gestion baux longue durée : durée légale, date renouvellement, indice révision loyer IPC
- [ ] Page écheancier mensuel — liste des mois, statut paiement (payé/dû/en retard), quittances
- [ ] Gestion multi-propriétaires — assigner un bien à un propriétaire externe, rapport revenus par propriétaire

#### Module Véhicules
- [ ] Champs spécifiques Asset type VEHICLE : marque, modèle, année, immatriculation, km actuel, assurance expiry, vignette expiry
- [ ] Saisie km départ/retour sur booking — calcul dépassement kilométrique
- [ ] Vue flotte — statut de tous les véhicules, alertes assurance/vignette expirée

#### Module Hôtellerie
- [ ] Champs spécifiques Asset type HOSPITALITY : type chambre, numéro, étage, capacité, équipements
- [ ] Check-in / Check-out — formulaire avec heure, identité vérifiée, clé remise
- [ ] Options suppléments — petit-déjeuner, parking, transfert aéroport, ajout au total booking

#### Module Équipements
- [ ] Champs spécifiques Asset type EQUIPMENT : catégorie, numéro série, état initial, valeur remplacement
- [ ] Caution obligatoire — workflow : saisie caution, vérification état retour, restitution/déduction
- [ ] Formulaire état équipement — entrée/sortie avec photos signées

### Dependencies
- Phases 1–5 complètes

---

## Phase 7 — Analytics, Settings & Admin Plateforme
**Goal:** Analytics complets, configuration organisation, interface Super Admin, préparation déploiement.

### Tasks

#### Analytics
- [ ] Page `/dashboard/analytics` — 4 onglets : Vue globale | Immobilier | Véhicules | Équipements/Hôtellerie
- [ ] Graphique revenus mensuels (recharts LineChart/BarChart)
- [ ] Graphique taux d'occupation par asset (heatmap calendrier ou barres)
- [ ] Tableau ROI par asset : revenus - coûts maintenance = ROI net
- [ ] Carte de chaleur disponibilité assets
- [ ] Export Excel (`xlsx`) — rapport complet avec plusieurs onglets

#### Settings Organisation
- [ ] Page `/dashboard/settings` — logo upload, nom, devise principale, langue par défaut
- [ ] Page `/dashboard/settings/members` — inviter membres, changer rôles, retirer accès
- [ ] Page `/dashboard/settings/modules` — activer/désactiver modules par secteur
- [ ] Page `/dashboard/settings/templates` — prévisualiser et personnaliser templates contrats PDF

#### Super Admin
- [ ] Page `/admin` — dashboard plateforme (nb organisations, nb utilisateurs, revenus SaaS)
- [ ] Page `/admin/organizations` — liste organisations, plan actuel, date création, actions (suspendre/activer)
- [ ] Page `/admin/organizations/[id]` — détail organisation, modules, utilisateurs, logs

#### Abonnements SaaS
- [ ] Définir plans : Free (1 org, 5 assets), Starter (50 assets), Pro (illimité), Enterprise (custom)
- [ ] Intégrer DGateway pour paiement abonnement organisation
- [ ] Gate des features par plan (ex: export Excel → Starter+, e-signature → Pro+)

### Dependencies
- Phases 1–6 complètes

---

## Phase 8 — Polish, i18n Complet & Déploiement
**Goal:** App production-ready, toutes les traductions complètes, déployée sur Vercel avec domaine custom.

### Tasks

#### i18n Complet
- [ ] Compléter toutes les traductions FR — vérifier 100% des clés dans tous les composants
- [ ] Compléter toutes les traductions EN
- [ ] Compléter toutes les traductions AR — vérifier le support RTL (direction: rtl sur html, marges inversées)
- [ ] Tester le switcher de langue dans le header (persistance via cookie)
- [ ] Tester l'interface en AR RTL sur mobile et desktop

#### Tests & QA
- [ ] Tester tous les CRUD end-to-end (assets, clients, bookings, contrats, paiements)
- [ ] Tester le workflow complet : réservation → contrat → signature → paiement → quittance
- [ ] Tester les conflits de réservation (dates qui se chevauchent)
- [ ] Tester l'isolation multi-tenant (org A ne voit pas les données de org B)
- [ ] Tester les flux auth (login, signup, OAuth, reset password)
- [ ] Tester le paiement DGateway en mode test
- [ ] Tester l'e-signature YouSign en sandbox
- [ ] Vérifier le responsive design sur mobile (priorité tablette et mobile)

#### Déploiement
- [ ] Configurer toutes les variables d'environnement dans Vercel
- [ ] Déployer sur Vercel (connexion GitHub repo)
- [ ] Appliquer les migrations Prisma sur la base de données de production Neon
- [ ] Configurer DNS Cloudflare + domaine custom (EnyaRent.ma ou similaire)
- [ ] Vérifier le domaine d'envoi Resend (SPF, DKIM, DMARC)
- [ ] Tester les webhooks DGateway et YouSign en production (HTTPS requis)
- [ ] Configurer cron jobs Vercel (relances impayés) via `vercel.json`

### Production Checklist
- [ ] Toutes les env vars configurées dans Vercel
- [ ] Migrations BDD appliquées en production
- [ ] Auth fonctionne sur le domaine de production
- [ ] Domaine custom live avec SSL
- [ ] Emails arrivent en boîte de réception (pas spam)
- [ ] Upload fichiers R2 fonctionnel en production
- [ ] Webhooks DGateway et YouSign actifs
- [ ] Pages 404 et error stylées
- [ ] Dark mode et RTL AR testés en production
- [ ] Super Admin peut créer une organisation et tester le flow complet
