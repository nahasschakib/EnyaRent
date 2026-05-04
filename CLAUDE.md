@AGENTS.md
# EnyaRent — Instructions permanentes Claude Code

> Ce fichier est lu automatiquement à chaque session Claude Code.
> Ne jamais le modifier sans validation.

---

## 🚨 Règles absolues (jamais violer)

1. **Jamais de liens markdown** `[texte](url)` dans le code TypeScript/JavaScript
2. **Variables d'environnement** : écrire `process.env.VARIABLE_NAME` directement, jamais entre crochets
3. **middleware.ts** : uniquement `NextResponse.next()` — jamais `createMiddleware` de next-intl
4. **next-intl** : s'utilise uniquement via `getLocale()` et `getMessages()` dans `layout.tsx` côté serveur
5. **Prisma v7** : `datasource.url` dans `prisma.config.ts` uniquement — jamais dans `schema.prisma`
6. **Après chaque fichier écrit** : vérifier avec `grep -r "](http://" [fichier]`
7. **Turbopack** : ne jamais ajouter `turbo` dans `experimental` de `next.config.ts`
8. **`pnpm dev`** : sans `--turbopack`

---

## 🏗️ Stack technique

| Couche | Technologie | Version |
|--------|------------|---------|
| Framework | Next.js App Router | 16.2.4 |
| Langage | TypeScript | ^5 |
| Style | Tailwind CSS | v4 |
| Base de données | Neon PostgreSQL | - |
| ORM | Prisma | v7.8 |
| Auth | Better Auth | ^1.6.9 |
| Data fetching | React Query | ^5 |
| Formulaires | React Hook Form + Zod | ^7 + ^4 |
| i18n | next-intl | ^4 |
| Dark mode | next-themes | ^0.4 |
| Paiements | DGateway (MAD/EUR/USD) | - |
| Fichiers | Cloudflare R2 | - |
| E-signature | YouSign API | v3 |
| PDF | @react-pdf/renderer | ^4 |
| Excel | xlsx | ^0.18 |
| Emails | Resend + React Email | - |
| Notifications | Sonner | ^2 |
| Icônes | Lucide React | ^1 |

---

## 👥 Rôles utilisateurs (Better Auth)

```
SUPER_ADMIN  → Gère la plateforme entière
ADMIN        → Gère son organisation
MANAGER      → Gère assets, clients, contrats
OWNER        → Voit ses biens et revenus
CLIENT       → Portail client (réservations, paiements, tickets)
```

---

## 📁 Chemins importants

```
Prisma client généré  : src/generated/prisma/client
Config Prisma         : prisma.config.ts (racine)
Schema Prisma         : prisma/schema.prisma
i18n request config   : i18n/request.ts
Messages              : messages/fr.json, messages/ar.json, messages/en.json
Middleware            : src/middleware.ts
Design tokens         : src/app/globals.css
Composants UI         : src/components/ui/
Composants layout     : src/components/layout/
Composants landing    : src/components/landing/
Providers             : src/components/providers.tsx
Auth server           : src/lib/auth.ts
Auth client           : src/lib/auth-client.ts
DB client             : src/lib/db.ts
Session utils         : src/lib/session.ts
Utils                 : src/lib/utils.ts
```

---

## 🗂️ Routes de l'application

```
/                         → Landing page (server component)
/auth/sign-in             → Connexion
/auth/sign-up             → Inscription
/auth/forgot-password     → Mot de passe oublié
/auth/reset-password      → Réinitialisation

/dashboard                → KPIs globaux (ADMIN, MANAGER, OWNER)
/dashboard/assets         → Liste assets
/dashboard/assets/new     → Créer asset
/dashboard/assets/[id]    → Détail asset
/dashboard/bookings       → Réservations
/dashboard/bookings/new   → Nouvelle réservation
/dashboard/bookings/[id]  → Détail réservation
/dashboard/customers      → Clients
/dashboard/customers/new  → Créer client
/dashboard/customers/[id] → Fiche client
/dashboard/contracts      → Contrats
/dashboard/contracts/[id] → Détail contrat + e-signature
/dashboard/payments       → Paiements + impayés
/dashboard/invoices       → Factures
/dashboard/maintenance    → Tickets maintenance
/dashboard/tickets        → Tickets support GitHub-style
/dashboard/calendar       → Calendrier disponibilité
/dashboard/analytics      → Rapports + export Excel
/dashboard/settings       → Config organisation
/dashboard/notifications  → Centre notifications

/portal                   → Dashboard client (CLIENT)
/portal/bookings          → Mes réservations
/portal/payments          → Mes paiements
/portal/pay/[bookingId]   → Paiement DGateway
/portal/documents         → Mes documents
/portal/tickets           → Mes tickets
/portal/profile           → Mon profil

/admin                    → Super Admin (SUPER_ADMIN)
/admin/organizations      → Gestion organisations
```

---

## 🗄️ Pattern API Routes (obligatoire)

```typescript
// Toutes les routes API suivent ce pattern :
// GET /api/v1/[resource]?page=1&limit=20&search=...&organizationId=...

export async function GET(request: Request) {
  // 1. Vérifier la session
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Vérifier le rôle
  if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 3. Filtrer par organizationId (multi-tenant obligatoire)
  const { organizationId } = session.user
  
  // 4. Valider les params avec Zod
  // 5. Requête Prisma avec organizationId
  // 6. Logger dans AuditLog (mutations uniquement)
  // 7. Retourner { data, meta: { total, page, limit } }
}
```

---

## 🎨 Design System EnyaRent

```
Couleur brand    : Orange #EA580C (primary-600)
Hover            : #C2410C (primary-700)
Neutrals         : Slate (slate-50 à slate-900)
Font             : Inter (next/font/google)
Border radius    : 8px défaut, 12px cards, 16px modales
Dark mode        : Supporté (ThemeProvider + next-themes)
RTL              : Supporté pour AR (classes rtl: Tailwind)

Secteurs (couleurs accent) :
  Immobilier → Indigo  (#4F46E5)
  Véhicules  → Cyan    (#0891B2)
  Hôtellerie → Violet  (#7C3AED)
  Équipements→ Amber   (#D97706)
```

---

## ⚙️ Commandes projet

```bash
pnpm dev              # Démarrer le serveur (sans turbopack)
pnpm build            # Build production
pnpm db:push          # Appliquer le schema Prisma
pnpm db:generate      # Générer le client Prisma
pnpm db:studio        # Ouvrir Prisma Studio
pnpm lint             # Linter ESLint
```

---

## ✅ Vérifications obligatoires

```bash
# Après chaque fichier écrit — détecter markdown corrompu
grep -r "](http://" src/ --include="*.ts" --include="*.tsx"

# Vérifier variables d'env corrompues
grep -r "http://process.env" src/ --include="*.ts" --include="*.tsx"

# Si ces commandes retournent vide → tout est propre ✅
# Si résultat non vide → corriger immédiatement avant de continuer

# Après chaque phase — vérifier que ça compile
pnpm dev
```

---

## 📋 Workflow par phase (obligatoire)

```
1. Lire project-phases.md pour la phase concernée
2. Afficher le plan des fichiers (tableau avec numéro, chemin, action)
3. Pour chaque fichier :
   a. Montrer le contenu complet
   b. Attendre confirmation
   c. Écrire avec Write()
   d. Vérifier avec grep
4. Fin de phase :
   - pnpm dev → confirmer que ça compile
   - Confirmer avec l'utilisateur avant phase suivante
```

---

## 🔄 Template reprise de session

```
Lis CLAUDE.md en premier.

État EnyaRent :
- Phase 1 : ✅ Complète
- Phase 2 : 🔄 En cours

Dernière action : [décrire]
Reprendre depuis : [fichier ou tâche]

Règles actives : voir CLAUDE.md
```

---

## 📦 Modules Prisma schema (Phase 2+)

```prisma
// Entités à créer en Phase 2 :
Asset, AssetType, AssetPhoto
Customer, Guarantor
Booking, AvailabilityBlock
Contract, Inspection
Payment, Invoice
MaintenanceTicket
SupportTicket, TicketComment, TicketActivity, TicketLabel
Notification

// Règle multi-tenant : chaque modèle doit avoir
organizationId String
organization   Organization @relation(...)
@@index([organizationId])
```

---

## 🔗 Intégrations externes

```
DGateway    : https://dgatewayapi.desispay.com
             → paiements MAD/EUR/USD (CMI, mobile money, virement)
             → webhook : /api/webhooks/dgateway

YouSign     : https://api.yousign.app/v3
             → e-signature contrats PDF
             → webhook : /api/webhooks/yousign

Resend      : emails transactionnels
             → 11 templates (bienvenue, quittance, relance, tickets...)

Cloudflare R2 : stockage fichiers
             → photos assets, PDFs contrats, pièces jointes tickets
```

---

*EnyaRent — Universal Rental Management System*
*Marché marocain · Multi-tenant · Multi-secteurs*