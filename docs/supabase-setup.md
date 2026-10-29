# Configuration Supabase de l’administration

L’administration `/admin` utilise Supabase Auth, la table `projects` et un bucket Storage privé. Sans configuration, le site reste utilisable avec ses fiches de démonstration, et l’administration indique qu’elle n’est pas activée.

## Mise en service

1. Créez un projet Supabase et exécutez les migrations de `supabase/migrations` dans l’ordre chronologique. Pour un projet Supabase déjà configuré, exécutez les migrations non appliquées dans l’ordre : `20261018000000_project_door_assignments.sql` ajoute l’affectation aux portes, puis `20261018110100_seed_static_portfolio_projects.sql` rend les trois fiches statiques administrables.
2. Activez le fournisseur d’authentification par e-mail et mot de passe. Créez/invitez votre compte administrateur depuis le tableau de bord Supabase ; aucun formulaire d’inscription public n’est proposé.
3. Après création du compte, récupérez son UUID dans **Authentication → Users**. Avec l’éditeur SQL du tableau de bord, autorisé à effectuer cette opération privilégiée, exécutez `insert into public.admin_users (user_id) values ('UUID_DU_COMPTE');`.
4. Copiez `.env.example` vers `.env.local`, puis renseignez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` avec l’URL du projet et sa clé publishable/anon. Ces valeurs sont publiques par conception ; n’ajoutez jamais la clé `service_role` ni un mot de passe dans le frontend.
5. Redémarrez Vite après avoir modifié les variables. En production, configurez les mêmes variables dans l’hébergeur et une règle de réécriture vers `index.html` pour que la route `/admin` soit servie par l’application.

Les politiques RLS autorisent les visiteurs à lire uniquement les projets publiés et leurs médias signés dans le bucket privé. Seuls les UUID présents dans `admin_users` peuvent lire les brouillons, écrire ou supprimer les projets et gérer les médias. Un utilisateur authentifié ordinaire ne devient pas administrateur par le seul fait de connaître `/admin`.

Les couvertures peuvent être des images JPEG, PNG ou WebP, ou des vidéos MP4 de 49 MB maximum ; les captures d’écran restent des images JPEG, PNG ou WebP avec la même limite applicative. La migration initiale configure le bucket avec une limite de fichier de 10 Mio et une liste MIME réservée aux images. Avant d’envoyer des fichiers plus grands ou des vidéos, vérifiez la configuration réelle du bucket dans **Storage → Buckets → portfolio-projects** : la limite de fichier doit être d’au moins 49 000 000 octets, sans dépasser la limite globale Supabase de 50 MB, et les types autorisés doivent inclure `image/jpeg`, `image/png`, `image/webp` et `video/mp4`. La validation de l’application ne change pas la configuration du bucket.

La migration d’affectation ajoute `projects.door_ids`, un tableau des identifiants de salles existants. Les projets déjà enregistrés reçoivent une liste vide : aucune affectation n’est devinée, et aucun projet n’est supprimé. Les règles RLS existantes de `projects` continuent à contrôler la lecture et la modification de cette colonne. Après application de la migration, affectez les projets depuis `/admin` ; seuls les projets publiés affectés à une porte apparaissent dans cette porte.

La migration `20261018110100_seed_static_portfolio_projects.sql` vérifie chaque titre avant insertion. Elle crée uniquement les fiches statiques absentes, comme brouillons, sans URL, et ne remplace pas les lignes existantes. Tant qu’une fiche n’est pas publiée dans Supabase, le portfolio conserve sa version statique. Après publication, la fiche Supabase la remplace au même emplacement plutôt que de s’afficher en double. Les portes restent sans affectation par défaut jusqu’à leur sélection dans l’administration.

Les URL de médias signées par le site expirent après une heure. Le catalogue les renouvelle périodiquement et au retour sur l’onglet ; l’aperçu d’administration suit la même règle. La clé publishable/anon ne contourne aucune politique RLS.
