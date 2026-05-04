# EnyaRent — Universal Rental Management System — Design Style Guide

> Single source of truth for all visual and interaction decisions in EnyaRent. Reference this file before writing any UI code.
>
> **Aesthetic**: Professional Authority (Linear + Stripe school, adapted for Moroccan market)
> **Scope**: Dashboard, Landing, Portail Client, PDF Templates (Contrats, Factures, Quittances), Email Templates
> **Dark mode**: YES — ThemeProvider + next-themes. Toutes les couleurs ont leur variante dark.
> **RTL**: YES — interface supporte l'arabe (AR) en RTL. Utiliser les utilitaires Tailwind `rtl:` prefix.

---

## 1. Design Philosophy

EnyaRent est une plateforme SaaS B2B pour agences et PME marocaines. L'UI doit inspirer **confiance, sérieux et efficacité** — la plateforme qui gère des contrats, des paiements et des actifs de valeur ne peut pas paraître amateur.

**Trois principes fondamentaux :**

1. **Autorité professionnelle** — L'orange est utilisé avec précision comme signal d'action et d'identité. Le reste est neutre, dense en information, jamais creux.
2. **Densité maîtrisée** — Les gestionnaires d'agence traitent beaucoup de données. L'UI doit être lisible et dense sans être étouffante. Tables spacieuses, hiérarchie typographique claire.
3. **Confiance par la cohérence** — Chaque secteur (immobilier, véhicules, hôtellerie, équipements) utilise les mêmes patterns visuels. L'utilisateur apprend une fois, utilise partout.

---

## 2. Typography

### Font Family

**Police principale : [Inter](https://fonts.google.com/specimen/Inter)** (Google Fonts)

Chargée via `next/font/google` :

```tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
```

Appliquer via `className={inter.variable}` sur le root layout.

**Pourquoi Inter** : police système-like au rendu excellent sur tous les écrans, lisible à petite taille pour les données tabulaires (chiffres, dates, montants), excellente en RTL avec fallback système arabe.

**Pour le texte arabe** : la font système Arabic est utilisée en fallback automatique — `font-family: var(--font-inter), 'Arabic Typesetting', 'Traditional Arabic', sans-serif`.

### Type Scale

| Style | Taille | Poids | Line Height | Tracking | Usage |
|-------|--------|-------|-------------|----------|-------|
| `display` | 48px | 700 | 1.1 | -0.02em | Hero landing |
| `display-sm` | 36px | 700 | 1.15 | -0.02em | Sections landing |
| `h1` | 28px | 600 | 1.2 | -0.015em | Titres de pages dashboard |
| `h2` | 22px | 600 | 1.25 | -0.01em | Sections, onglets |
| `h3` | 18px | 600 | 1.3 | -0.005em | Titres de cards, modales |
| `h4` | 15px | 600 | 1.4 | 0 | Labels de sections |
| `body-lg` | 16px | 400 | 1.6 | 0 | Landing body |
| `body` | 14px | 400 | 1.5 | 0 | Texte dashboard par défaut |
| `body-sm` | 13px | 400 | 1.5 | 0 | Infos secondaires, tables |
| `caption` | 12px | 500 | 1.4 | 0.01em | Méta, timestamps, badges |
| `micro` | 11px | 600 | 1.3 | 0.04em | Labels uppercase, eyebrows |
| `tabular` | 14px | 500 | 1.5 | 0 | Montants, nombres — `tabular-nums` obligatoire |
| `amount-lg` | 28px | 700 | 1.1 | -0.02em | Montants KPI, totaux contrats |

**Règles :**
- Toujours `tabular-nums` pour montants (MAD, EUR, USD), numéros de contrats, dates
- Headings : poids 600, jamais 800 dans le chrome UI
- Marketing display : 700 accepté
- `line-height` serré (1.1–1.3) pour headings, 1.5 pour body

---

## 3. Color Palette

### Primary (Orange EnyaRent)

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-50` | `#FFF7ED` | Fonds subtils, lignes sélectionnées |
| `primary-100` | `#FFEDD5` | Hover surfaces, highlights légers |
| `primary-400` | `#FB923C` | Icônes accent, tags légers |
| `primary-500` | `#F97316` | Couleur brand secondaire |
| `primary-600` | `#EA580C` | **Brand principal** — boutons, états actifs, CTA, logo |
| `primary-700` | `#C2410C` | Hover bouton, pressed |
| `primary-900` | `#7C2D12` | Texte sombre sur fond clair (rarement) |

### Neutrals (Slate)

| Token | Hex | Dark Mode | Usage |
|-------|-----|-----------|-------|
| `neutral-50` | `#F8FAFC` | `#0F172A` | Fond de page |
| `neutral-100` | `#F1F5F9` | `#1E293B` | Cards, header tables, surfaces atténuées |
| `neutral-200` | `#E2E8F0` | `#334155` | Bordures, dividers, input outlines |
| `neutral-300` | `#CBD5E1` | `#475569` | Placeholder, disabled borders |
| `neutral-400` | `#94A3B8` | `#64748B` | Icônes neutres, méta texte |
| `neutral-500` | `#64748B` | `#94A3B8` | Texte secondaire, captions |
| `neutral-600` | `#475569` | `#CBD5E1` | Texte body secondaire |
| `neutral-700` | `#334155` | `#E2E8F0` | Texte body principal |
| `neutral-900` | `#0F172A` | `#F8FAFC` | Headings, texte principal |
| `white` | `#FFFFFF` | `#1E293B` | Cards, modales, sidebar |

### Semantic

| Token | Light Hex | Usage |
|-------|-----------|-------|
| `success-50` | `#F0FDF4` | Fond badge "Payé", "Signé" |
| `success-600` | `#16A34A` | Statut payé, montants positifs |
| `warning-50` | `#FFFBEB` | Fond badge "En attente", alertes |
| `warning-600` | `#D97706` | Impayés imminents, avertissements |
| `error-50` | `#FEF2F2` | Fond badge "Annulé", "Impayé" |
| `error-600` | `#DC2626` | Impayés, erreurs, actions destructives |
| `info-50` | `#EFF6FF` | Fond badge "Info", notifications |
| `info-600` | `#2563EB` | Liens, badges info, états neutres |

### Statuts Booking / Réservation

| Statut | Background | Texte | Dot |
|--------|-----------|-------|-----|
| Pending | `warning-50` | `warning-600` | `warning-600` |
| Confirmed | `info-50` | `info-600` | `info-600` |
| Active | `primary-50` | `primary-700` | `primary-600` |
| Completed | `success-50` | `success-600` | `success-600` |
| Cancelled | `neutral-100` | `neutral-500` | `neutral-400` |

### Statuts Contrat

| Statut | Background | Texte |
|--------|-----------|-------|
| Draft | `neutral-100` | `neutral-600` |
| Sent | `info-50` | `info-600` |
| Signed | `success-50` | `success-600` |
| Archived | `neutral-100` | `neutral-500` |

### Statuts Tickets (GitHub-style)

| Statut | Background | Texte | Icône |
|--------|-----------|-------|-------|
| Open | `success-50` | `success-600` | Circle dot |
| In Progress | `primary-50` | `primary-700` | Clock |
| On Hold | `warning-50` | `warning-600` | Pause |
| Resolved | `info-50` | `info-600` | Check circle |
| Closed | `neutral-100` | `neutral-500` | X circle |

### Secteurs (couleurs d'accent)

| Secteur | Couleur | Hex | Usage |
|---------|---------|-----|-------|
| Immobilier | Indigo | `#4F46E5` | Badge secteur, icône |
| Véhicules | Cyan | `#0891B2` | Badge secteur, icône |
| Hôtellerie | Violet | `#7C3AED` | Badge secteur, icône |
| Équipements | Amber | `#D97706` | Badge secteur, icône |

**Pas de gradients dans le chrome applicatif.** Gradients acceptés uniquement :
- Hero landing (radial très subtil `primary-50 → transparent`)
- Card plan Pro/Enterprise (gradient subtil orange)

---

## 4. Spacing

**Grille de 8px.** Tout spacing = multiple de 4.

| Token | Valeur | Usage |
|-------|--------|-------|
| `space-0.5` | 2px | Espacement interne icônes |
| `space-1` | 4px | Padding badges, gaps serrés |
| `space-2` | 8px | Entre éléments inline liés |
| `space-3` | 12px | Padding input interne, gaps cards |
| `space-4` | 16px | Gap standard entre composants |
| `space-5` | 20px | Padding interne petites cards |
| `space-6` | 24px | Padding interne cards (défaut) |
| `space-8` | 32px | Entre sections d'une page |
| `space-10` | 40px | Séparateurs de sections |
| `space-12` | 48px | Grands espacements sections |
| `space-16` | 64px | Sections landing padding |
| `space-24` | 96px | Hero landing padding vertical |

**Espacements globaux :**
- Max-width contenu dashboard : `1440px` avec `px-8` desktop, `px-4` mobile
- Largeur sidebar : `260px` (étendue), `72px` (réduite)
- Padding top contenu principal : `24px` sous le header
- Gap section à section : `32px`
- Padding interne card : `24px` (défaut), `32px` (cards hero/KPI)

**Densité : Confortable** — lignes de table `48px`, formulaires respirables

---

## 5. Border Radius

| Token | Valeur | Usage |
|-------|--------|-------|
| `radius-sm` | 6px | Inputs, chips, pills |
| `radius` | 8px | **Défaut** — boutons, badges, petites cards |
| `radius-md` | 10px | Cards medium, contenu modales |
| `radius-lg` | 12px | Cards dashboard principales, containers tables |
| `radius-xl` | 16px | Modales shell, grandes cards features |
| `radius-2xl` | 20px | Cards hero landing uniquement |
| `radius-full` | 9999px | Avatars, dots statuts, pills icônes |

**Règle** : Ne jamais mélanger les valeurs de radius dans un même container.

---

## 6. Shadows & Elevation

```
shadow-xs:    0 1px 2px 0 rgba(15, 23, 42, 0.05)
shadow-sm:    0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.04)
shadow-md:    0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)
shadow-lg:    0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)
shadow-xl:    0 20px 25px -5px rgba(15, 23, 42, 0.10), 0 8px 10px -6px rgba(15, 23, 42, 0.04)

shadow-focus: 0 0 0 3px rgba(234, 88, 12, 0.20)  // Focus rings — orange brand
```

**Usage :**
- Cards sur page : `shadow-xs` + `border border-neutral-200`
- Hover cards interactives : `shadow-sm`
- Dropdowns & popovers : `shadow-md` + `border border-neutral-200`
- Modales : `shadow-xl`
- Focus rings : `shadow-focus` (orange) au lieu d'outline
- Inputs : **pas de shadow** — bordure uniquement

---

## 7. Component Specifications

### 7.1 Buttons

**Bouton Primary**
- Background : `primary-600` (`#EA580C`)
- Texte : Blanc, `14px` poids 500
- Hauteur : `40px` (défaut), `36px` (sm), `44px` (lg)
- Padding horizontal : `16px`
- Border radius : `radius` (8px)
- Hover : `primary-700`
- Active : `primary-700` + scale(0.98)
- Focus : `shadow-focus` orange
- Disabled : `neutral-200` bg, `neutral-400` texte
- Loading : spinner remplace l'icône, texte maintenu

**Bouton Secondary (Outline)**
- Background : White / dark: `neutral-900`
- Bordure : `1px solid neutral-200`
- Texte : `neutral-900`, 14px poids 500
- Hover : `neutral-50` bg, `neutral-300` bordure

**Bouton Ghost**
- Background : Transparent
- Texte : `neutral-700`
- Hover : `neutral-100` bg

**Bouton Destructive**
- Background : `error-600`
- Texte : Blanc
- Hover : `#B91C1C`
- Réservé aux actions de suppression/annulation

**Bouton Secteur** (accent par secteur)
- Immobilier : `bg-indigo-600 hover:bg-indigo-700`
- Véhicules : `bg-cyan-600 hover:bg-cyan-700`
- Hôtellerie : `bg-violet-600 hover:bg-violet-700`
- Équipements : `bg-amber-600 hover:bg-amber-700`

---

### 7.2 Inputs

- Hauteur : `40px`
- Background : White / dark: `neutral-900`
- Bordure : `1px solid neutral-200`
- Radius : `radius-sm` (6px)
- Padding : `12px` horizontal
- Texte : `14px`, `neutral-900`
- Placeholder : `neutral-400`
- Focus : bordure `primary-600` + `shadow-focus` orange, **pas d'outline**
- Disabled : `neutral-50` bg, `neutral-400` texte
- Invalid : bordure `error-600`, message d'erreur en dessous (`13px`, `error-600`)
- Label au-dessus : `13px` poids 500, `neutral-700`, `8px` gap avec l'input
- Helper text : `12px`, `neutral-500`
- **RTL** : utiliser `rtl:text-right`, `rtl:pr-4 rtl:pl-3`

---

### 7.3 Cards

**Card Défaut**
- Background : White / dark: `neutral-900` (`#1E293B`)
- Bordure : `1px solid neutral-200`
- Radius : `radius-lg` (12px)
- Shadow : `shadow-xs`
- Padding : `24px`
- Hover (si interactive) : `shadow-sm` + `border-neutral-300`

**Card KPI (dashboard)**
- Label : `caption` uppercase `neutral-500` tracking-wider
- Valeur : `28px` poids 600 `neutral-900`, `tabular-nums`
- Delta : `13px` poids 500, `success-600` (hausse) ou `error-600` (baisse)
- Icône : coin supérieur droit, `20px`, `neutral-400` / active: `primary-600`
- Border gauche accent par secteur (4px) : Immobilier indigo / Véhicules cyan / Hôtellerie violet / Équipements amber

**Card Asset**
- Photo cover en haut (aspect ratio 16:9, object-cover)
- Badge secteur en overlay top-left
- Badge statut top-right
- Contenu : nom (`h3`), type, localisation (`body-sm neutral-500`), prix/unité (`tabular` `primary-600`)

**Card Feature (landing)**
- Padding : `32px`
- Icône : `40px`, couleur secteur dans un carré `neutral-100` (`radius`)
- Titre : `h3`
- Description : `body` `neutral-600`

---

### 7.4 Tables

- Header row : `bg-neutral-50`, `13px` poids 600 `neutral-600` uppercase tracking-wider, `48px` hauteur
- Body row : `52px` hauteur, `14px` `neutral-700`
- Bordure bottom entre lignes : `1px solid neutral-100`
- Hover ligne : `bg-neutral-50`
- Ligne sélectionnée : `bg-primary-50`
- Padding première colonne : `24px` gauche
- Padding dernière colonne : `24px` droite
- Indicateurs tri : chevron `neutral-400`, `primary-600` si actif
- Header sticky au scroll
- Zebra striping : **désactivé** — dividers uniquement

**Colonnes spéciales :**
- Montant : `tabular-nums`, aligné à droite, devise en `caption neutral-500`
- Statut : badge coloré (voir §3)
- Asset : photo miniature `32×32` + nom + type en `caption`
- Client : avatar initiales + nom + email `caption`
- Actions : icônes hover-reveal (voir, éditer, supprimer)

---

### 7.5 Status Badges

- Hauteur : `24px`
- Padding : `4px 10px`
- Radius : `radius-full`
- Font : `12px` poids 500
- Dot : cercle `6px`, `6px` right margin
- Bordure subtile : `border border-[color]/20`

**Exemple — Active :**
```
bg-primary-50 text-primary-700 border border-primary-600/20
● Active
```

**Badge Secteur :**
```
bg-indigo-50 text-indigo-700   → Immobilier
bg-cyan-50 text-cyan-700       → Véhicules
bg-violet-50 text-violet-700   → Hôtellerie
bg-amber-50 text-amber-700     → Équipements
```

---

### 7.6 Sidebar (Dashboard)

- Largeur : `260px` / réduite : `72px`
- Background : White / dark: `#0F172A`
- Bordure droite : `1px solid neutral-200`
- Padding : `16px`
- Logo EnyaRent : `64px` hauteur, bordure bottom `neutral-100`
- Label section nav : `micro` uppercase `neutral-400`
- Nav item :
  - Hauteur : `40px`
  - Padding : `10px 12px`
  - Radius : `radius`
  - Icône : `18px` `neutral-500`
  - Texte : `14px` poids 500 `neutral-700`
  - Gap icône ↔ texte : `12px`
  - Hover : `bg-neutral-100`
  - Active : `bg-primary-50`, `text-primary-700`, icône `primary-600`, barre accent gauche `2px primary-600`
- Groupes modules dans la nav : Immobilier / Véhicules / Hôtellerie / Équipements (section distincte par secteur)
- Section utilisateur en bas : avatar `36×36` + nom `14px` + rôle `12px neutral-500`
- **RTL** : barre accent passe à droite (`rtl:border-r-2 rtl:border-l-0`)

---

### 7.7 Top Bar / Page Header

- Hauteur : `64px`
- Background : White / dark: `#0F172A`
- Bordure bottom : `1px solid neutral-100`
- Padding : `0 32px`
- Gauche : breadcrumb ou titre page (`h1`)
- Droite : sélecteur langue (FR/AR/EN) + toggle dark mode + cloche notifications (badge count) + avatar utilisateur
- Sticky au scroll

---

### 7.8 Modales & Dialogs

- Overlay : `rgba(15, 23, 42, 0.5)` + `backdrop-blur-sm`
- Modale : max-width `512px` (défaut), `640px` (lg), `768px` (xl — formulaires complexes)
- Background : White / dark: `#1E293B`
- Radius : `radius-xl` (16px)
- Shadow : `shadow-xl`
- Header padding : `24px 24px 16px`
- Body padding : `16px 24px`
- Footer padding : `16px 24px 24px`, boutons alignés à droite avec `12px` gap
- Titre : `h3`
- Description : `body-sm` `neutral-500`
- Bouton fermer : icône X top-right `16px`
- Animation ouverture : scale(0.96) + opacity → scale(1) + opacity, `200ms` ease-out

---

### 7.9 Système de Tickets (GitHub-Style)

**Liste tickets :**
- Chaque ticket = ligne avec icône statut colorée + titre + labels + assigné avatar + date relative
- Séparateur entre Open/Closed avec count
- Hover ligne : `bg-neutral-50`
- Sidebar filtres : statut, labels, assigné, priorité (comme GitHub Issues)

**Détail ticket — 2 colonnes :**
- Colonne principale (75%) : titre `h2`, body markdown rendu, fil de commentaires
- Sidebar (25%) : statut, assigné, labels, priorité, secteur, dates, actions

**Commentaire :**
- Avatar `36×36` + nom + date relative
- Corps : markdown rendu, `body` `neutral-700`
- Pièces jointes : liste fichiers avec icône
- Réactions : row d'emoji petits (`14px`)
- Hover : boutons éditer/supprimer reveal

**Timeline activité :**
- Items plus petits, `caption neutral-500`
- Icône action (filled circle `8px`) + texte : "Marie a changé le statut en Résolu · il y a 2h"
- Couleur de l'icône = couleur du statut cible

**Label badge :**
- Fond coloré customisable (hex picker en settings)
- Texte blanc ou noir selon luminosité fond
- `radius-full`, padding `2px 8px`, `12px` font

---

### 7.10 Calendrier de Disponibilité

- Header : navigation mois avec chevrons `primary-600`
- Jours disponibles : `bg-white` avec hover `bg-primary-50`
- Jours réservés : `bg-primary-600` texte blanc (plage colorée)
- Jours bloqués : `bg-neutral-200` texte `neutral-400`, pattern diagonal subtil
- Jours maintenance : `bg-warning-50` texte `warning-600`
- Aujourd'hui : dot `primary-600` en dessous du numéro
- Weekend : texte légèrement `neutral-500` (pas rouge)
- Sélection range : fond `primary-100` entre les dates

---

### 7.11 Toasts / Notifications

Utiliser Sonner :
- Position : bottom-right
- Background : White / dark: `#1E293B`, `shadow-lg`, `border border-neutral-200`
- Radius : `radius` (8px)
- Padding : `14px 16px`
- Icône gauche : `18px`, couleur par type
- Titre : `14px` poids 500 `neutral-900`
- Description : `13px` `neutral-500`
- Auto-dismiss : `4s`
- Success : checkmark `success-600`
- Error : x-circle `error-600`
- Warning : triangle `warning-600`
- Info : info-circle `primary-600` (orange)

---

### 7.12 Empty States

- Centré verticalement dans le container
- Icône : `48px`, `neutral-300` dans un cercle `72×72` `neutral-100`
- Titre : `h3` `neutral-900`
- Description : `body` `neutral-500`, max-width `400px`, centré
- Bouton CTA primary en dessous, `32px` margin top

---

### 7.13 Formulaires

- Gap vertical entre champs : `20px`
- Label groupe de champs : `13px` poids 500 `neutral-700`
- Helper text : `12px` `neutral-500`, en dessous de l'input
- Séparateur de section : `border-t neutral-200`, `32px` margin top
- Header section : `h4` `neutral-900` + `body-sm neutral-500` description
- Footer formulaire : sticky bottom ou inline, Cancel (ghost) + Save (primary) alignés droite
- Wizard multi-étapes : stepper horizontal avec numéros + labels, étape active `primary-600`

**Validation (React Hook Form + Zod) :**
- Erreurs inline : `12px` poids 500 `error-600` en dessous du champ
- Bordure invalide : `error-600`
- Bouton submit disabled pendant `isSubmitting`, spinner dans le bouton

---

## 8. Iconographie

Utiliser **[Lucide Icons](https://lucide.dev)** (`lucide-react`) comme bibliothèque principale.

**Tailles :**
- Icônes nav sidebar : `18px`
- Inline avec texte body : `14px`
- Boutons icône : `18px`
- Feature cards : `20–24px`
- Empty states : `48px`
- Feature marketing : `28–40px`

**Couleurs :**
- Icônes neutres défaut : `neutral-500`
- Actif/sélectionné : `primary-600`
- Dans bouton CTA primary : `white`
- Feature highlights : `primary-600` sur fond `primary-50`

**Icônes par secteur :**
- Immobilier : `Building2` (indigo)
- Véhicules : `Car` (cyan)
- Hôtellerie : `Hotel` (violet)
- Équipements : `Wrench` (amber)
- Tickets : `CircleDot`
- Contrats : `FileText`
- Paiements : `CreditCard`
- Calendrier : `CalendarDays`
- Analytics : `BarChart3`
- Notifications : `Bell`

**Stroke width :** `2` (défaut). Ne pas mélanger les strokes.

---

## 9. Motion & Animation

**Principes :** rapide, subtil, jamais rebondissant.

| Transition | Durée | Easing |
|-----------|-------|--------|
| Press bouton | `100ms` | `ease-out` |
| Hover state | `150ms` | `ease-out` |
| Dropdown/popover | `150ms` | `ease-out` |
| Modale ouverture | `200ms` | `ease-out` |
| Modale fermeture | `150ms` | `ease-in` |
| Page transition | `300ms` | `ease-out` |
| Toast slide | `250ms` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Sidebar collapse | `200ms` | `ease-in-out` |

**À faire :**
- `transition-colors` sur tous les éléments interactifs
- Fade + scale pour modales
- Skeleton shimmer pour cards en chargement

**À ne pas faire :**
- Animations spring / bounce
- Rotations / flips
- Animations > 400ms
- Clignotement (sauf spinners loading)

---

## 10. Dark Mode

**Support complet.** ThemeProvider + next-themes. Toggle dans le header.

**Palette dark (Slate profond) :**
- Page background : `#0F172A` (slate-900)
- Card background : `#1E293B` (slate-800)
- Surface atténuée : `#334155` (slate-700)
- Bordures : `#334155`
- Texte principal : `#F8FAFC`
- Texte secondaire : `#94A3B8`

**Règles CSS dark mode :**
```css
.dark {
  --bg-page: #0F172A;
  --bg-card: #1E293B;
  --bg-surface: #334155;
  --border: #334155;
  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
}
```

La couleur `primary-600` (#EA580C) reste identique en dark mode — l'orange est suffisamment vibrant.

---

## 11. RTL (Arabe)

**Support obligatoire pour la langue arabe.**

- `<html dir="rtl">` quand langue = AR
- Utiliser les variantes Tailwind `rtl:` pour inverser marges, padding, flex, borders
- Sidebar : barre accent passe à droite en RTL
- Icônes directionnelles (flèches, chevrons) : mirrorées automatiquement via CSS `[dir="rtl"] .icon-dir { transform: scaleX(-1); }`
- Tables : colonnes inversées en RTL
- Inputs : texte aligné droite en RTL
- **Tester sur un vrai device ou navigateur en AR** — ne pas se fier au dev tools uniquement

---

## 12. Landing Page

- Hero background : `neutral-50` avec radial très subtil `primary-50 → transparent` centré
- Hero headline : `display` (48px, 700) `neutral-900`, max 2 lignes
- Hero subhead : `body-lg` (16px) `neutral-600`, max-width `640px`
- CTA cluster : bouton primary "Démarrer gratuitement" + ghost "Voir la démo", gap `24px`
- Section alternance : white → `neutral-50` → white, `96px` padding vertical
- Max content width : `1200px`
- Grille features secteurs : 4 colonnes desktop (1 par secteur), 2 colonnes tablet, 1 mobile, gap `32px`
- Chaque card secteur : icône colorée + titre + 3 features bullet + bouton "En savoir plus"
- Testimonials : cards `radius-xl`, bordure, `32px` padding, avatar + nom + poste + organisation
- Pricing : 3 plans (Starter / Pro / Enterprise), card Pro avec `2px solid primary-600` + gradient subtil

---

## 13. PDF Templates (Contrats, Factures, Quittances)

PDFs via `@react-pdf/renderer` avec son propre `StyleSheet`. Alignement visuel avec le dashboard mais adapté print.

**Palette PDF :**
- Texte principal : `#0F172A`
- Texte secondaire : `#475569`
- Muted : `#94A3B8`
- Bordures : `#E2E8F0`
- Accent brand : `#EA580C` (orange EnyaRent)

**Typographie PDF :**
- Titre contrat : 22px poids 700
- Sections : 13px poids 700 uppercase, `letterSpacing: 0.5`
- Body : 10px poids 400
- Tableaux : 10px, `tabular-nums`
- Montants totaux : 20px poids 700

**Mise en page PDF :**
- Padding page : `40px`
- Gap sections : `24px`
- Header : logo EnyaRent gauche + nom organisation + numéro document droite

**Templates :**
1. **Bail Résidentiel** — en-tête conforme DAhir 1994, parties (bailleur/locataire), description bien, durée, loyer, charges, caution, clauses légales marocaines
2. **Location Véhicule** — parties, description véhicule (immatriculation, km), durée, tarif, caution, état véhicule, responsabilité
3. **Location Équipement** — parties, description équipement, durée, tarif/unité, caution, état matériel, conditions retour
4. **Réservation Hôtelière** — parties, description chambre, dates check-in/out, tarif/nuit, options, conditions annulation

**Quittance de loyer :**
- Format simple, logo, mois concerné, montant lettres + chiffres, signature gestionnaire

**Facture :**
- Numérotation auto (EnyaRent-2025-0001), lignes article/quantité/PU/total, sous-total HT, TVA 20%, total TTC, mentions légales marocaines, IBAN organisation

---

## 14. Email Templates (React Email)

- Max width : `600px`
- Background : `#F1F5F9` (neutral-100)
- Card : white, `border: 1px solid #E2E8F0`, `radius: 12px`
- Header : bande `primary-600` (#EA580C), logo EnyaRent blanc, nom organisation
- Body padding : `24px`
- Typographie : system font stack — `-apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif`
- Boutons : `primary-600`, texte blanc, `12px 24px` padding, `radius: 8px`, `14px`, poids 500
- Footer : `caption neutral-500`, centré, mentions légales, lien désabonnement
- **Devise** : toujours utiliser `data.currency` (MAD, EUR, USD) — ne jamais hardcoder

**Templates emails :**
1. **Bienvenue** — confirmation compte, bouton accès dashboard
2. **Nouvelle réservation** — détails asset, dates, montant, bouton voir réservation
3. **Contrat à signer** — lien YouSign, deadline signature, récapitulatif
4. **Contrat signé** — confirmation, PDF joint, bouton portail client
5. **Rappel loyer** — montant dû, date échéance, bouton payer en ligne
6. **Relance impayé J+3/J+7/J+15** — montant, jours retard, bouton payer, contact agence
7. **Paiement reçu** — montant, quittance en pièce jointe, période couverte
8. **Nouveau ticket** — titre, priorité, bouton voir ticket
9. **Nouveau commentaire ticket** — extrait commentaire, bouton répondre
10. **Ticket résolu** — message résolution, bouton fermer ou rouvrir
11. **Mention @vous** — context, bouton voir ticket

---

## 15. Tailwind Configuration

```ts
// tailwind.config.ts
theme: {
  extend: {
    fontFamily: {
      sans: ["var(--font-inter)", "system-ui", "sans-serif"],
    },
    colors: {
      primary: {
        50: "#FFF7ED",
        100: "#FFEDD5",
        400: "#FB923C",
        500: "#F97316",
        600: "#EA580C",
        700: "#C2410C",
        900: "#7C2D12",
      },
    },
    boxShadow: {
      xs: "0 1px 2px 0 rgba(15, 23, 42, 0.05)",
      focus: "0 0 0 3px rgba(234, 88, 12, 0.20)",
    },
    borderRadius: {
      DEFAULT: "0.5rem", // 8px
    },
  },
}
```

Pour les neutrals, utiliser l'échelle `slate` de Tailwind (`text-slate-700`, `bg-slate-50`) — correspond exactement à la palette définie.

---

## 16. Accessibilité

- Touch target minimum : `40×40px` desktop, `44×44px` mobile
- Contraste couleur : `4.5:1` texte body, `3:1` texte large et composants UI
- Focus rings : visibles sur tous les éléments interactifs (`shadow-focus` orange), jamais supprimés
- Icônes seules : `aria-label` ou texte `sr-only`
- Champs de formulaire : toujours un `<label>` lié via `htmlFor`
- Badges statut : ne pas se fier uniquement à la couleur — inclure texte + dot
- HTML sémantique : `<button>` pour actions, `<a>` pour navigation
- RTL : tester la navigation clavier en mode AR (tab order cohérent)
- Tickets et commentaires : markdown rendu accessible avec structure heading correcte

---

## 17. Do's & Don'ts

**À faire :**
- Utiliser `tabular-nums` pour tous les montants (MAD, EUR, USD), numéros de contrats, dates
- Utiliser l'échelle slate pour les neutres, orange brand pour les actions
- Utiliser bordures + shadows subtiles pour la hiérarchie
- Garder un whitespace généreux
- Icônes Lucide uniquement, tailles standardisées
- Badges secteurs colorés pour différencier Immobilier/Véhicules/Hôtellerie/Équipements
- Tester chaque composant en FR, AR (RTL), EN
- Tester chaque composant en dark mode

**À ne pas faire :**
- Emoji dans le chrome UI applicatif
- Shadows plus lourdes que `shadow-md` in-app
- Gradients hors hero marketing / card plan Pro
- Mélanger les border-radius dans un container
- Couleurs vives hors tokens sémantiques
- Hardcoder "MAD", "€" ou "$" — toujours référencer `data.currency`
- Poids de font > 600 dans le chrome app (700 réservé aux montants totaux PDF et marketing display)
- CSS custom si une utility class Tailwind existe
- Oublier le support RTL sur tout nouveau composant
