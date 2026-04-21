const predictionColor = {
  breakaway_success: "text-green-400",
  crash_risk: "text-red-400",
  phase_shift: "text-yellow-400"
};
"use client";

import { useEffect, useState } from "react";
import BroadcastView from "@/components/broadcast-view";
import OverlayView from "@/components/overlay-view";
import { io } from "socket.io-client";
import dynamic from "next/dynamic";
const RaceMap = dynamic(() => import("@/components/race-map"), { ssr: false });
import { Role } from "@/lib/roles";
import { RoleSwitcher } from "@/components/role-switcher";
import ControlPanel from "@/components/control-panel";

export type RaceState = {
  success: boolean;
  race: {
    stageName: string;
    status: string;
    distanceKm: number;
    completedKm: number;
    gap: string;
    pelotonSpeedKph: number;
    wind: string;
    lastUpdated: string;
  };
  incidents: {
    id: string;
    severity: string;
    type: string;
    location: string;
    message: string;
    time: string;
  }[];
  updates: {
    id: string;
    channel: string;
    message: string;
    time: string;
  }[];
  fanZone: {
    id: string;
    user: string;
    content: string;
    likes: number;
  }[];
};

const fallbackData: RaceState = {
  success: true,
  race: {
    stageName: "Stage 12",
    status: "LIVE",
    distanceKm: 148,
    completedKm: 91.4,
    gap: "1:14",
    pelotonSpeedKph: 46,
    wind: "Cross-tailwind",
    lastUpdated: new Date().toISOString(),
  },
  incidents: [
    {
      id: "inc_001",
      severity: "medium",
      type: "Crash",
      location: "Sector 3",
      message: "Minor crash in rear of peloton. Medical car observing.",
      time: new Date().toISOString(),
    },
  ],
  updates: [
    {
      id: "ru_001",
      channel: "Race Radio",
      message: "Breakaway of four riders holding 1:14.",
      time: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    },
    {
      id: "ru_002",
      channel: "Commissaire",
      message: "Feeding zone entry complete. No irregularities reported.",
      time: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
    },
  ],
  fanZone: [
    {
      id: "fz_001",
      user: "SprintSector",
      content: "This stage is finally opening up.",
      likes: 24,
    },
    {
      id: "fz_002",
      user: "ClimbWatcher",
      content: "Montserrat finish is going to change everything.",
      likes: 17,
    },
  ],
};


const phaseColor = {
  "Start": "text-green-400",
  "Breakaway Formation": "text-yellow-400",
  "Mid-Race Control": "text-blue-400",
  "Climb Phase": "text-orange-400",
  "Final Phase": "text-red-500"
};

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-white/40">{label}</div>
      <div className={`mt-2 text-xl font-semibold ${color ?? "text-white"}`}>{value}</div>
    </div>
  );
  const [data, setData] = useState<RaceState>(fallbackData);
  // Predictive insights state
  const [predictions, setPredictions] = useState<any[]>([]);
  // Broadcast mode state
  const [mode, setMode] = useState<"control" | "broadcast" | "overlay">("control");
  // Camera mode state
  const [cameraMode, setCameraMode] = useState("auto");
  // Commentary state
  const [commentary, setCommentary] = useState<string[]>([]);

  // Commentary socket listener
  useEffect(() => {
    if (!socket) return;
    const handler = (lines: string[]) => setCommentary(lines);
    socket.on("race:commentary", handler);
    return () => socket.off("race:commentary", handler);
  }, []);

  // Toggle body class for broadcast mode
  useEffect(() => {
    if (mode === "broadcast") {
      document.body.className = "broadcast";
    } else if (mode === "overlay") {
      document.body.className = "overlay";
    } else {
      document.body.className = "";
    }
  }, [mode]);
  // Timeline replay state
  const [history, setHistory] = useState<any[]>([]);
  const [replayIndex, setReplayIndex] = useState<number | null>(null);
  const [isReplay, setIsReplay] = useState(false);
  // Cinematic replay state
  const [isPlaying, setIsPlaying] = useState(false);
  return (
    <main className="min-h-screen bg-background p-6 text-white">
      {/* Mode Switcher */}
      <div className="mx-auto max-w-7xl flex justify-end pt-4 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setMode("control")}
            className={`px-3 py-1 rounded ${mode === "control" ? "bg-white/20" : "bg-white/5"}`}
          >
            Control
          </button>
          <button
            onClick={() => setMode("broadcast")}
            className={`px-3 py-1 rounded ${mode === "broadcast" ? "bg-white/20" : "bg-white/5"}`}
          >
            Broadcast
          </button>
          <button
            onClick={() => setMode("overlay")}
            className={`px-3 py-1 rounded ${mode === "overlay" ? "bg-white/20" : "bg-white/5"}`}
          >
            Overlay
          </button>
        </div>
      </div>

      {mode === "control" ? (
        <div className="mx-auto max-w-7xl space-y-6">
          {/* ...existing control UI code (metrics, map, replay, insights, etc.)... */}
        </div>
      ) : mode === "broadcast" ? (
        <BroadcastView data={{
          ...data,
          predictions,
          commentary
        }} />
      ) : (
        <OverlayView data={{
          ...data,
          predictions,
          commentary
        }} />
      )}
    </main>
  );
                      <div className="mt-2 flex gap-2">
                        <button className="text-xs bg-red-500 px-2 py-1 rounded">Dispatch</button>
                        <button className="text-xs bg-yellow-500 px-2 py-1 rounded">Escalate</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </section>
          </div>
        )}

        {role === "admin" && (
          <div className="mt-6">
            <ControlPanel />
          </div>
        )}

        {role === "fan" && (
          <section className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,45,0.96),rgba(9,14,30,0.98))] p-6 shadow-2xl">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Fan Pulse</h2>
              <p className="text-sm text-white/50">Supporter sentiment and stage-day reactions.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {(displayData.fanZone ?? []).map((p: any) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-semibold text-cyan-300">{p.user.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <div className="text-sm font-semibold text-white">{p.user}</div>
                      <div className="text-xs text-white/40">Fan post</div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/90">{p.content}</p>
                  <div className="mt-3 text-xs text-white/40">❤️ {p.likes}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
