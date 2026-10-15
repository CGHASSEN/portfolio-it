import type { PortfolioProject } from "../types/project";

export const navigation = [
  { label: "À propos", href: "#apropos" },
  { label: "Compétences", href: "#competences" },
  { label: "Projets", href: "#projets" },
  { label: "Home lab", href: "#homelab" },
  { label: "Certifications", href: "#certifications" },
  { label: "Contact", href: "#contact" },
];

export const skillGroups = [
  {
    number: "01",
    title: "Support informatique",
    skills: [
      "Support N1/N2",
      "Helpdesk",
      "Assistance présentiel / distance",
      "Gestion et résolution des incidents",
      "Escalade des incidents",
      "GLPI / ITSM",
      "MCO",
    ],
  },
  {
    number: "02",
    title: "Postes de travail",
    skills: [
      "Windows 10/11",
      "Installation et configuration",
      "Déploiement",
      "Diagnostic matériel et logiciel",
      "Maintenance informatique",
    ],
  },
  {
    number: "03",
    title: "Environnement Microsoft",
    skills: [
      "Microsoft 365",
      "Outlook",
      "Teams",
      "OneDrive",
      "Active Directory",
      "Microsoft Entra ID",
      "Microsoft Intune",
      "Gestion des comptes utilisateurs",
    ],
  },
  {
    number: "04",
    title: "Systèmes & réseaux",
    skills: [
      "Windows Server",
      "Linux",
      "DNS",
      "DHCP",
      "TCP/IP",
      "VMware ESXi",
      "Proxmox",
      "Zabbix",
    ],
  },
  {
    number: "05",
    title: "Outils & documentation",
    skills: [
      "GLPI",
      "Documentation technique",
      "Procédures d’exploitation",
      "NAS Synology",
    ],
  },
];

export const homeLab = {
  technologies: ["Windows Server", "Proxmox", "Zabbix"],
  description:
    "Laboratoire informatique personnel utilisé pour consolider les compétences en administration systèmes et réseaux.",
  topologyNote:
    "Les équipements et connexions du schéma sont illustratifs ; la topologie réelle reste à documenter.",
};

export const projects: PortfolioProject[] = [
  {
    id: "example-active-directory",
    orderIndex: 1,
    category: "SYSTÈMES · WINDOWS SERVER",
    title: "Annuaire & services d’infrastructure",
    description:
      "Conception d’un domaine de démonstration avec comptes, groupes, stratégies de sécurité et services DNS/DHCP intégrés.",
    objective: "Illustrer l’organisation d’un annuaire et des services réseau dans un environnement isolé.",
    technologies: ["Active Directory", "GPO", "DNS", "DHCP"],
    steps: [],
    results: "Démonstration fictive — étapes et résultats réels à compléter.",
    coverImage: "",
    screenshots: [],
    repositoryUrl: "",
    demoUrl: "",
    date: "",
    status: "published",
    isExample: true,
  },
  {
    id: "example-vlan-network",
    orderIndex: 2,
    category: "RÉSEAU · SEGMENTATION",
    title: "Réseau multi-VLAN",
    description:
      "Maquette réseau isolant les usages dans plusieurs VLAN, avec routage inter-VLAN et règles de filtrage documentées.",
    objective: "Présenter les principes de segmentation et de contrôle des flux réseau.",
    technologies: ["VLAN", "Routage", "ACL", "Documentation"],
    steps: [],
    results: "Démonstration fictive — étapes et résultats réels à compléter.",
    coverImage: "",
    screenshots: [],
    repositoryUrl: "",
    demoUrl: "",
    date: "",
    status: "published",
    isExample: true,
  },
  {
    id: "example-linux-server",
    orderIndex: 3,
    category: "LINUX · AUTOMATISATION",
    title: "Serveur Linux reproductible",
    description:
      "Déploiement d’un serveur Linux de laboratoire, configuration des services essentiels et automatisation des opérations courantes.",
    objective: "Illustrer une configuration de serveur Linux et la répétabilité des opérations courantes.",
    technologies: ["Linux", "SSH", "Bash", "Sécurité"],
    steps: [],
    results: "Démonstration fictive — étapes et résultats réels à compléter.",
    coverImage: "",
    screenshots: [],
    repositoryUrl: "",
    demoUrl: "",
    date: "",
    status: "published",
    isExample: true,
  },
];

export const certifications = [
  {
    title: "Technicien supérieur systèmes et réseaux (TSSR)",
    detail: "Diplôme obtenu en avril 2026.",
    status: "DIPLÔME OBTENU · AVRIL 2026",
  },
  {
    title: "RGPD",
    detail: "Obtenue le 28 novembre 2025.",
    status: "OBTENUE · 28 NOVEMBRE 2025",
  },
  {
    title: "AWS Cloud Quest — Cloud",
    detail: "Obtenue le 16 janvier 2026.",
    status: "OBTENUE · 16 JANVIER 2026",
  },
  {
    title: "AWS Cloud Quest — Generative AI Practitioner",
    detail: "Obtenue le 6 février 2026.",
    status: "OBTENUE · 6 FÉVRIER 2026",
  },
  {
    title: "SecNum",
    detail: "Obtenue le 6 février 2026.",
    status: "OBTENUE · 6 FÉVRIER 2026",
  },
  {
    title: "Fortinet",
    detail: "Obtenue le 16 mai 2026. Niveau exact à confirmer.",
    status: "OBTENUE · 16 MAI 2026 · NIVEAU À CONFIRMER",
  },
  {
    title: "Cisco CCNA",
    detail: "Certification indiquée en préparation.",
    status: "EN PRÉPARATION",
  },
];
