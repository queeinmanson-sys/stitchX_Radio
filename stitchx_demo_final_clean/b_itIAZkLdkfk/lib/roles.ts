export type Role = "admin" | "official" | "fan";

export const PERMISSIONS = {
  admin: ["all"],
  official: ["view", "incident"],
  fan: ["view"]
};
