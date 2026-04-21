"use client";

import { useEffect, useState } from "react";

type RaceUpdate = {
  id?: string;
  src?: string;
  msg?: string;
  message?: string;
  timestamp?: string;
};

export default function LiveUpdates() {
  const [updates, setUpdates] = useState<RaceUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/api/race-updates")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.updates)) {
          setUpdates(data.updates);
        } else {
          setUpdates([]);
        }
      })
      .catch((err) => {
        console.error("Failed to load race updates:", err);
        setUpdates([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-sm text-white/70">Loading live updates...</div>;
  }

  if (!updates.length) {
    return <div className="text-sm text-white/70">No live updates yet.</div>;
  }

  return (
    <div className="space-y-3">
      {updates.map((update, index) => (
        <div
          key={update.id ?? index}
          className="rounded-xl border border-white/10 bg-white/5 p-3"
        >
          <div className="text-xs uppercase tracking-wide text-white/50">
            {update.src || "Race Radio"}
          </div>
          <div className="mt-1 text-sm text-white">
            {update.msg || update.message || "No message"}
          </div>
          {update.timestamp ? (
            <div className="mt-1 text-xs text-white/40">
              {new Date(update.timestamp).toLocaleTimeString()}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
