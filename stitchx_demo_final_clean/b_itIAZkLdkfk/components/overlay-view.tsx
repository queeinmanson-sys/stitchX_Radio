"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

  // Dramatic event flash
  const [showFlash, setShowFlash] = useState(false);
  useEffect(() => {
    if (data.incidents?.[0]?.severity === "high") {
      setShowFlash(true);
      const t = setTimeout(() => setShowFlash(false), 1000);
      return () => clearTimeout(t);
    }
  }, [data.incidents?.[0]?.id, data.incidents?.[0]?.severity]);

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

  // Live commentary banner (animated)
  const highlight = data.updates?.[0];

  return (
    <div className="pointer-events-none fixed inset-0 text-white font-semibold z-50">
      {/* TOP LEFT — Stage Info */}
      <div className="absolute top-4 left-4 bg-black/50 px-4 py-2 rounded-xl backdrop-blur">
        <div className="text-sm">{data.race.stageName}</div>
        <motion.div
          key={data.phase}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs text-cyan-300"
        >
          {data.phase}
        </motion.div>
      </div>

      {/* TOP RIGHT — Live Status */}
      <div className="absolute top-4 right-4 bg-red-600 px-3 py-1 rounded-lg text-sm">
        LIVE
      </div>

      {/* CENTER — Gap */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-center">
        <motion.div
          key={data.race.gap}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-5xl font-bold"
        >
          {data.race.gap}
        </motion.div>
        <div className="text-sm text-white/70">Gap</div>
      </div>

      {/* BOTTOM LEFT — Speed */}
      <div className="absolute bottom-6 left-6 bg-black/50 px-4 py-2 rounded-xl backdrop-blur">
        {data.race.pelotonSpeedKph} km/h
      </div>

      {/* BOTTOM RIGHT — Prediction */}
      <AnimatePresence>
        {data.predictions?.[0] && (
          <motion.div
            key={data.predictions[0].id}
            initial={{ x: 200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 200, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-6 right-6 bg-indigo-500/70 px-4 py-2 rounded-xl backdrop-blur text-sm"
          >
            {data.predictions[0].message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dramatic event flash */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 bg-red-500/20 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Live commentary banner (LLM/auto) */}
      <AnimatePresence>
        {displayed && (
          <motion.div
            key={displayed}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-black/70 px-6 py-3 rounded-xl text-white text-lg shadow-xl"
          >
            {displayed}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
