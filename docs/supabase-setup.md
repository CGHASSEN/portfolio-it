# Configuration Supabase de l’administration

L’administration `/admin` utilise Supabase Auth, la table `projects` et un bucket Storage privé. Sans configuration, le site reste utilisable avec ses fiches de démonstration, et l’administration indique qu’elle n’est pas activée.

## Mise en service

1. Créez un projet Supabase et exécutez le SQL de `supabase/migrations/20261014000000_portfolio_projects.sql` dans son éditeur SQL.
2. Activez le fournisseur d’authentification par e-mail et mot de passe. Créez/invitez votre compte administrateur depuis le tableau de bord Supabase ; aucun formulaire d’inscription public n’est proposé.
3. Après création du compte, récupérez son UUID dans **Authentication → Users**. Avec l’éditeur SQL du tableau de bord, autorisé à effectuer cette opération privilégiée, exécutez `insert into public.admin_users (user_id) values ('UUID_DU_COMPTE');`.
4. Copiez `.env.example` vers `.env.local`, puis renseignez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` avec l’URL du projet et sa clé publishable/anon. Ces valeurs sont publiques par conception ; n’ajoutez jamais la clé `service_role` ni un mot de passe dans le frontend.
5. Redémarrez Vite après avoir modifié les variables. En production, configurez les mêmes variables dans l’hébergeur et une règle de réécriture vers `index.html` pour que la route `/admin` soit servie par l’application.

Les politiques RLS autorisent les visiteurs à lire uniquement les projets publiés et leurs images signées dans le bucket privé. Seuls les UUID présents dans `admin_users` peuvent lire les brouillons, écrire ou supprimer les projets et gérer les images. Un utilisateur authentifié ordinaire ne devient pas administrateur par le seul fait de connaître `/admin`.

Les URL d’images signées par le site expirent après une heure ; la page les recrée lors d’un nouveau chargement. La clé publishable/anon ne contourne aucune politique RLS.
