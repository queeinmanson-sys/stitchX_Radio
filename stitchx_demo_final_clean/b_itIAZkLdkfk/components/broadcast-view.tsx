"use client";

import RaceMap from "./race-map";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

  // Commentary rotation
  const [displayed, setDisplayed] = useState<string | null>(null);
  useEffect(() => {
    if (!data.commentary || data.commentary.length === 0) {
      setDisplayed(null);
      return;
    }
    let i = 0;
    setDisplayed(data.commentary[0]);
    const interval = setInterval(() => {
      setDisplayed(data.commentary[i % data.commentary.length]);
      i++;
    }, 4000);
    return () => clearInterval(interval);
  }, [data.commentary]);

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-6 relative">
      {/* Live commentary banner (LLM/auto) */}
      <AnimatePresence>
        {displayed && (
          <motion.div
            key={displayed}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-black/70 px-6 py-3 rounded-xl text-white text-lg shadow-xl z-50"
          >
            {displayed}
          </motion.div>
        )}
      </AnimatePresence>
      {/* TOP BAR */}
      <div className="flex justify-between items-center text-lg">
        <div>{data.race.stageName}</div>
        <div className="text-red-500 font-bold">LIVE</div>
      </div>
      {/* MAIN HERO */}
      <div className="text-center">
        <div className="text-4xl font-bold">
          Gap: {data.race.gap}
        </div>
        <div className="text-sm text-white/50 mt-1">
          Peloton Speed: {data.race.pelotonSpeedKph} km/h
        </div>
      </div>
      {/* PHASE */}
      <div className="text-center text-xl text-cyan-400">
        {data.phase}
      </div>
      {/* MAP */}
      <div className="rounded-2xl overflow-hidden">
        <div className="h-[400px]">
          <RaceMap positions={data.positions} />
        </div>
      </div>
      {/* KEY EVENTS */}
      <div>
        <h3 className="text-lg mb-2">Key Moments</h3>
        {data.updates.slice(0, 3).map((u: any) => (
          <div key={u.id} className="text-sm text-white/80">
            • {u.message}
          </div>
        ))}
      </div>
      {/* PREDICTIONS */}
      <div>
        <h3 className="text-lg mb-2">Insights</h3>
        {data.predictions?.map((p: any) => (
          <div key={p.id} className="text-sm text-indigo-300">
            {p.message} ({Math.round(p.confidence * 100)}%)
          </div>
        ))}
      </div>
    </div>
  );
}
