export const ROLE_META = {
  SURVEYOR: {
    label: "Surveyor",
    color: "#00e676",
    zones: ["NORTH", "SOUTH", "EAST", "WEST", "CENTRAL"],
  },
  SUPERVISOR: {
    label: "Supervisor",
    color: "#00e5ff",
    zones: ["NORTH", "SOUTH", "EAST", "WEST", "CENTRAL"],
  },
  DIRECTOR: {
    label: "Director",
    color: "#ffd700",
    zones: ["NORTH", "SOUTH", "EAST", "WEST", "CENTRAL"],
  },
  ZONAL_CHIEF: {
    label: "Zonal Chief",
    color: "#ff9800",
    zones: ["NORTH", "SOUTH", "EAST", "WEST", "CENTRAL"],
  },
  GNRB: {
    label: "GNRB",
    color: "#ce93d8",
    zones: [],
  },
};

export const ROLES = Object.entries(ROLE_META).map(([key, value]) => ({
  value: key,
  label: value.label,
  zones: value.zones,
}));

export const ALL_ZONES = [
  "NORTH",
  "SOUTH",
  "EAST",
  "WEST",
  "CENTRAL",
];
export const APPROVAL_ROLES = [
  "SUPERVISOR",
  "DIRECTOR",
  "ZONAL_CHIEF",
  "GNRB",
  "ADMIN"
];

export const NAV_CONFIG = [
  { id: "map", label: "🗺 Map", roles: "ALL" },
  { id: "approvals", label: "✅ Approvals", roles: ["SUPERVISOR", "DIRECTOR", "GNRB","ZONAL_CHIEF"] },
  { id: "users", label: "👥 Users", roles: ["DIRECTOR"] },
  { id: "analytics", label: "📊 Analytics", roles: ["DIRECTOR", "GNRB", "ZONAL_CHIEF"] },
];