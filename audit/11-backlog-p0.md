# 11 — Backlog P0

Actions bloquant l'usage réel du produit ou toute démonstration client. Chaque item cite son
fichier:ligne exact. **Rien n'a été corrigé** — cette liste est une proposition d'action à valider
explicitement avant toute intervention, conformément au cadre de mission (lecture seule).

## Sécurité (source : `03-securite-authz.md`)

1. **IDOR commentaires de tickets** — `src/app/api/v1/tickets/[id]/comments/route.ts:27-40` (GET),
   `:52-60` (POST). Ajouter un filtre `organizationId` (via jointure `SupportTicket.organizationId`)
   avant toute lecture/écriture.
2. **Webhook DGateway sans vérification de signature** — `src/app/api/webhooks/dgateway/route.ts:4-25`.
   `validateWebhookSignature` existe déjà (`src/lib/payment/dgateway.ts:204-219`) et une
   implémentation complète existe dans le fichier mort `src/app/api/webhooks/dgateway/rout.ts` —
   la correction consiste à porter cette logique dans le fichier réellement nommé `route.ts`.
3. **Pattern `organizationId: orgId ?? undefined`** — 4 fichiers, 8 occurrences :
   `bookings/[id]/chekin/route.ts:58-61,162-165`, `bookings/[id]/inspection/route.ts:46-49,110-113`,
   `bookings/[id]/schuedule/route.ts:24-27,102-105`, `tickets/[id]/route.ts:29-32,80-83`. Remplacer
   par une vérification explicite post-fetch (pattern déjà correct présent dans
   `bookings/[id]/return-km/route.ts:42-44`) qui rejette même si `orgId` est `null`.
4. **Rattachement tenant arbitraire pour ticket client sans organisation** —
   `src/app/api/v1/portal/tickets/route.ts:60-62`. Remplacer le `findFirst()` sans filtre par un
   rejet explicite (400) si le client n'a pas d'organisation résolue.
5. **`folder` non validé dans l'upload d'image** — `src/app/api/v1/upload/image/route.ts:16,29,33`.
   Whitelister les valeurs acceptées ou dériver le dossier côté serveur plutôt que depuis l'input
   client.
6. **`DGATEWAY_WEBHOOK_SECRET` absente de tout `.env*`** — à générer et déclarer, condition
   préalable à l'item 2.

## Chaîne fonctionnelle cassée (source : `04-workflows.md`)

7. **Check-in hôtelier — 404 garanti** — frontend appelle `/api/v1/bookings/{id}/checkin`
   (`src/components/bookings/HotelCheckinForm.tsx:45`), la route réelle est
   `src/app/api/v1/bookings/[id]/chekin/route.ts` (dossier fauté). Renommer le dossier `chekin` →
   `checkin` (ou aligner le frontend sur `chekin` si préféré, mais le commentaire d'en-tête du
   fichier route lui-même vise `checkin`).
8. **Échéancier/révision de loyer immobilier — 404 garanti** — frontend appelle
   `/api/v1/bookings/{id}/schedule` (`dashboard/bookings/[id]/schedule/page.tsx:58,66`), la route
   réelle est `src/app/api/v1/bookings/[id]/schuedule/route.ts`. Même correction que l'item 7.
9. **Page `/dashboard/invoices` liée mais inexistante** — lien dans
   `src/components/dashboard/sidebar.tsx:65`, aucun fichier `dashboard/invoices/page.tsx`. Créer
   la page ou retirer le lien tant qu'elle n'existe pas.
10. **Page `/dashboard/payments` liée mais inexistante** — lien dans `sidebar.tsx:64` et bannière
    impayés `dashboard/page.tsx:118`. Même remède que l'item 9.
11. **Restitution de caution inexploitable** — le calcul existe
    (`bookings/[id]/inspection/route.ts:167-191`) mais aucun chemin UI ne permet de créer le
    `Payment` `DEPOSIT_REFUND` correspondant : `ManualPaymentForm.tsx` (lignes 70-73) n'offre pas
    ce type dans son sélecteur, et le composant lui-même n'est monté dans aucune page (confirmé
    par recherche exhaustive). Monter le composant + ajouter l'option, ou bâtir un chemin dédié.
12. **`YOUSIGN_API_KEY` vide** — `.env:28`, `.env.local:18`. Bloque `send-signature` (500
    garanti, `send-signature/route.ts:53,69,151`). Nécessite une clé YouSign valide en
    environnement de démonstration.
13. **Deux implémentations concurrentes de création d'état des lieux** —
    `api/v1/inspections/route.ts` vs `api/v1/bookings/[id]/inspection/route.ts` — permettent de
    contourner la validation de la route « riche ». Unifier sur une seule route avant toute
    démonstration du cycle équipement complet.

## Contrôle d'accès insuffisant (source : `03-securite-authz.md`, non listé en P0 sécurité ci-dessus
car pas des fuites de données mais des dépassements de privilège)

14. **`DELETE /api/v1/assets/[id]`** (`assets/[id]/route.ts:118-133`) — aucun contrôle de rôle,
    un `MANAGER` peut supprimer alors que `PERMISSIONS["asset:delete"]` (`authz.ts:15`) l'exclut.
15. **`POST /api/v1/organizations`** (`organizations/route.ts:8-40`) — aucune vérification que
    l'utilisateur n'appartient pas déjà à une organisation ; un membre existant peut créer un
    second tenant et écraser son propre rôle/organisation.
16. **`PATCH /api/v1/organizations/settings`** (`organizations/settings/route.ts:43-66`) — aucun
    contrôle de rôle malgré une policy `org:settings` définie (`authz.ts:22`).

## Fiabilité / traçabilité

17. **Zéro test automatisé** — aucun fichier `*.test.ts`/`*.spec.ts`, aucune config Vitest/Jest/
    Playwright dans le dépôt (recherche exhaustive). Toute correction des points ci-dessus se fait
    actuellement sans filet de régression.
18. **14 routes de mutation sur 32 n'écrivent jamais dans `AuditLog`** — dont la création
    d'organisation, la modification des paramètres d'organisation, les demandes de réservation
    publiques, et les deux webhooks de paiement/signature (constaté par grep croisé
    `.create(\|.update(\|.delete(` vs `auditLog.create` sur `src/app/api`). Non listé comme faille
    de sécurité au sens strict, mais contraire à la règle CLAUDE.md « Logger dans AuditLog
    (mutations uniquement) » et gênant pour toute investigation a posteriori.

## Fichiers morts à nettoyer ou réactiver (décision produit requise)

19. `src/proxy.ts` (jamais exécuté par Next.js).
20. `src/app/api/webhooks/dgateway/rout.ts` (contient la bonne implémentation — à fusionner dans
    `route.ts`, pas à supprimer sans récupérer sa logique, voir item 2).
21. `src/app/api/v1/payements/intent/route.ts` (doublon fauté de `payments/intent`, non appelé par
    le frontend — confirmé par grep).
