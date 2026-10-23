export type RoomId =
  | "server"
  | "network"
  | "virtualization"
  | "cybersecurity"
  | "projects"
  | "certifications"
  | "contact";

export type Room = {
  id: RoomId;
  number: string;
  label: string;
  subtitle: string;
  description: string;
  side: -1 | 0 | 1;
  z: number;
  destination?: string;
};

export const rooms: Room[] = [
  {
    id: "server",
    number: "01",
    label: "SERVER ROOM",
    subtitle: "SYSTEMS & DIRECTORY SERVICES",
    description: "Compétences et réalisations systèmes à renseigner.",
    side: -1,
    z: 5,
  },
  {
    id: "network",
    number: "02",
    label: "NETWORK OPERATIONS",
    subtitle: "NOC / ROUTING & MONITORING",
    description: "Compétences et réalisations réseau à renseigner.",
    side: 1,
    z: 5,
    destination: "VLAN · ROUTAGE · SUPERVISION",
  },
  {
    id: "virtualization",
    number: "03",
    label: "VIRTUALIZATION LAB",
    subtitle: "HYPERVISORS & SERVICES",
    description: "Connaissances en virtualisation et services d’infrastructure à renseigner.",
    side: -1,
    z: -3,
  },
  {
    id: "cybersecurity",
    number: "04",
    label: "CYBERSECURITY LAB",
    subtitle: "HARDENING & ACCESS",
    description: "Compétences et réalisations en cybersécurité à renseigner.",
    side: 1,
    z: -3,
  },
  {
    id: "projects",
    number: "05",
    label: "PROJECT ARCHIVE",
    subtitle: "TECHNICAL DOCUMENTATION",
    description: "Projets et cas pratiques de démonstration du portfolio, à documenter.",
    side: -1,
    z: -11,
  },
  {
    id: "certifications",
    number: "06",
    label: "CERTIFICATIONS",
    subtitle: "TRAINING & CREDENTIALS",
    description: "Formations et certifications : à compléter avec des informations vérifiées.",
    side: 1,
    z: -11,
  },
  {
    id: "contact",
    number: "↗",
    label: "COMMUNICATION HUB",
    subtitle: "CONTACT / PROFILE",
    description: "Coordonnées et accès au portfolio complet.",
    side: 0,
    z: -19,
  },
];

export const projectDoorOptions: { id: RoomId; label: string }[] = [
  { id: "contact", label: "COMMUNICATION HUB" },
  { id: "certifications", label: "CERTIFICATIONS" },
  { id: "cybersecurity", label: "CYBERSECURITY LAB" },
  { id: "network", label: "NETWORKING LAB" },
  { id: "server", label: "ADMINISTRATION LAB" },
  { id: "virtualization", label: "VIRTUALIZATION LAB" },
  { id: "projects", label: "PROJECT ARCHIVE" },
];
