# 00 — Synthèse

*Audit technique et produit EnyaRent — lecture seule, aucune modification de code. Chaque
affirmation de ce document est détaillée et sourcée (fichier:ligne) dans les rapports 01 à 11 du
dossier `audit/`.*

---

## 1. Le parcours minimal fonctionne-t-il de bout en bout aujourd'hui ?

**Non, pas sans intervention.** La bonne nouvelle : le squelette existe et, pour l'essentiel, il
est bien écrit — inscription, création d'organisation, création d'asset, création de client,
réservation, génération de contrat PDF (4 templates sectoriels réels) fonctionnent tels quels. Le
parcours casse ensuite à plusieurs endroits précis et corrigibles, pas structurels :

- **Signature électronique** : bloquée par une clé API YouSign vide en environnement (`.env`,
  `.env.local`) — 500 garanti à l'étape « envoyer en signature ».
- **Paiement** : le webhook qui confirme un paiement DGateway (le seul réellement exécuté par
  Next.js) ne vérifie **aucune signature** — n'importe qui peut simuler un paiement réussi. La
  version sécurisée existe mais est restée dans un fichier nommé par erreur `rout.ts` au lieu de
  `route.ts`, donc jamais chargée.
- **Facture** : générée correctement en base et visible côté client, mais **aucune page de gestion
  ne côté organisation** — le lien du menu pointe vers une page qui n'existe pas.
- **États des lieux / restitution de caution** : le calcul de remboursement de caution est
  correct, mais **rien dans l'interface ne permet de l'exécuter** comme un vrai paiement — la
  fonctionnalité est écrite mais inatteignable.
- **Check-in hôtelier** et **échéancier immobilier (révision de loyer)** : cassés par de simples
  fautes de frappe dans un nom de dossier de route API (`chekin` au lieu de `checkin`, `schuedule`
  au lieu de `schedule`) — 404 garanti à chaque tentative.

Le motif commun de ces ruptures — fautes de frappe de chemin, fichiers dupliqués jamais
raccordés, fonctionnalités écrites puis jamais reliées à un bouton — suggère fortement qu'aucun de
ces parcours n'a été testé à la souris dans un navigateur après avoir été codé.

## 2. Points bloquants absolus (P0) avant toute démonstration client

La liste complète et sourcée (21 items) est dans `11-backlog-p0.md`. Les plus critiques :

- **Faille de sécurité inter-tenant sur les tickets support** : un utilisateur d'une organisation
  peut lire et écrire dans les tickets support d'une autre organisation.
- **Webhook de paiement non authentifié** : risque de fraude directe (paiements et factures
  falsifiables).
- **Élévation de privilège** : un utilisateur peut créer une nouvelle organisation et en devenir
  administrateur sans contrôle, y compris en abandonnant son organisation actuelle.
- **Les 5 ruptures fonctionnelles listées au point 1.**
- **Zéro test automatisé** dans tout le dépôt — toute correction se fait sans filet.

Chacun de ces points est chirurgical (renommage de dossier, ajout d'un filtre, câblage d'un
composant existant) — **aucun ne nécessite de refonte**.

## 3. Proportion de la vision cible déjà couverte

Le produit actuel (« Rental SaaS ») couvre correctement le cycle
`Asset → Client → Réservation → Prix → Revenu`, avec des lacunes ponctuelles plutôt que
structurelles (détail : `06-gap-analysis.md`). La trajectoire cible ajoute un cycle amont complet
— `Acquisition → Lead → CRM → Qualification → Devis → Conversion` — qui **n'existe pas du tout** :
aucun modèle `Lead`, `Quote`, `Interaction`, `Campaign`, `Partner` dans le schéma de données. Les
modules de différenciation de la vision « Mobility OS » (gestion de flotte avec TCO/dépréciation,
maintenance préventive, revenue management avec saisonnalité) sont également à l'état 0, y compris
pour le secteur véhicule — pourtant le plus mature du produit actuel sur tous les autres critères.

En ordre de grandeur qualitatif : le produit actuel couvre la moitié aval du cycle économique
cible (`Booking → ... → Revenue`) avec une qualité inégale (voir gap analysis), et n'a rien sur la
moitié amont (`Acquisition → ... → Conversion`). Aucune proportion chiffrée n'est avancée ici —
elle serait arbitraire sans référentiel de charge.

## 4. Chemin le plus court vers un produit démontrable

1. **Corriger le backlog P0** (`11-backlog-p0.md`) — essentiellement des corrections ciblées, pas
   de nouvelle fonctionnalité. C'est la condition strictement nécessaire pour qu'une démonstration
   ne s'interrompe pas sur un 404 ou un 500.
2. **Trancher explicitement la question sectorielle** (`06-gap-analysis.md`, section « Question
   sectorielle ») : le secteur véhicule est déjà le plus abouti dans le code existant — une
   démonstration concentrée sur ce secteur est atteignable plus vite qu'une démonstration
   multi-secteurs, sans que cela ferme la porte à la généralisation ultérieure.
3. **Ne pas commencer le CRM/Leads avant d'avoir généralisé le contrôle d'accès** (`guard()`
   n'est utilisé que sur 2 routes sur ~45) — sans quoi chaque nouveau domaine ajouté hérite du même
   risque d'IDOR déjà démontré trois fois dans ce produit.

---

*Rapports détaillés : `01-architecture.md` · `02-database.md` · `03-securite-authz.md` ·
`04-workflows.md` · `05-ux.md` · `06-gap-analysis.md` · `07-architecture-cible.md` ·
`08-data-model-cible.md` · `09-roadmap.md` · `10-risques.md` · `11-backlog-p0.md`.*
