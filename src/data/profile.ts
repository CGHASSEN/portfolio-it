export type ProfessionalLink = {
  label: string;
  url: string;
};

export const profile = {
  name: "CHIHAOUI GHASSEN",
  role: "Technicien supérieur systèmes et réseaux",
  introduction:
    "Technicien supérieur systèmes et réseaux, diplômé en avril 2026, je possède une première expérience en support informatique auprès des utilisateurs, en présentiel et à distance. J’ai notamment participé au traitement des incidents via GLPI, au déploiement de postes Windows 10/11 ainsi qu’à la gestion des comptes Active Directory et Microsoft 365.",
  aboutLead: "Diplômé TSSR en avril 2026, avec une première expérience en support informatique N1/N2.",
  about:
    "Je consolide également mes compétences en administration systèmes et réseaux à travers un laboratoire informatique personnel (HomeLab) utilisant notamment Windows Server, Proxmox et Zabbix.",
  workApproach:
    "Rigoureux, à l’écoute des utilisateurs et passionné par les nouvelles technologies, je souhaite continuer à développer mes compétences techniques et contribuer au bon fonctionnement des infrastructures informatiques.",
  objective:
    "Intégrer une entreprise en tant que technicien informatique ou alternant en administration systèmes et réseaux, afin de renforcer mes compétences et d’évoluer vers des missions d’administration et de gestion des infrastructures informatiques.",
  situation: "À la recherche d’un emploi ou d’une alternance en administration systèmes et réseaux.",
  location: "Pont-de-Chéruy (38230), France",
  email: "ghassenchihaoui94@gmail.com",
  phone: "06 65 41 49 74",
  cvUrl: "/documents/CV-Ghassen-Chihaoui.pdf",
  professionalLinks: [
    { label: "LinkedIn", url: "https://www.linkedin.com/in/ghassen-chihaoui-b7a87315a/" },
    { label: "GitHub", url: "https://github.com/CGHASSEN" },
  ] satisfies ProfessionalLink[],
} as const;
