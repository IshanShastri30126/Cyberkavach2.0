"use client";
import React from "react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 w-full h-full font-mono select-none">
      <div className="relative flex items-center justify-center w-16 h-16">
        <div className="absolute inset-0 rounded-full border border-amber-500/10 border-t-amber-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border border-red-500/10 border-b-red-500 animate-spin [animation-duration:0.8s] [animation-direction:reverse]" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] text-zinc-500 tracking-[0.25em] uppercase font-bold animate-pulse">
          INITIALIZING OPERATIONAL PIPELINE
        </span>
        <span className="text-[9px] text-amber-500/60 uppercase tracking-widest">
          Establishing secure tunnel...
        </span>
      </div>
    </div>
  );
}
