export const networkTopology = [
  {
    id: "edge-router",
    kind: "PASSERELLE",
    label: "ROUTEUR R1",
    address: "192.0.2.1",
    detail: "Routage de bord et passerelle de maquette. Adresse réservée à la documentation.",
  },
  {
    id: "core-switch",
    kind: "CŒUR L3",
    label: "SWITCH CORE",
    address: "192.0.2.2",
    detail: "Commutation et routage inter-VLAN dans cette topologie fictive.",
  },
  {
    id: "vlan-admin",
    kind: "VLAN 10",
    label: "ADMINISTRATION",
    address: "192.0.2.0/24",
    detail: "Segment d’administration d’exemple. Sous-réseau TEST-NET réservé aux exemples.",
  },
  {
    id: "vlan-servers",
    kind: "VLAN 20",
    label: "SERVEURS",
    address: "198.51.100.0/24",
    detail: "Segment serveurs d’exemple. Sous-réseau TEST-NET réservé aux exemples.",
  },
  {
    id: "vlan-users",
    kind: "VLAN 30",
    label: "UTILISATEURS",
    address: "203.0.113.0/24",
    detail: "Segment utilisateurs d’exemple. Sous-réseau TEST-NET réservé aux exemples.",
  },
] as const;
