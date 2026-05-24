import React from "react";

interface DefaultAvatarProps {
  className?: string;
}

export function DefaultAvatar({ className = "w-10 h-10" }: DefaultAvatarProps) {
  return (
    <svg 
      className={`${className} rounded-xl bg-slate-950/80 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.15)] shrink-0`} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7f1d1d" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#avatarGrad)" />
      
      {/* Grid background lines */}
      <line x1="10" y1="0" x2="10" y2="100" stroke="#ef4444" strokeWidth="0.5" opacity="0.15" />
      <line x1="30" y1="0" x2="30" y2="100" stroke="#ef4444" strokeWidth="0.5" opacity="0.15" />
      <line x1="50" y1="0" x2="50" y2="100" stroke="#ef4444" strokeWidth="0.5" opacity="0.15" />
      <line x1="70" y1="0" x2="70" y2="100" stroke="#ef4444" strokeWidth="0.5" opacity="0.15" />
      <line x1="90" y1="0" x2="90" y2="100" stroke="#ef4444" strokeWidth="0.5" opacity="0.15" />
      
      <line x1="0" y1="10" x2="100" y2="10" stroke="#ef4444" strokeWidth="0.5" opacity="0.15" />
      <line x1="0" y1="30" x2="100" y2="30" stroke="#ef4444" strokeWidth="0.5" opacity="0.15" />
      <line x1="0" y1="50" x2="100" y2="50" stroke="#ef4444" strokeWidth="0.5" opacity="0.15" />
      <line x1="0" y1="70" x2="100" y2="70" stroke="#ef4444" strokeWidth="0.5" opacity="0.15" />
      <line x1="0" y1="90" x2="100" y2="90" stroke="#ef4444" strokeWidth="0.5" opacity="0.15" />

      {/* Cyber shield outline */}
      <path 
        d="M50 15 L80 28 V55 C80 72 67 84 50 88 C33 84 20 72 20 55 V28 Z" 
        stroke="#ef4444" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        opacity="0.85" 
      />
      
      {/* Cyber agent shape */}
      <path 
        d="M50 32 C56 32 60 36 60 42 C60 48 56 52 50 52 C44 52 40 48 40 42 C40 36 44 32 50 32 Z" 
        fill="#ef4444" 
        opacity="0.9" 
      />
      <path d="M42 41 H58 L54 44 H46 Z" fill="#ffffff" />
      <path 
        d="M28 72 C28 62 38 58 50 58 C62 58 72 62 72 72 V75 H28 Z" 
        fill="#ef4444" 
        opacity="0.9" 
      />
    </svg>
  );
}
