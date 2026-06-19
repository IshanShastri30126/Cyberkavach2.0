"use client";

import React from "react";
import { motion } from "framer-motion";

interface CyberKavachLogoProps {
  className?: string;
  collapsed?: boolean;
  showText?: boolean;
  animateDrawing?: boolean;
}

export const CyberKavachLogo: React.FC<CyberKavachLogoProps> = ({
  className = "",
  collapsed = false,
  showText = true,
  animateDrawing = true
}) => {
  // Parent variants to propagate hover state
  const containerVariants = {
    initial: { scale: 1 },
    hover: {
      scale: 1.08,
      filter: "drop-shadow(0 0 16px rgba(255, 0, 60, 0.4)) drop-shadow(0 0 8px rgba(204, 255, 0, 0.2))",
      transition: { type: "spring" as const, stiffness: 400, damping: 15 }
    }
  } as const;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Shield Icon */}
      <motion.div
        className="relative shrink-0 flex items-center justify-center w-12 h-12"
        initial="initial"
        whileHover="hover"
        variants={containerVariants}
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            {/* Left half gradient - Tech Deep Grey/Black */}
            <linearGradient id="shieldLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1C1C1E" />
              <stop offset="50%" stopColor="#0F0F10" />
              <stop offset="100%" stopColor="#050505" />
            </linearGradient>

            {/* Right half gradient - Vibrant Neon Red */}
            <linearGradient id="shieldRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF0055" />
              <stop offset="60%" stopColor="#FF003C" />
              <stop offset="100%" stopColor="#B3002A" />
            </linearGradient>

            {/* Border glow gradient */}
            <linearGradient id="limeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#CCFF00" />
              <stop offset="100%" stopColor="#669900" />
            </linearGradient>

            {/* Red glow filter */}
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Lime glow filter */}
            <filter id="glow-lime" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer tech ring (Spins and brightens on hover) */}
          <motion.circle
            cx="12"
            cy="12"
            r="11"
            stroke="url(#limeGlow)"
            strokeWidth="0.5"
            strokeDasharray="4 6"
            className="opacity-30"
            variants={{
              hover: {
                rotate: 360,
                opacity: 0.8,
                strokeWidth: 0.75,
                transition: {
                  rotate: { repeat: Infinity, duration: 4, ease: "linear" },
                  opacity: { duration: 0.3 }
                }
              }
            }}
          />

          {/* Inner tech ring (Spins counter-clockwise on hover) */}
          <motion.circle
            cx="12"
            cy="12"
            r="10"
            stroke="#FF003C"
            strokeWidth="0.25"
            strokeDasharray="1 8"
            className="opacity-20"
            variants={{
              hover: {
                rotate: -360,
                opacity: 0.6,
                transition: {
                  rotate: { repeat: Infinity, duration: 6, ease: "linear" },
                  opacity: { duration: 0.3 }
                }
              }
            }}
          />

          {/* Left half - deep tech background with glow */}
          <path
            d="M12 3L4 6.8V11.5C4 16.5 7.5 20.2 12 22V3Z"
            fill="url(#shieldLeft)"
            filter="drop-shadow(0 0 2px rgba(204,255,0,0.15))"
          />

          {/* Right half - neon red */}
          <path
            d="M12 3L20 6.8V11.5C20 16.5 16.5 20.2 12 22V3Z"
            fill="url(#shieldRight)"
            filter="url(#glow-red)"
          />

          {/* Subtle outer shield border */}
          <path
            d="M12 3L4 6.8V11.5C4 16.5 7.5 20.2 12 22C16.5 20.2 20 16.5 20 11.5V6.8L12 3Z"
            fill="none"
            stroke="url(#limeGlow)"
            strokeWidth="0.75"
            strokeOpacity="0.5"
          />

          {/* Interactive Scanning Line (translates down the shield on hover) */}
          <motion.path
            d="M 5 8 L 19 8"
            stroke="#CCFF00"
            strokeWidth="1"
            opacity="0"
            variants={{
              hover: {
                y: [0, 10, 0],
                opacity: [0, 0.7, 0],
                transition: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }
            }}
          />

          {/* CK monogram inside (thicker lines + glow trails) */}
          {/* C - Glow Trail */}
          <motion.path
            d="M 10.5 8.5 L 7 10.25 L 7 13.75 L 10.5 15.5"
            stroke="#CCFF00"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-20"
            filter="url(#glow-lime)"
            initial={animateDrawing ? { pathLength: 0 } : { pathLength: 1 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
          />
          {/* C - Sharp Forefront */}
          <motion.path
            d="M 10.5 8.5 L 7 10.25 L 7 13.75 L 10.5 15.5"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={animateDrawing ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
          />

          {/* K - Glow Trail */}
          <motion.path
            d="M 13.5 8.5 L 13.5 15.5 M 17 8.5 L 13.5 12 L 17 15.5"
            stroke="#FF003C"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-20"
            filter="url(#glow-red)"
            initial={animateDrawing ? { pathLength: 0 } : { pathLength: 1 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
          {/* K - Sharp Forefront */}
          <motion.path
            d="M 13.5 8.5 L 13.5 15.5 M 17 8.5 L 13.5 12 L 17 15.5"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={animateDrawing ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
      </motion.div>

      {/* Text Area */}
      {showText && !collapsed && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-baseline font-bold font-mono tracking-widest text-lg uppercase leading-none">
            <motion.span
              className="text-white"
              initial={animateDrawing ? { x: -10, opacity: 0 } : { x: 0, opacity: 1 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Cyber
            </motion.span>
            <motion.span
              className="text-[#FF003C]"
              initial={animateDrawing ? { x: 10, opacity: 0 } : { x: 0, opacity: 1 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              style={{ textShadow: "0 0 10px rgba(255,0,60,0.5)" }}
            >
              Kavach
            </motion.span>
          </div>
          <motion.span
            className="text-[7.5px] tracking-[0.25em] font-mono uppercase text-[#CCFF00] mt-1 whitespace-nowrap opacity-80"
            initial={animateDrawing ? { opacity: 0, y: 5 } : { opacity: 0.8, y: 0 }}
            animate={{ opacity: 0.8, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Cyber Security Club
          </motion.span>
        </div>
      )}
    </div>
  );
};
