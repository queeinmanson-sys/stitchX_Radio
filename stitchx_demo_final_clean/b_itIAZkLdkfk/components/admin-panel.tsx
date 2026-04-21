"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  email: string | null;
  role: "admin" | "official" | "fan";
  created_at?: string;
};

const ROLES: Profile["role"][] = ["admin", "official", "fan"];

export default function AdminPanel() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, role, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setProfiles([]);
    } else {
      setProfiles((data as Profile[]) ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const updateRole = async (id: string, role: Profile["role"]) => {
    setSavingId(id);
    setError(null);

    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, role } : p))
      );
    }

    setSavingId(null);
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,45,0.96),rgba(9,14,30,0.98))] p-6 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Admin Panel</h2>
          <p className="text-sm text-white/50">
            Manage user roles and platform access.
          </p>
        </div>

        <button
          onClick={loadProfiles}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-white/50">Loading users...</div>
      ) : profiles.length === 0 ? (
        <div className="text-sm text-white/50">No profiles found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.16em] text-white/40">
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">User ID</th>
                <th className="pb-2 pr-4">Role</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id}>
                  <td className="rounded-l-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
                    {profile.email ?? "No email"}
                  </td>
                  <td className="border-y border-white/10 bg-white/5 px-4 py-3 text-xs text-white/50">
                    {profile.id}
                  </td>
                  <td className="border-y border-white/10 bg-white/5 px-4 py-3">
                    <select
                      value={profile.role}
                      onChange={(e) =>
                        updateRole(
                          profile.id,
                          e.target.value as Profile["role"]
                        )
                      }
                      disabled={savingId === profile.id}
                      className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="rounded-r-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/50">
                    {savingId === profile.id ? "Saving..." : "Ready"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
