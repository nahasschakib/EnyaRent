# 09 — Roadmap

Séquencement par dépendance logique, pas par durée (aucune durée n'est estimée — voir note
méthodologique de `06-gap-analysis.md`). Chaque phase liste : objectif, périmètre, dépendances,
livrables, critère de sortie mesurable.

---

## Phase 0 — Stabilisation sécurité et chaîne fonctionnelle

**Objectif** : rendre le parcours minimal (inscription → asset → réservation → contrat → signature
→ encaissement) exécutable de bout en bout sans 404 ni faille d'isolation tenant connue.

**Périmètre** : les 21 items de `11-backlog-p0.md`, sans extension de fonctionnalité.

**Dépendances** : aucune — tout le périmètre est déjà écrit, il s'agit de corrections ciblées
(renommage de dossier, ajout de filtre `organizationId`, câblage d'un composant existant).

**Livrables** :
- Webhook DGateway sécurisé (signature vérifiée sur le fichier réellement exécuté).
- Routes `chekin`/`schuedule` renommées et alignées avec le frontend.
- IDOR tickets corrigé.
- Pages `/dashboard/invoices` et `/dashboard/payments` : créées ou liens retirés.
- Chemin de restitution de caution exécutable de bout en bout.
- `YOUSIGN_API_KEY` valorisée en environnement de démonstration.

**Critère de sortie mesurable** : un parcours manuel complet — inscription PROFESSIONAL → création
d'un asset par secteur → réservation → génération de contrat → envoi en signature → paiement →
génération de facture → état des lieux EXIT → restitution de caution — s'exécute sans erreur 404,
sans 500 imputable à une variable d'environnement manquante, et sans qu'un utilisateur d'une
organisation puisse accéder aux données d'une autre organisation testée en parallèle.

---

## Phase 1 — Généralisation du contrôle d'accès et filet de tests

**Objectif** : éliminer la classe de bug qui a produit les IDOR de la Phase 0 plutôt que de
corriger uniquement les instances déjà trouvées.

**Périmètre** :
- Généraliser `guard()` (`src/lib/authz.ts`) à toutes les routes API (actuellement 2 sur ~45).
- Typer `User.role` avec l'enum `Role` (migration en deux temps, `08-data-model-cible.md` §3).
- Ajouter au minimum des tests d'intégration sur l'isolation tenant (une requête d'un utilisateur
  de l'organisation A ne doit jamais retourner de données de l'organisation B) — le risque
  démontré en Phase 0 justifie que ce soit le premier type de test écrit, avant toute couverture
  fonctionnelle générale.
- Ajouter `AuditLog` sur les 14 routes de mutation qui n'en écrivent pas actuellement.

**Dépendances** : Phase 0 terminée (corriger des routes qui seront immédiatement re-testées).

**Critère de sortie mesurable** : 100% des routes de mutation utilisent `guard()` ou un mécanisme
équivalent centralisé et testé ; une suite de tests d'isolation tenant existe et passe en CI (à
mettre en place si absente — non vérifié dans cette mission si un pipeline CI existe).

---

## Phase 2 — Décision sectorielle explicite

**Objectif** : trancher la question sectorielle (§6 du brief, voir aussi `10-risques.md` §5) —
généraliser les modules avancés (Fleet/TCO, maintenance préventive, revenue management) aux 4
secteurs, ou concentrer l'effort sur le véhicule, secteur déjà le plus mature dans le code
existant.

**Périmètre** : décision produit, pas de code. Livrable : document de décision qui indexe les
constats déjà faits (`06-gap-analysis.md`, section « Question sectorielle »).

**Dépendances** : aucune technique, mais devrait précéder toute Phase 3+ pour éviter d'investir
dans des modules sectoriels qui seraient ensuite abandonnés.

**Critère de sortie mesurable** : une décision documentée et datée, actée par le décideur produit.

---

## Phase 3 — Fondations Rental Business OS (CRM minimal)

**Objectif** : combler l'écart le plus structurant vers la vision cible — le cycle actuel
s'arrête à `Booking`, la vision cible commence à `Lead`.

**Périmètre** : modèles `Lead`, `Interaction`, `Quote` (`08-data-model-cible.md` §1), routes CRUD
de base, conversion Lead → Customer → Booking.

**Dépendances** : Phase 1 (le nouveau domaine doit naître avec `guard()` généralisé et des tests
d'isolation, pas hériter de la dette constatée) ; Phase 2 si la décision sectorielle affecte le
modèle de `Lead`/`Quote` (ex. champs spécifiques véhicule vs générique).

**Critère de sortie mesurable** : un lead peut être créé, qualifié, transformé en devis, puis en
réservation, sans passer par la création manuelle d'un `Customer` en amont.

---

## Phases suivantes (non détaillées, hors périmètre immédiat)

Pricing dynamique / Revenue Management, Marketing, Partners, Marketplace, IA — toutes
explicitement postérieures à la consolidation des données et de l'OS selon le principe directeur
du brief (§8) — « pas de marketplace avant l'OS, pas d'IA avant les données ». Aucun séquençage
détaillé n'est proposé ici tant que les Phases 0-3 ne sont pas closes, pour éviter une
planification spéculative sur une base instable.
