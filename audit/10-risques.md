# 10 — Risques

## 1. Risques de sécurité (immédiats)

| Risque | Preuve | Impact si non traité |
|---|---|---|
| Fraude paiement via webhook DGateway non signé | `03-securite-authz.md` §2.7 | N'importe qui peut simuler un paiement complété, débloquer une réservation et générer une fausse facture |
| Fuite de données support inter-tenant | `03-securite-authz.md` §2.5 | Un client d'une organisation peut lire/écrire dans les tickets support d'une autre organisation — risque contractuel et réputationnel direct si découvert par un client |
| Élévation de privilège sur la création d'organisation | `03-securite-authz.md` §2.2 | Un utilisateur peut se détacher de son organisation actuelle et devenir admin d'une organisation nouvelle sans contrôle |
| IDOR conditionnel (check-in, états des lieux, échéancier, tickets) pour utilisateurs sans organisation | `03-securite-authz.md` §2.1 | Surface d'attaque activable simplement en ayant un compte authentifié sans organisation rattachée — état atteignable par le flux normal (ex. un `CLIENT` fraîchement inscrit) |

## 2. Risque produit — le parcours n'a probablement jamais été validé de bout en bout

Constaté (`04-workflows.md`) : au moins 5 ruptures concrètes empêchent un parcours complet
inscription → encaissement → restitution caution de fonctionner sans intervention manuelle sur le
code (check-in hôtelier 404, échéancier immobilier 404, signature bloquée par variable
d'environnement vide, page facture manquante, restitution de caution sans chemin d'exécution). La
coexistence de deux implémentations concurrentes pour les états des lieux (`04-workflows.md` §2.8)
et de fichiers dupliqués par faute de frappe (`chekin`/`checkin`, `schuedule`/`schedule`,
`payements`/`payments`, `route.ts`/`rout.ts`) suggère fortement que ces fonctionnalités ont été
écrites sans être testées manuellement dans le navigateur après écriture — **hypothèse à
vérifier** auprès de l'équipe, mais cohérente avec le nombre et la nature des ruptures trouvées
(des erreurs qu'un simple clic aurait révélées).

## 3. Risque d'absence de filet de régression

Aucun test automatisé n'existe (`06-gap-analysis.md`, ligne Tests). Toute correction des points
P0 listés dans `11-backlog-p0.md` — y compris les corrections de sécurité les plus urgentes — sera
appliquée sans garantie de non-régression, dans un contexte où le taux de bugs déjà constaté
(fautes de frappe de chemin, fichiers dupliqués, logique dupliquée) est élevé.

## 4. Risque de dette de modélisation qui se propage

`User.role` non typé (`String` au lieu de l'enum `Role`, `02-database.md` §1.2) et la confusion
`Role.PROFESSIONAL`/`OrganizationType.PROFESSIONAL` (`02-database.md` §1.1) sont des risques qui
grandissent avec chaque nouvelle route ajoutée sans passer par `guard()` — actuellement 2 routes
sur ~45 l'utilisent (`03-securite-authz.md`). Plus le produit grossit sans généraliser ce
mécanisme, plus le coût de rattrapage augmente (chaque nouvelle route ad-hoc est un nouveau risque
d'IDOR ou de contrôle de rôle manquant, comme démontré par les findings P0/P1 déjà trouvés).

## 5. Risque de confusion stratégique sectorielle (voir aussi §6 du brief)

Le secteur véhicule est structurellement le plus mature (champs dédiés typés, vue `fleet`, calcul
kilométrique fonctionnel, `sectorLogic.ts` majoritairement orienté véhicule dans ses fonctions
réellement appelées). Les 3 autres secteurs ont une logique métier écrite (`generateMonthlySchedule`,
`calcRentRevision`, `calcHotelTotal`, `calcDepositResolution`, `compareInspectionStates`) mais en
grande partie orpheline ou bloquée par les ruptures de route (§4.2 ci-dessus). **Risque** : si la
décision stratégique de se concentrer sur le véhicule est prise implicitement (par accumulation de
priorités) plutôt qu'explicitement, le code des 3 autres secteurs restera une dette permanente
(maintenance de modèles et de logique jamais réellement utilisés) sans que cela résulte d'un choix
assumé.

## 6. Risque de stockage fichier non durable

`uploadToR2` est un stub qui renvoie une URL `data:` base64 au lieu d'un vrai upload
(`04-workflows.md` L21) — les PDF de contrats générés ne sont donc pas stockés durablement en
dehors de la réponse HTTP immédiate. Les photos d'assets sont sur le filesystem local du serveur
(`public/uploads/`), ce qui ne survivra pas à un déploiement sans volume persistant ou à une
architecture multi-instance.
