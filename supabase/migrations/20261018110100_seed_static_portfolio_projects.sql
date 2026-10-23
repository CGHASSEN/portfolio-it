insert into public.projects (
  sort_order,
  title,
  description,
  objective,
  technologies,
  steps,
  results,
  category,
  status
)
select
  seeded.sort_order,
  seeded.title,
  seeded.description,
  seeded.objective,
  seeded.technologies,
  '{}'::text[],
  seeded.results,
  seeded.category,
  'draft'
from (
  values
    (
      1,
      'Annuaire & services d’infrastructure',
      'Conception d’un domaine de démonstration avec comptes, groupes, stratégies de sécurité et services DNS/DHCP intégrés.',
      'Illustrer l’organisation d’un annuaire et des services réseau dans un environnement isolé.',
      array['Active Directory', 'GPO', 'DNS', 'DHCP']::text[],
      'Démonstration fictive — étapes et résultats réels à compléter.',
      'SYSTÈMES · WINDOWS SERVER'
    ),
    (
      2,
      'Réseau multi-VLAN',
      'Maquette réseau isolant les usages dans plusieurs VLAN, avec routage inter-VLAN et règles de filtrage documentées.',
      'Présenter les principes de segmentation et de contrôle des flux réseau.',
      array['VLAN', 'Routage', 'ACL', 'Documentation']::text[],
      'Démonstration fictive — étapes et résultats réels à compléter.',
      'RÉSEAU · SEGMENTATION'
    ),
    (
      3,
      'Serveur Linux reproductible',
      'Déploiement d’un serveur Linux de laboratoire, configuration des services essentiels et automatisation des opérations courantes.',
      'Illustrer une configuration de serveur Linux et la répétabilité des opérations courantes.',
      array['Linux', 'SSH', 'Bash', 'Sécurité']::text[],
      'Démonstration fictive — étapes et résultats réels à compléter.',
      'LINUX · AUTOMATISATION'
    )
) as seeded(sort_order, title, description, objective, technologies, results, category)
where not exists (
  select 1
  from public.projects existing
  where existing.title = seeded.title
);
