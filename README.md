# community-cms

> **Décommissionné** (novembre 2026). Ce service n'est plus construit ni
> déployé (retiré de `docker-compose.yml` dans `eagaseke`) :
> - Le studio d'édition (`/cms-admin`) a été migré vers `community-backoffice`
>   (`/admin/cms`) — code réel, plus d'iframe.
> - Les pages publiques (accueil, blog, marketing, légal) ont été migrées
>   vers `community-portal`, qui lit le contenu publié via
>   `GET /api/cms/published` (eagaseke).
>
> Le code reste ici pour référence/rollback, mais ne tourne plus en
> production. Voir `src/components/site-chrome.tsx`,
> `src/lib/site-store.ts` et `src/builder/` pour l'origine du code
> porté dans les deux autres apps.
