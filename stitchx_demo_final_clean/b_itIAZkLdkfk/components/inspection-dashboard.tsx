"use client";

import { useEffect, useMemo, useState } from "react";

type Inspection = {
  id: string;
  rider?: string;
  overall_result?: "PASS" | "FAIL" | "WARNING" | string;
  bike_brand?: string;
  frame_model?: string;
  team?: string;
  event_name?: string;
  created_at?: string;
};

type Props = {
  backendUrl: string;
  role?: "admin" | "official" | "fan";
};

export default function InspectionDashboard({
  backendUrl,
  role = "fan",
}: Props) {
  const [all, setAll] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterResult, setFilterResult] = useState("");
  const [filterRider, setFilterRider] = useState("");
  const [filterEvent, setFilterEvent] = useState("");
  const [error, setError] = useState<string | null>(null);

  console.log("inspection backendUrl:", backendUrl);
  const apiBase = (backendUrl || "").replace(/\/$/, "");
  const load = async () => {
    try {
      const res = await fetch(`${apiBase}/inspections`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load inspections");
      const data = await res.json();
      setAll(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Could not load inspections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [apiBase]);

  const filtered = useMemo(() => {
    return all.filter((i) => {
      const result = (i.overall_result || "").toUpperCase();
      const rider = (i.rider || "").toLowerCase();
      const event = (i.event_name || "").toLowerCase();

      return (
        (!filterResult || result === filterResult) &&
        (!filterRider || rider.includes(filterRider.toLowerCase())) &&
        (!filterEvent || event.includes(filterEvent.toLowerCase()))
      );
    });
  }, [all, filterResult, filterRider, filterEvent]);

  const stats = useMemo(() => {
    let pass = 0;
    let fail = 0;
    let warning = 0;

    for (const i of filtered) {
      const result = (i.overall_result || "PASS").toUpperCase();
      if (result === "PASS") pass++;
      if (result === "FAIL") fail++;
      if (result === "WARNING") warning++;
    }

    const total = pass + fail + warning;
    const compliance = total ? Math.round((pass / total) * 100) : 0;

    return { pass, fail, warning, compliance };
  }, [filtered]);

  const deleteInspection = async (id: string) => {
    if (role !== "admin") return;
    const confirmed = window.confirm("Delete this inspection?");
    if (!confirmed) return;

    try {
      const res = await fetch(`${backendUrl}/inspections/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-key": "stitchx-admin-123",
        },
      });

      if (!res.ok) throw new Error("Delete failed");
      await load();
    } catch (err) {
      console.error(err);
      alert("Failed to delete inspection");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-200">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-white">StitchX Inspections</h1>
            <p className="text-sm text-slate-400">
              Operational inspection dashboard
            </p>
          </div>

          <div className="rounded-lg bg-slate-700 px-3 py-2 text-xs">
            {filtered.length} inspections
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="PASS" value={stats.pass} />
          <StatCard label="FAIL" value={stats.fail} />
          <StatCard label="WARNING" value={stats.warning} />
          <StatCard label="Compliance" value={`${stats.compliance}%`} />
        </div>

        <div className="flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-slate-900 p-4">
          <select
            value={filterResult}
            onChange={(e) => setFilterResult(e.target.value)}
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white"
          >
            <option value="">All Results</option>
            <option value="PASS">PASS</option>
            <option value="FAIL">FAIL</option>
            <option value="WARNING">WARNING</option>
          </select>

          <input
            value={filterRider}
            onChange={(e) => setFilterRider(e.target.value)}
            placeholder="Search rider"
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500"
          />

          <input
            value={filterEvent}
            onChange={(e) => setFilterEvent(e.target.value)}
            placeholder="Search event"
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500"
          />
        </div>

        {loading ? (
          <div className="text-sm text-slate-400">Loading inspections...</div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((i) => {
              const result = (i.overall_result || "PASS").toUpperCase();

              return (
                <div
                  key={i.id}
                  className="rounded-2xl border border-white/10 bg-slate-900 p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-white">{i.rider || "Unknown rider"}</strong>
                    <span
                      className={
                        result === "PASS"
                          ? "text-green-400"
                          : result === "FAIL"
                          ? "text-red-400"
                          : "text-amber-400"
                      }
                    >
                      {result}
                    </span>
                  </div>

                  <InfoRow
                    label="Bike"
                    value={`${i.bike_brand || ""} ${i.frame_model || ""}`.trim() || "-"}
                  />
                  <InfoRow label="Team" value={i.team || "-"} />
                  <InfoRow label="Event" value={i.event_name || "-"} />
                  <InfoRow
                    label="Time"
                    value={i.created_at ? new Date(i.created_at).toLocaleString() : "-"}
                  />

                  {role === "admin" && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => deleteInspection(i.id)}
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {!filtered.length && (
              <div className="text-sm text-slate-400">No inspections found.</div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-1 flex flex-wrap justify-between gap-2 text-sm">
      <div className="text-slate-400">{label}</div>
      <div>{value}</div>
    </div>
  );
}
