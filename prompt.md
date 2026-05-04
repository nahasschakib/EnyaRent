# Claude Code — Build Prompt — EnyaRent

Lis les fichiers suivants dans cet ordre AVANT de faire quoi que ce soit :

1. `master_prompt.md` — Règles tech stack, patterns Prisma v7, standards de code. Suivre EXACTEMENT.
2. `design-style-guide.md` — Système de design visuel EnyaRent (orange brand, slate neutrals, dark mode, RTL AR). Appliquer à chaque composant.
3. `jb-components.md` — Référence composants JB. Utiliser ces composants avant d'écrire from scratch.
4. `project-description.md` — Ce que nous construisons. Chaque décision doit s'aligner avec ce document.
5. `project-phases.md` — Le plan de build. Travailler les phases dans l'ordre.

---

## Règles Absolues

- Travailler **une phase à la fois**. Compléter toutes les tâches d'une phase avant de passer à la suivante.
- Après chaque phase, **s'arrêter et me confirmer** avant de continuer.
- Suivre exactement les tokens du `design-style-guide.md` (couleurs orange primary, slate neutrals, spacing, radius, dark mode).
- Utiliser **Prisma v7** (PAS v6). Voir `master_prompt.md` pour les patterns exacts.
- Utiliser **React Query** pour tout data fetching. Jamais useEffect pour les données.
- Utiliser **React Hook Form + Zod** pour tous les formulaires.
- Utiliser **API Routes (Route Handlers)** pour toute la logique serveur.
- Utiliser **@react-pdf/renderer** pour la génération PDF. Jamais jsPDF.
- Utiliser **xlsx** pour l'export Excel.
- Utiliser **next-intl** pour l'i18n (FR, AR avec RTL, EN). Chaque texte UI doit passer par les clés de traduction.
- **Dark mode** : ThemeProvider + next-themes. Chaque composant doit avoir ses variantes dark.
- **RTL (Arabe)** : Utiliser les classes Tailwind `rtl:` sur chaque composant. Tester en AR.
- **Multi-tenant** : Chaque API Route doit filtrer par `organization_id`. Ne jamais retourner des données cross-tenant.
- **RBAC** : Vérifier le rôle utilisateur avant chaque action API. SUPER_ADMIN > ADMIN > MANAGER > OWNER > CLIENT.
- **Audit logs** : Logger toutes les mutations (create/update/delete) dans la table AuditLog.
- **Avant de construire** auth, file uploads, checkout, data tables from scratch — vérifier `jb-components.md` et installer le composant JB correspondant.

---

## Contexte Projet

**Produit :** Universal Rental Management System (EnyaRent) — SaaS multi-tenant de gestion de locations pour le marché marocain et international.

**Secteurs MVP :** Immobilier (longue durée), Véhicules (courte durée), Hôtellerie (booking par nuit), Équipements (BTP/audiovisuel).

**Stack :**
- Next.js 16 (App Router) + TypeScript
- Neon PostgreSQL + Prisma v7
- Better Auth (5 rôles : SUPER_ADMIN, ADMIN, MANAGER, OWNER, CLIENT)
- React Query + Zod + React Hook Form
- DGateway (paiements MAD/EUR/USD — carte marocaine CMI, mobile money)
- Cloudflare R2 (stockage photos, documents, pièces jointes)
- YouSign API (e-signature contrats)
- Resend + React Email (11 templates email)
- @react-pdf/renderer (contrats PDF, factures, quittances)
- next-intl (FR, AR/RTL, EN)
- next-themes (dark mode)
- recharts (analytics)

**Brand :** Orange #EA580C comme couleur primary. Slate pour les neutres. Style SaaS professionnel autoritaire.

---

## Ordre d'Installation des Composants JB

Respecter cet ordre de prérequis :

```bash
# Phase 1 — Auth (requis en premier)
pnpm dlx shadcn@latest add https://better-auth-ui.desishub.com/r/auth-components.json

# Phase 2 — Tables, Selects, Storage
pnpm dlx shadcn@latest add https://jb.desishub.com/r/data-table.json
pnpm dlx shadcn@latest add https://jb.desishub.com/r/searchable-select.json
pnpm dlx shadcn@latest add https://file-storage-registry.vercel.app/r/file-storage.json

# Phase 4 — Paiements (après auth)
pnpm dlx shadcn@latest add https://ui-components.desishub.com/r/dgateway-shop.json

# Landing page
pnpm dlx shadcn@latest add https://ui-components.desishub.com/r/website-ui.json
```

---

## Variables d'Environnement Requises

Créer `.env.example` (commité) et `.env.local` (gitignored) avec ces variables exactes :

```env
# Database
DATABASE_URL=

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Cloudflare R2
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_ENDPOINT=
CLOUDFLARE_R2_BUCKET_NAME=
CLOUDFLARE_R2_PUBLIC_DEV_URL=

# DGateway
DGATEWAY_API_URL=
DGATEWAY_API_KEY=

# YouSign
YOUSIGN_API_KEY=
YOUSIGN_API_URL=

# App
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_APP_URL=
```

---

## Architecture API Routes

Toutes les routes API suivent ce pattern :

```
/api/v1/[resource]          → GET (liste paginée), POST (création)
/api/v1/[resource]/[id]     → GET (détail), PUT (mise à jour), DELETE
/api/v1/[resource]/[id]/[action] → actions spécifiques
/api/webhooks/[service]     → webhooks DGateway, YouSign
```

**Chaque route API doit :**
1. Vérifier l'authentification (`session`)
2. Vérifier le rôle requis (RBAC)
3. Filtrer par `organizationId` de l'utilisateur connecté
4. Valider le body avec Zod
5. Logger l'action dans AuditLog (pour les mutations)
6. Retourner `{ data, meta }` pour les listes (avec pagination)

---

## Schéma Prisma — Patterns Clés

```prisma
// Pattern multi-tenant — OBLIGATOIRE sur toutes les entités métier
model Asset {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  // ... autres champs
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([organizationId])
}

// Pattern audit log — créer après chaque mutation
model AuditLog {
  id             String   @id @default(cuid())
  organizationId String
  userId         String
  action         String   // "CREATE_ASSET", "UPDATE_BOOKING", etc.
  entity         String   // "Asset", "Booking", etc.
  entityId       String
  oldValue       Json?
  newValue       Json?
  ip             String?
  createdAt      DateTime @default(now())
}
```

---

## Spécificités Secteurs — Champs Metadata (JSON)

Le champ `metadata` (JSON) sur `Asset` stocke les informations spécifiques par secteur :

```typescript
// REAL_ESTATE
type RealEstateMetadata = {
  surface: number;        // m²
  rooms: number;
  floor: number;
  furnished: boolean;
  charges: number;        // charges mensuelles MAD
  dpe: string;            // classe énergie
  leaseType: "1YR" | "2YR" | "6M";
  renewalDate?: string;
}

// VEHICLE
type VehicleMetadata = {
  brand: string;
  model: string;
  year: number;
  plate: string;
  mileage: number;
  fuelType: "GASOLINE" | "DIESEL" | "ELECTRIC" | "HYBRID";
  insuranceExpiry: string;
  vignetteExpiry: string;
  extraKmRate: number;    // MAD par km dépassement
}

// HOSPITALITY
type HospitalityMetadata = {
  roomNumber: string;
  floor: number;
  roomType: "SINGLE" | "DOUBLE" | "SUITE" | "FAMILY";
  capacity: number;
  amenities: string[];
  checkinTime: string;    // "14:00"
  checkoutTime: string;   // "11:00"
}

// EQUIPMENT
type EquipmentMetadata = {
  category: string;
  serialNumber: string;
  condition: "NEW" | "GOOD" | "FAIR" | "POOR";
  replacementValue: number;
  depositRequired: number;
  rateUnit: "HOUR" | "DAY" | "WEEK";
}
```

---

## Système de Tickets — Patterns Clés

Le système de tickets est le même moteur pour **Support Tickets** (client → agence) et **Maintenance Tickets** (agence → prestataire). Différencier par un champ `category: "SUPPORT" | "MAINTENANCE"`.

**Workflow obligatoire :**
1. Création ticket → email "Nouveau ticket" à l'assigné
2. Nouveau commentaire → email à tous les participants + mentions @
3. Changement statut → email au créateur + assigné
4. @mention dans commentaire → email uniquement à la personne mentionnée

**Parsing @mentions :**
```typescript
function parseMentions(text: string): string[] {
  const regex = /@(\w+)/g;
  return [...text.matchAll(regex)].map(m => m[1]);
}
```

---

## Génération PDF — Patterns Clés

```typescript
// Toujours utiliser @react-pdf/renderer, jamais jsPDF
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

// Couleurs brand dans les PDFs
const BRAND_COLOR = "#EA580C"; // orange EnyaRent
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const BORDER_COLOR = "#E2E8F0";

// Route de génération et stockage
// 1. Générer le PDF en mémoire avec renderToBuffer()
// 2. Uploader sur R2 avec nom structuré : contracts/[orgId]/[contractId].pdf
// 3. Sauvegarder l'URL publique dans la BDD
// 4. Retourner l'URL pour téléchargement/aperçu
```

---

## DGateway — Patterns Paiement

```typescript
// Créer une intention de paiement
const response = await fetch(`${process.env.DGATEWAY_API_URL}/payments`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.DGATEWAY_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    amount: booking.totalAmount,
    currency: "MAD", // ou EUR, USD
    description: `Paiement réservation ${booking.id}`,
    reference: booking.id,
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/pay/success`,
    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/pay/cancel`,
  }),
});

// Webhook handler
// POST /api/webhooks/dgateway
// Vérifier signature, mettre à jour Payment.status, générer quittance, envoyer email
```

---

## YouSign — Patterns E-Signature

```typescript
// Créer une demande de signature
const response = await fetch(`${process.env.YOUSIGN_API_URL}/signature_requests`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.YOUSIGN_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: `Contrat ${contract.id}`,
    delivery_mode: "email",
    signers: [
      { email: customer.email, first_name: customer.firstName, last_name: customer.lastName }
    ],
  }),
});

// Webhook handler
// POST /api/webhooks/yousign
// Events: "signer.done", "request.done" → mettre à jour Contract.status, archiver PDF signé
```

---

## Démarrage

Commence par **Phase 1 — Foundation** du fichier `project-phases.md`. Lis toutes les tâches de la phase et exécute-les dans l'ordre. Arrête-toi et confirme avec moi après avoir terminé Phase 1.
