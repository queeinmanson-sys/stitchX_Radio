"use client";

async function sendAction(action: string) {
  try {
    const res = await fetch("http://localhost:4000/api/control", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action }),
    });

    const data = await res.json();
    alert(data.message || "Action sent");
  } catch (err) {
    console.error("Control action failed:", err);
    alert("Control action failed");
  }
}

export default function ControlPanel({ onActionComplete }: { onActionComplete?: () => void }) {
  async function sendAction(action: string) {
    try {
      const res = await fetch("http://localhost:4000/api/control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      await res.json();
      if (onActionComplete) onActionComplete();
    } catch (err) {
      console.error("Control action failed:", err);
      alert("Control action failed");
    }
  }
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-900/10 p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-red-300">
        Race Control Actions
      </h3>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => sendAction("neutralize_race")}
          className="rounded-xl bg-yellow-500 px-3 py-2 text-sm font-medium text-black"
        >
          Neutralize Race
        </button>

        <button
          onClick={() => sendAction("dispatch_medical")}
          className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white"
        >
          Dispatch Medical
        </button>

        <button
          onClick={() => sendAction("flag_incident")}
          className="rounded-xl bg-blue-500 px-3 py-2 text-sm font-medium text-white"
        >
          Flag Incident
        </button>
      </div>
    </div>
  );
}
