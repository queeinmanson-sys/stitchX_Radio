"use client";
import { useState } from "react";
import { Role } from "@/lib/roles";

export function RoleSwitcher({ onChange }: { onChange: (r: Role) => void }) {
  const [role, setRole] = useState<Role>("official");

  return (
    <select
      value={role}
      onChange={(e) => {
        const r = e.target.value as Role;
        setRole(r);
        onChange(r);
      }}
      className="bg-black text-white px-3 py-1 rounded"
    >
      <option value="admin">Admin</option>
      <option value="official">Official</option>
      <option value="fan">Fan</option>
    </select>
  );
}
