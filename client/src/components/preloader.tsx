"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert } from "lucide-react";

export function Preloader() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [textIndex, setTextIndex] = useState(0);

  const bootSequence = [
    "INITIALIZING SECURE KERNEL...",
    "ESTABLISHING ENCRYPTED TUNNEL...",
    "BYPASSING FIREWALLS...",
    "VERIFYING CREDENTIALS...",
    "ACCESS GRANTED."
  ];

  useEffect(() => {
    // Prevent scrolling while loading
    document.body.style.overflow = "hidden";

    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setLoading(false);
            document.body.style.overflow = "auto";
          }, 100);
          return 100;
        }
        return p + Math.floor(Math.random() * 20) + 15;
      });
    }, 40);

    return () => {
      clearInterval(interval);
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    const textInterval = setInterval(() => {
      setTextIndex(i => (i < bootSequence.length - 1 ? i + 1 : i));
    }, 120);
    return () => clearInterval(textInterval);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020008] text-cyan-500 font-mono"
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
          
          <motion.div
            animate={{ scale: [1, 1.05, 1], filter: ["hue-rotate(0deg)", "hue-rotate(15deg)", "hue-rotate(0deg)"] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mb-8 relative"
          >
            <ShieldAlert className="w-24 h-24 text-cyan-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]" />
            <div className="absolute inset-0 border-2 border-cyan-500 rounded-full animate-ping opacity-20" />
          </motion.div>

          <div className="w-64 mb-4">
            <div className="h-2 w-full bg-violet-950/40 rounded-full overflow-hidden border border-violet-850/50">
              <div 
                className="h-full bg-gradient-to-r from-violet-600 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)] transition-all duration-200" 
                style={{ width: `${Math.min(progress, 100)}%` }} 
              />
            </div>
          </div>

          <div className="h-6 overflow-hidden">
            <p className="text-sm tracking-widest text-cyan-400 font-bold uppercase glitch-text" data-text={bootSequence[textIndex]}>
              {bootSequence[textIndex]}
            </p>
          </div>
          
          <div className="absolute bottom-8 right-8 text-xs text-violet-500 font-mono text-right">
            SYS.VER: 2.0.4<br/>
            SEC.LVL: OMEGA
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
