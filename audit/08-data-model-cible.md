# 08 — Modèle de données cible

## 1. Modèles à ajouter (proposition — non appliquée)

Pour couvrir le cycle cible `ACQUISITION → LEAD → CRM → QUALIFICATION → QUOTE → CONVERSION →
BOOKING`, aucun des modèles suivants n'existe aujourd'hui (`schema.prisma`, 509 lignes, lu
intégralement — confirmé absent) :

- `Lead` (source, statut de qualification, `organizationId`, lien optionnel vers `Customer` une
  fois converti)
- `Interaction` (historique de contacts — appel, email, visite — lié à `Lead` ou `Customer`)
- `Quote` (devis pré-réservation, lien vers `Asset`, montant, validité, statut, conversion en
  `Booking`)
- `Campaign` (marketing, hors scope immédiat par principe directeur §8 du brief — IA/marketplace
  après l'OS)
- `PricingRule` (règles de tarification dynamique/saisonnière, référencée par `Asset` ou
  `AssetType`)
- `Partner` (hors scope immédiat, vient après l'OS)

Chacun de ces modèles devrait porter `organizationId String` (obligatoire, non nullable) et
`@@index([organizationId])`, contrairement au constat fait sur les modèles Phase 2 existants
(`02-database.md` §4, aucun index composite présent).

## 2. Modèles existants à faire évoluer (à valider)

| Modèle | Évolution proposée | Justification |
|---|---|---|
| `User.role` | `String` → typer avec l'enum `Role` | `02-database.md` §1.2 — aucune contrainte actuelle |
| `Role` (enum) | Clarifier `PROFESSIONAL` : soit le fusionner avec `ADMIN` au moment de l'inscription (le flux actuel crée déjà une org de type `PROFESSIONAL` — le rôle utilisateur pourrait directement devenir `ADMIN`), soit lui donner une définition de permissions propre et documentée | `02-database.md` §1.1 — actuellement un patch de fait dans `authz.ts`, pas une décision de modélisation |
| `Asset.metadata` (Json) | Extraire vers des champs typés ou un schéma Zod partagé versionné, au moins pour les champs déjà lus en dur (`insuranceExpiry`, `vignetteExpiry`) | `02-database.md` §3 — incohérence entre champs véhicule typés en colonnes et champs sectoriels en Json non typé |
| `Payment.method` | Ajouter un enum (CMI, mobile money, virement, espèces, chèque) | actuellement `String?` libre |
| `Booking`/`Payment`/`Invoice`/`Contract` | Ajouter `@@index([organizationId, status])` ou équivalent selon les filtres réels des dashboards | aucun index composite constaté |
| `MaintenanceTicket` | Ajouter un champ de planification préventive (date d'échéance, périodicité) si la vision Fleet Management (TCO, maintenance préventive) est retenue pour le secteur véhicule | modèle actuellement quasi inexploité (`06-gap-analysis.md`) |

## 3. Stratégie de migration progressive (proposition, à valider)

1. **Ne rien migrer avant d'avoir corrigé les P0 de `11-backlog-p0.md`** — en particulier les
   patterns `organizationId: orgId ?? undefined` (`03-securite-authz.md` §2.1), qui sont des bugs
   de code, pas des lacunes de modèle : une migration de schéma ne les corrige pas.
2. **Typage du rôle (`User.role` → `Role`)** : migration à faire en deux temps — d'abord un script
   de normalisation des valeurs existantes en base (vérifier qu'aucune valeur hors enum n'est
   présente), puis le changement de type Prisma. Impact sur `authz.ts:5-7` (`ROLES` dupliqué
   manuellement) à supprimer au profit d'une source unique.
3. **Ajout des modèles CRM (`Lead`, `Quote`, `Interaction`)** : additifs purs, aucune migration de
   données existantes nécessaire — peuvent être ajoutés sans rupture dès que le domaine
   applicatif correspondant est développé (voir `09-roadmap.md`).
4. **Indexation** : additive, sans risque de rupture, à faire dès que possible indépendamment du
   reste (gain de performance, aucun changement de comportement applicatif).

Aucune estimation de charge n'est donnée ici — « à estimer » pour chaque point, faute de
vélocité d'équipe connue.
