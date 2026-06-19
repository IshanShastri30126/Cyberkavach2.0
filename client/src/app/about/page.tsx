"use client";

import React, { useEffect, useRef } from "react";
import { api } from "@/lib/api";

const LinkedinIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ width: "1em", height: "1em" }}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const InstagramIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ width: "1em", height: "1em" }}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const WhatsappIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ width: "1em", height: "1em" }}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.729-1.452L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.114-2.906-6.99C16.558 1.876 14.077.845 11.442.845 6.008.845 1.585 5.26 1.581 10.697c-.001 1.716.452 3.39 1.312 4.869l-.993 3.629 3.71-.973zm11.567-7.25c-.314-.157-1.859-.917-2.128-1.015-.27-.099-.465-.147-.659.148-.195.295-.754.95-.923 1.147-.17.197-.339.221-.653.064-1.294-.648-2.14-1.127-2.99-2.585-.224-.384.224-.356.643-1.198.07-.141.035-.264-.018-.372-.054-.108-.465-1.118-.637-1.532-.167-.403-.35-.347-.481-.353-.125-.006-.27-.008-.415-.008-.146 0-.383.055-.584.275-.2.22-.765.75-.765 1.83 0 1.078.784 2.12.893 2.27.109.15 1.543 2.356 3.738 3.302.522.224.93.359 1.249.46.525.166 1.002.143 1.379.088.42-.062 1.859-.76 2.128-1.492.27-.731.27-1.357.19-1.492-.08-.135-.295-.221-.609-.378z" />
  </svg>
);

import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, ArrowLeft, ShieldAlert, Trophy, Terminal, Heart, Info, Users, LogIn } from "lucide-react";

// =========================================================
// 3D BRIGHT NEON RED WORLD GLOBE WITH CYBER THREAT ARCS
// =========================================================
function CyberBackground3D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // 1. Globe Configuration - GIANT SIZE
    let R = Math.max(width, height) * 0.38;
    if (R < 320) R = 320;
    if (R > 700) R = 700;

    // Generate plasma cells in 3D - Boiling Nuclear Sun Surface
    interface WorldPoint {
      x: number;
      y: number;
      z: number;
      origX: number;
      origY: number;
      origZ: number;
      vx: number;
      vy: number;
      vz: number;
      lat: number;
      lon: number;
      radius: number;
      temperature: number;
      noiseOffset: number;
    }

    const worldPoints: WorldPoint[] = [];
    const numCells = 240;

    for (let i = 0; i < numCells; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / numCells);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;

      const x = R * Math.sin(phi) * Math.cos(theta);
      const y = R * Math.sin(phi) * Math.sin(theta);
      const z = R * Math.cos(phi);

      worldPoints.push({
        x, y, z,
        origX: x, origY: y, origZ: z,
        vx: 0, vy: 0, vz: 0,
        lat: (phi * 180 / Math.PI) - 90,
        lon: (theta * 180 / Math.PI) % 360,
        radius: 35 + Math.random() * 45, // overlapping size
        temperature: 0.3 + Math.random() * 0.7,
        noiseOffset: Math.random() * 100
      });
    }

    // 2. Cyber Threat Attack Arcs
    interface ThreatArc {
      pStart: WorldPoint;
      pEnd: WorldPoint;
      progress: number;
      speed: number;
      height: number;
      active: boolean;
    }

    const threatArcs: ThreatArc[] = [];
    const maxThreats = 5;

    const spawnThreatArc = () => {
      if (worldPoints.length < 2) return;
      const idxA = Math.floor(Math.random() * worldPoints.length);
      let idxB = Math.floor(Math.random() * worldPoints.length);
      while (idxB === idxA) {
        idxB = Math.floor(Math.random() * worldPoints.length);
      }

      threatArcs.push({
        pStart: worldPoints[idxA],
        pEnd: worldPoints[idxB],
        progress: 0,
        speed: 0.008 + Math.random() * 0.01,
        height: 30 + Math.random() * 60,
        active: true
      });
    };

    // 3. Click-to-Launch Missiles
    interface Missile {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      vx: number;
      vy: number;
    }
    const missiles: Missile[] = [];

    // 4. Sun-Like Glow Particles (Solar wind/flares)
    interface SunParticle {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      alpha: number;
      size: number;
      maxAge: number;
      age: number;
      color: string;
    }
    const sunParticles: SunParticle[] = [];

    // Nuclear blast reactions
    interface NuclearParticle {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      color: string;
      size: number;
      alpha: number;
    }
    interface NuclearBlast {
      x: number;
      y: number;
      z: number;
      type: 'fission' | 'fusion';
      particles: NuclearParticle[];
      maxAge: number;
      age: number;
    }
    const nuclearBlasts: NuclearBlast[] = [];

    // Fusion active collision cores
    interface FusionCore {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      color: string;
      trail: { x: number; y: number; z: number }[];
    }
    let activeFusionCores: FusionCore[] = [];

    const spawnFusionReaction = () => {
      if (worldPoints.length === 0) return;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      const ax = R * 1.8 * Math.sin(phi) * Math.cos(theta);
      const ay = R * 1.8 * Math.sin(phi) * Math.sin(theta);
      const az = R * 1.8 * Math.cos(phi);
      
      const bx = -ax;
      const by = -ay;
      const bz = -az;
      
      const steps = 40;
      activeFusionCores = [
        { x: ax, y: ay, z: az, vx: -ax / steps, vy: -ay / steps, vz: -az / steps, color: "#ffffff", trail: [] },
        { x: bx, y: by, z: bz, vx: -bx / steps, vy: -by / steps, vz: -bz / steps, color: "#ffcc00", trail: [] }
      ];
    };

    const triggerFusionBlast = (x: number, y: number, z: number) => {
      const particles: NuclearParticle[] = [];
      const numParticles = 120;
      for (let p = 0; p < numParticles; p++) {
        const sa = Math.random() * Math.PI * 2;
        const sp = Math.acos((Math.random() * 2) - 1);
        const speed = 4 + Math.random() * 10;
        particles.push({
          x, y, z,
          vx: Math.sin(sp) * Math.cos(sa) * speed,
          vy: Math.sin(sp) * Math.sin(sa) * speed,
          vz: Math.cos(sp) * speed,
          color: Math.random() > 0.4 ? "rgba(255, 255, 255, " : (Math.random() > 0.3 ? "rgba(255, 204, 0, " : "rgba(239, 68, 68, "),
          size: 2.5 + Math.random() * 4.5,
          alpha: 1.0
        });
      }
      nuclearBlasts.push({
        x, y, z,
        type: 'fusion',
        particles,
        maxAge: 50,
        age: 0
      });
    };

    const triggerFissionBlast = (x: number, y: number, z: number) => {
      const particles: NuclearParticle[] = [];
      const numParticles = 45;
      for (let p = 0; p < numParticles; p++) {
        const sa = Math.random() * Math.PI * 2;
        const sp = Math.acos((Math.random() * 2) - 1);
        const speed = 2 + Math.random() * 7;
        particles.push({
          x, y, z,
          vx: Math.sin(sp) * Math.cos(sa) * speed,
          vy: Math.sin(sp) * Math.sin(sa) * speed,
          vz: Math.cos(sp) * speed,
          color: Math.random() > 0.5 ? "rgba(239, 68, 68, " : "rgba(249, 115, 22, ",
          size: 1.5 + Math.random() * 2.5,
          alpha: 1.0
        });
      }
      nuclearBlasts.push({
        x, y, z,
        type: 'fission',
        particles,
        maxAge: 35,
        age: 0
      });
    };

    // Sweeping Scanner Lasers
    let scanY = 0;
    const scanSpeed = 2.0;

    // Interactive States & Rotations
    let mouseX = -1000;
    let mouseY = -1000;
    let globeRotationY = 0;
    let globeRotationX = 0.2;
    let targetGlobeRotY = 0;
    let targetGlobeRotX = 0.2;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let reticleRotation = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        targetGlobeRotY += deltaX * 0.005;
        targetGlobeRotX += deltaY * 0.005;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      const distToCenter = Math.sqrt(Math.pow(e.clientX - (width / 2), 2) + Math.pow(e.clientY - (height / 2), 2));
      if (distToCenter < R * 1.3) {
        spawnFusionReaction();
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      } else {
        const startX = width / 2;
        const startY = height + 30;
        const targetX = e.clientX;
        const targetY = e.clientY;
        const angle = Math.atan2(targetY - startY, targetX - startX);
        const speed = 18;

        missiles.push({
          x: startX,
          y: startY,
          targetX,
          targetY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed
        });
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const fov = R * 1.8;

      globeRotationY += (targetGlobeRotY - globeRotationY) * 0.05;
      globeRotationX += (targetGlobeRotX - globeRotationX) * 0.05;
      targetGlobeRotY += 0.0018;

      const cosY = Math.cos(globeRotationY), sinY = Math.sin(globeRotationY);
      const cosX = Math.cos(globeRotationX), sinX = Math.sin(globeRotationX);

      const centerX = width / 2;
      const centerY = height / 2;

      // Update cell temperatures before drawing (simulating convection bubbling)
      worldPoints.forEach((p) => {
        p.temperature = 0.5 + Math.sin(Date.now() * 0.0035 + p.noiseOffset) * 0.45;
        p.temperature = Math.max(0.1, Math.min(1.0, p.temperature));
      });

      // Project Land Points
      const projectedPoints = worldPoints.map((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        p.vx += (p.origX - p.x) * 0.08;
        p.vy += (p.origY - p.y) * 0.08;
        p.vz += (p.origZ - p.z) * 0.08;

        p.vx *= 0.82;
        p.vy *= 0.82;
        p.vz *= 0.82;

        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        const scale = fov / Math.max(10, fov + z2);
        const px = centerX + x1 * scale;
        const py = centerY + y2 * scale;

        return {
          pt: p,
          px,
          py,
          z: z2,
          scale
        };
      });

      // Draw horizontal scanner scanline
      scanY += scanSpeed;
      if (scanY > height + 200) scanY = -200;
      ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(width, scanY);
      ctx.stroke();

      // Draw Atmosphere Neon Glow Corona Envelope around perimeter
      const coronaGlow = ctx.createRadialGradient(centerX, centerY, R * 0.95, centerX, centerY, R * 1.12);
      coronaGlow.addColorStop(0, "rgba(239, 68, 68, 0.18)");
      coronaGlow.addColorStop(0.5, "rgba(239, 68, 68, 0.06)");
      coronaGlow.addColorStop(1, "rgba(239, 68, 68, 0)");
      ctx.fillStyle = coronaGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, R * 1.12, 0, Math.PI * 2);
      ctx.fill();

      // Draw Globe Grid Rings (Latitude and Longitude Meridians)
      ctx.strokeStyle = "rgba(239, 68, 68, 0.08)";
      ctx.lineWidth = 0.8;
      
      const numRings = 7;
      for (let r = 0; r < numRings; r++) {
        const lat = -80 + (160 / (numRings + 1)) * (r + 1);
        const radLat = (lat * Math.PI) / 180;
        const ringRadius = R * Math.cos(radLat);
        const ringY = -R * Math.sin(radLat);

        ctx.beginPath();
        for (let a = 0; a <= 360; a += 10) {
          const theta = (a * Math.PI) / 180;
          const rx = ringRadius * Math.sin(theta);
          const rz = ringRadius * Math.cos(theta);

          const rxRot = rx * cosY - rz * sinY;
          const rzRot = rx * sinY + rz * cosY;
          const ryRot = ringY * cosX - rzRot * sinX;
          const rzFinal = ringY * sinX + rzRot * cosX;

          if (rzFinal > -120) {
            const scale = fov / Math.max(10, fov + rzFinal);
            const px = centerX + rxRot * scale;
            const py = centerY + ryRot * scale;
            if (a === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      }

      // Draw solid base sun disk in center for spherical depth
      const sunBaseGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, R);
      sunBaseGlow.addColorStop(0, "rgba(220, 20, 20, 1.0)");
      sunBaseGlow.addColorStop(0.7, "rgba(100, 10, 10, 1.0)");
      sunBaseGlow.addColorStop(1.0, "rgba(10, 0, 0, 1.0)");
      ctx.fillStyle = sunBaseGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, R, 0, Math.PI * 2);
      ctx.fill();

      // 3. Draw Thermodynamic Boiling Plasma Cells (Overlapping Gradients)
      ctx.save();
      ctx.globalCompositeOperation = "screen"; // Additive blending for gorgeous glowing plasma
      
      projectedPoints.forEach((item) => {
        // Only render front-facing cells
        if (item.z > R * 0.35) return;

        const depthAlpha = Math.max(0.0, 1.0 - (item.z / R));
        const alpha = depthAlpha * (0.3 + item.pt.temperature * 0.6) * 0.95;
        
        const cellRadius = item.pt.radius * item.scale * (0.85 + Math.sin(Date.now() * 0.004 + item.pt.noiseOffset) * 0.15);
        if (cellRadius < 1) return;

        const grad = ctx.createRadialGradient(item.px, item.py, 0, item.px, item.py, cellRadius);
        const temp = item.pt.temperature;
        
        if (temp > 0.82) {
          grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.95})`);
          grad.addColorStop(0.25, `rgba(255, 204, 0, ${alpha * 0.75})`);
          grad.addColorStop(0.55, `rgba(249, 115, 22, ${alpha * 0.45})`);
          grad.addColorStop(0.85, `rgba(239, 68, 68, ${alpha * 0.2})`);
          grad.addColorStop(1.0, "rgba(127, 29, 29, 0)");
        } else if (temp > 0.5) {
          grad.addColorStop(0, `rgba(255, 200, 0, ${alpha * 0.8})`);
          grad.addColorStop(0.35, `rgba(249, 115, 22, ${alpha * 0.5})`);
          grad.addColorStop(0.75, `rgba(239, 68, 68, ${alpha * 0.2})`);
          grad.addColorStop(1.0, "rgba(127, 29, 29, 0)");
        } else {
          grad.addColorStop(0, `rgba(239, 68, 68, ${alpha * 0.6})`);
          grad.addColorStop(0.5, `rgba(180, 20, 20, ${alpha * 0.3})`);
          grad.addColorStop(0.85, `rgba(120, 10, 10, ${alpha * 0.1})`);
          grad.addColorStop(1.0, "rgba(0, 0, 0, 0)");
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(item.px, item.py, cellRadius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // Draw 3D Solar Prominences (raw energy arcing across sun surface)
      ctx.strokeStyle = "rgba(255, 100, 0, 0.35)";
      ctx.lineWidth = 1.2;
      ctx.shadowColor = "#ff5500";
      ctx.shadowBlur = 8;
      
      for (let i = 0; i < projectedPoints.length; i += 12) {
        const n1 = projectedPoints[i];
        if (n1.z > R * 0.1) continue;
        
        const nextIdx = (i + 13) % projectedPoints.length;
        const n2 = projectedPoints[nextIdx];
        if (n2.z > R * 0.1) continue;

        const dx = n1.pt.x - n2.pt.x;
        const dy = n1.pt.y - n2.pt.y;
        const dz = n1.pt.z - n2.pt.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        if (dist > 60 && dist < R * 0.95) {
          const midX = (n1.pt.x + n2.pt.x) / 2;
          const midY = (n1.pt.y + n2.pt.y) / 2;
          const midZ = (n1.pt.z + n2.pt.z) / 2;
          
          const midLen = Math.sqrt(midX*midX + midY*midY + midZ*midZ) || 1;
          const prominenceHeight = R * 1.22;
          
          const ctrlX = (midX / midLen) * prominenceHeight;
          const ctrlY = (midY / midLen) * prominenceHeight;
          const ctrlZ = (midZ / midLen) * prominenceHeight;
          
          const cx1 = ctrlX * cosY - ctrlZ * sinY;
          const cz1 = ctrlX * sinY + ctrlZ * cosY;
          const cy2 = ctrlY * cosX - cz1 * sinX;
          const cz2 = ctrlY * sinX + cz1 * cosX;
          
          const cScale = fov / Math.max(10, fov + cz2);
          const cpx = centerX + cx1 * cScale;
          const cpy = centerY + cy2 * cScale;
          
          ctx.beginPath();
          ctx.moveTo(n1.px, n1.py);
          ctx.quadraticCurveTo(cpx, cpy, n2.px, n2.py);
          ctx.stroke();
        }
      }
      ctx.shadowBlur = 0;

      // Spawn Threat Arcs
      if (threatArcs.length < maxThreats && Math.random() < 0.02) {
        spawnThreatArc();
      }

      // Update and Draw Threat Arcs
      threatArcs.forEach((arc, idx) => {
        arc.progress += arc.speed;
        if (arc.progress >= 1.0) {
          triggerFissionBlast(arc.pEnd.x, arc.pEnd.y, arc.pEnd.z);
          threatArcs.splice(idx, 1);
          return;
        }

        ctx.lineWidth = 1.0;
        ctx.strokeStyle = "rgba(249, 115, 22, 0.25)";
        ctx.beginPath();
        
        let started = false;
        for (let t = 0; t <= 1; t += 0.05) {
          const mx = (arc.pStart.x + arc.pEnd.x) / 2;
          const my = (arc.pStart.y + arc.pEnd.y) / 2;
          const mz = (arc.pStart.z + arc.pEnd.z) / 2;

          const len = Math.sqrt(mx*mx + my*my + mz*mz) || 1;
          const ctrlX = (mx / len) * (R + arc.height);
          const ctrlY = (my / len) * (R + arc.height);
          const ctrlZ = (mz / len) * (R + arc.height);

          const x3d = (1 - t) * (1 - t) * arc.pStart.x + 2 * (1 - t) * t * ctrlX + t * t * arc.pEnd.x;
          const y3d = (1 - t) * (1 - t) * arc.pStart.y + 2 * (1 - t) * t * ctrlY + t * t * arc.pEnd.y;
          const z3d = (1 - t) * (1 - t) * arc.pStart.z + 2 * (1 - t) * t * ctrlZ + t * t * arc.pEnd.z;

          const x1 = x3d * cosY - z3d * sinY;
          const z1 = x3d * sinY + z3d * cosY;
          const y2 = y3d * cosX - z1 * sinX;
          const z2 = y3d * sinX + z1 * cosX;

          if (z2 < R * 0.9) {
            const scale = fov / Math.max(10, fov + z2);
            const px = centerX + x1 * scale;
            const py = centerY + y2 * scale;
            if (!started) {
              ctx.moveTo(px, py);
              started = true;
            } else {
              ctx.lineTo(px, py);
            }
          }
        }
        ctx.stroke();

        const t = arc.progress;
        const mx = (arc.pStart.x + arc.pEnd.x) / 2;
        const my = (arc.pStart.y + arc.pEnd.y) / 2;
        const mz = (arc.pStart.z + arc.pEnd.z) / 2;
        const len = Math.sqrt(mx*mx + my*my + mz*mz) || 1;
        const ctrlX = (mx / len) * (R + arc.height);
        const ctrlY = (my / len) * (R + arc.height);
        const ctrlZ = (mz / len) * (R + arc.height);

        const x3d = (1 - t) * (1 - t) * arc.pStart.x + 2 * (1 - t) * t * ctrlX + t * t * arc.pEnd.x;
        const y3d = (1 - t) * (1 - t) * arc.pStart.y + 2 * (1 - t) * t * ctrlY + t * t * arc.pEnd.y;
        const z3d = (1 - t) * (1 - t) * arc.pStart.z + 2 * (1 - t) * t * ctrlZ + t * t * arc.pEnd.z;

        const x1 = x3d * cosY - z3d * sinY;
        const z1 = x3d * sinY + z3d * cosY;
        const y2 = y3d * cosX - z1 * sinX;
        const z2 = y3d * sinX + z1 * cosX;

        if (z2 < R * 0.9) {
          const scale = fov / Math.max(10, fov + z2);
          const px = centerX + x1 * scale;
          const py = centerY + y2 * scale;

          ctx.fillStyle = "#ffcc00";
          ctx.shadowColor = "#ffcc00";
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(0.1, 4 * scale), 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Update and Draw Click Missiles
      for (let i = missiles.length - 1; i >= 0; i--) {
        const m = missiles[i];
        m.x += m.vx;
        m.y += m.vy;

        const dx = m.targetX - m.x;
        const dy = m.targetY - m.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < 18 || (m.vy < 0 && m.y <= m.targetY)) {
          const cx = m.targetX - centerX;
          const cy = m.targetY - centerY;
          
          if (Math.sqrt(cx*cx + cy*cy) < R * 1.1) {
            const cz = Math.sqrt(Math.max(0, R * R - cx * cx - cy * cy));
            const rx = cx;
            const ry = cy;
            const rz = -cz;
            
            const cosY_u = Math.cos(-globeRotationY), sinY_u = Math.sin(-globeRotationY);
            const cosX_u = Math.cos(-globeRotationX), sinX_u = Math.sin(-globeRotationX);
            
            const ry1 = ry * cosX_u - rz * sinX_u;
            const rz1 = ry * sinX_u + rz * cosX_u;
            const rx2 = rx * cosY_u - rz1 * sinY_u;
            const rz2 = rx * sinY_u + rz1 * cosY_u;
            
            triggerFissionBlast(rx2, ry1, rz2);
          } else {
            triggerFissionBlast(cx, cy, 0);
          }

          missiles.splice(i, 1);
          continue;
        }

        ctx.strokeStyle = "#ff3333";
        ctx.shadowColor = "#ff3333";
        ctx.shadowBlur = 18;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * 1.5, m.y - m.vy * 1.5);
        ctx.stroke();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * 1.5, m.y - m.vy * 1.5);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // 5.0. Draw Pulsating Sun Solar Flare Rays (behind globe structure)
      let sunTime = Date.now() * 0.002;
      ctx.save();
      ctx.translate(centerX, centerY);
      for (let r = 0; r < 24; r++) {
        const angle = (r * Math.PI * 2) / 24 + sunTime * 0.05;
        const pulse = Math.sin(sunTime * 3 + r) * 15 + Math.cos(sunTime * 1.5 - r) * 10;
        const length = R * (1.05 + Math.abs(pulse) * 0.0003) + pulse;
        
        const gradient = ctx.createLinearGradient(0, 0, Math.cos(angle) * length, Math.sin(angle) * length);
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
        gradient.addColorStop(0.2, "rgba(255, 204, 0, 0.25)");
        gradient.addColorStop(0.5, "rgba(239, 68, 68, 0.12)");
        gradient.addColorStop(1, "rgba(239, 68, 68, 0)");
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 6 + Math.sin(sunTime + r) * 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * R * 0.95, Math.sin(angle) * R * 0.95);
        ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
        ctx.stroke();
      }
      ctx.restore();

      // 5.1. Spawn Sun Particles (Solar Wind / flares)
      if (sunParticles.length < 120) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const px = R * Math.sin(phi) * Math.cos(theta);
        const py = R * Math.sin(phi) * Math.sin(theta);
        const pz = R * Math.cos(phi);
        
        const speed = 0.8 + Math.random() * 1.5;
        sunParticles.push({
          x: px, y: py, z: pz,
          vx: (px / R) * speed,
          vy: (py / R) * speed,
          vz: (pz / R) * speed,
          alpha: 1.0,
          size: 1.2 + Math.random() * 2.5,
          maxAge: 40 + Math.random() * 60,
          age: 0,
          color: Math.random() > 0.5 ? "rgba(255, 204, 0, " : (Math.random() > 0.5 ? "rgba(249, 115, 22, " : "rgba(255, 255, 255, ")
        });
      }

      // Update and Draw Sun Particles
      for (let i = sunParticles.length - 1; i >= 0; i--) {
        const sp = sunParticles[i];
        sp.age++;
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.z += sp.vz;
        sp.alpha = 1 - (sp.age / sp.maxAge);
        
        if (sp.age >= sp.maxAge) {
          sunParticles.splice(i, 1);
          continue;
        }
        
        const x1 = sp.x * cosY - sp.z * sinY;
        const z1 = sp.x * sinY + sp.z * cosY;
        const y2 = sp.y * cosX - z1 * sinX;
        const z2 = sp.y * sinX + z1 * cosX;
        
        const scale = fov / Math.max(10, fov + z2);
        const px = centerX + x1 * scale;
        const py = centerY + y2 * scale;
        
        if (z2 < R * 1.5) {
          ctx.fillStyle = `${sp.color}${sp.alpha * 0.8})`;
          ctx.beginPath();
          ctx.arc(px, py, sp.size * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5.2. Spawn background periodic Fusion reaction
      if (activeFusionCores.length === 0 && Math.random() < 0.003) {
        spawnFusionReaction();
      }

      // Update and Draw active Fusion Cores
      for (let i = activeFusionCores.length - 1; i >= 0; i--) {
        const fc = activeFusionCores[i];
        fc.x += fc.vx;
        fc.y += fc.vy;
        fc.z += fc.vz;
        
        fc.trail.push({ x: fc.x, y: fc.y, z: fc.z });
        if (fc.trail.length > 15) fc.trail.shift();
        
        const x1 = fc.x * cosY - fc.z * sinY;
        const z1 = fc.x * sinY + fc.z * cosY;
        const y2 = fc.y * cosX - z1 * sinX;
        const z2 = fc.y * sinX + z1 * cosX;
        
        const scale = fov / Math.max(10, fov + z2);
        const px = centerX + x1 * scale;
        const py = centerY + y2 * scale;
        
        ctx.strokeStyle = fc.color === "#ffffff" ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 204, 0, 0.4)";
        ctx.lineWidth = 3 * scale;
        ctx.beginPath();
        let first = true;
        fc.trail.forEach((tPt) => {
          const tx1 = tPt.x * cosY - tPt.z * sinY;
          const tz1 = tPt.x * sinY + tPt.z * cosY;
          const ty2 = tPt.y * cosX - tz1 * sinX;
          const tz2 = tPt.y * sinX + tz1 * cosX;
          
          const tScale = fov / Math.max(10, fov + tz2);
          const tpx = centerX + tx1 * tScale;
          const tpy = centerY + ty2 * tScale;
          
          if (first) {
            ctx.moveTo(tpx, tpy);
            first = false;
          } else {
            ctx.lineTo(tpx, tpy);
          }
        });
        ctx.stroke();
        
        ctx.fillStyle = fc.color;
        ctx.shadowColor = fc.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(px, py, 6 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      
      if (activeFusionCores.length === 2) {
        const fc1 = activeFusionCores[0];
        const fc2 = activeFusionCores[1];
        const dist = Math.sqrt(Math.pow(fc1.x - fc2.x, 2) + Math.pow(fc1.y - fc2.y, 2) + Math.pow(fc1.z - fc2.z, 2));
        if (dist < 20) {
          triggerFusionBlast(0, 0, 0);
          activeFusionCores = [];
        }
      }
      
      // 5.3. Update and Draw Nuclear Blasts
      for (let i = nuclearBlasts.length - 1; i >= 0; i--) {
        const blast = nuclearBlasts[i];
        blast.age++;
        
        if (blast.age >= blast.maxAge) {
          nuclearBlasts.splice(i, 1);
          continue;
        }
        
        const ageRatio = blast.age / blast.maxAge;
        const progressAlpha = 1 - ageRatio;
        
        projectedPoints.forEach((item) => {
          const dx = item.pt.x - blast.x;
          const dy = item.pt.y - blast.y;
          const dz = item.pt.z - blast.z;
          const dist3D = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
          const maxDist = blast.type === 'fusion' ? R * 1.5 : R * 0.7;
          
          if (dist3D < maxDist) {
            const force = (1 - dist3D / maxDist) * (blast.type === 'fusion' ? 24 : 10) * progressAlpha;
            item.pt.vx += (dx / dist3D) * force;
            item.pt.vy += (dy / dist3D) * force;
            item.pt.vz += (dz / dist3D) * force;
          }
        });
        
        blast.particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.z += p.vz;
          
          const x1 = p.x * cosY - p.z * sinY;
          const z1 = p.x * sinY + p.z * cosY;
          const y2 = p.y * cosX - z1 * sinX;
          const z2 = p.y * sinX + z1 * cosX;
          
          const scale = fov / Math.max(10, fov + z2);
          const px = centerX + x1 * scale;
          const py = centerY + y2 * scale;
          
          ctx.fillStyle = `${p.color}${progressAlpha * 0.95})`;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(0.1, p.size * scale), 0, Math.PI * 2);
          ctx.fill();
        });
        
        if (blast.type === 'fusion') {
          const ringRad = ageRatio * R * 1.6;
          
          ctx.strokeStyle = `rgba(255, 255, 255, ${progressAlpha})`;
          ctx.shadowColor = "#ffffff";
          ctx.shadowBlur = 25 * progressAlpha;
          ctx.lineWidth = 10 * progressAlpha;
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRad, 0, Math.PI * 2);
          ctx.stroke();
          
          ctx.strokeStyle = `rgba(255, 204, 0, ${progressAlpha * 0.5})`;
          ctx.lineWidth = 20 * progressAlpha;
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRad, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else {
          const ringRad = ageRatio * R * 0.7;
          ctx.strokeStyle = `rgba(239, 68, 68, ${progressAlpha})`;
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 15 * progressAlpha;
          ctx.lineWidth = 4 * progressAlpha;
          ctx.beginPath();
          
          const bx1 = blast.x * cosY - blast.z * sinY;
          const bz1 = blast.x * sinY + blast.z * cosY;
          const by2 = blast.y * cosX - bz1 * sinX;
          const bz2 = blast.y * sinX + bz1 * cosX;
          
          const bScale = fov / Math.max(10, fov + bz2);
          const bpx = centerX + bx1 * bScale;
          const bpy = centerY + by2 * bScale;
          
          ctx.arc(bpx, bpy, ringRad * bScale, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      // Draw Interactive Reticle Target
      if (mouseX > 0 && mouseY > 0) {
        reticleRotation += 0.015;

        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 1.2;
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 28, 0, Math.PI * 2);
        ctx.setLineDash([6, 10]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.moveTo(mouseX - 38, mouseY); ctx.lineTo(mouseX - 28, mouseY);
        ctx.moveTo(mouseX + 28, mouseY); ctx.lineTo(mouseX + 38, mouseY);
        ctx.moveTo(mouseX, mouseY - 38); ctx.lineTo(mouseX, mouseY - 28);
        ctx.moveTo(mouseX, mouseY + 28); ctx.lineTo(mouseX, mouseY + 38);
        ctx.stroke();

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        projectedPoints.forEach((item) => {
          if (item.z > R * 0.8) return;
          const dx = item.px - mouseX;
          const dy = item.py - mouseY;
          const dist = Math.sqrt(dx*dx + dy*dy);

          if (dist < 160) {
            const alpha = (1 - dist / 160) * 0.75;
            
            ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(item.px, item.py);
            ctx.lineTo(mouseX, mouseY);
            ctx.stroke();

            const boxSize = Math.max(0.1, 7 * item.scale);
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
            ctx.lineWidth = 1;
            ctx.strokeRect(item.px - boxSize, item.py - boxSize, boxSize * 2, boxSize * 2);

            ctx.font = "6.5px monospace";
            ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
            ctx.fillText(`THRT_${Math.abs(item.pt.lat)}N`, item.px + boxSize + 3, item.py - 2);
          }
        });

        // Print active instructions
        ctx.font = "8px monospace";
        ctx.fillStyle = "rgba(239, 68, 68, 0.75)";
        ctx.textAlign = "center";
        ctx.fillText("CYBER_ATTACK_TRACER_ON", mouseX, mouseY - 48);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-5" />;
}

export default function AboutPage() {
  const pillars = [
    {
      icon: <ShieldAlert className="w-8 h-8 text-red-500" />,
      title: "Ethical Hacking & Audits",
      desc: "Educating developers and enthusiasts in testing environments, discovering critical structural weaknesses, and writing reports."
    },
    {
      icon: <Trophy className="w-8 h-8 text-amber-500" />,
      title: "CTF Competition Training",
      desc: "Drilling skills in cryptography, reverse engineering, web exploitation, and binary analysis to compete globally."
    },
    {
      icon: <Terminal className="w-8 h-8 text-red-400" />,
      title: "Incident Simulation",
      desc: "Simulating live red-team vs blue-team cyber attack protocols to train defense analysts in threat remediation."
    },
    {
      icon: <Heart className="w-8 h-8 text-orange-500" />,
      title: "Community Outreach",
      desc: "Spreading digital hygiene awareness, securing systems locally, and encouraging safe technological habits."
    }
  ];

  const timelineEvents = [
    {
      year: "2024",
      title: "Club Inauguration",
      desc: "CyberKavach formed as a dedicated cybersecurity interest group with 30 initial members."
    },
    {
      year: "2025",
      title: "Scaling Operations",
      desc: "Expanded to 200+ members. Launched first college-level Hackathon and built automated scoring boards."
    },
    {
      year: "2026",
      title: "CyberKavach 2.0 Launch",
      desc: "Launched a fully centralized operating workspace hosting attendance scanner consoles and digital credentials validation."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden selection:bg-red-500/30 font-sans relative">
      
      {/* 3D Cyber Background Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none perspective-1000 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-10" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <CyberBackground3D />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay z-20" />
      </div>

      {/* Navbar */}
      <header className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto border-b border-white/10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-900 to-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)] border border-red-500/50">
                <Shield className="w-6 h-6 text-white shrink-0" />
              </div>
              <span className="text-xl font-bold tracking-widest font-mono hidden sm:inline-block animate-neon-shiver">CYBERKAVACH</span>
            </Link>
          </div>

        </motion.div>
        
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 sm:gap-5">
          <Link href="/about" className="md:hidden flex items-center justify-center p-1.5 text-red-400 hover:text-white transition-colors" title="About">
            <Info className="w-5 h-5" />
          </Link>
          <Link href="/team" className="md:hidden flex items-center justify-center p-1.5 text-slate-300 hover:text-red-400 transition-colors" title="Crew">
            <Users className="w-5 h-5" />
          </Link>
          <Link href="/auth" className="md:hidden flex items-center justify-center p-1.5 text-slate-400 hover:text-white transition-colors" title="Sign In">
            <LogIn className="w-5 h-5" />
          </Link>
        </motion.div>
      </header>

      <main className="relative z-10 pt-16 pb-32 px-6 max-w-7xl mx-auto">
        {/* Header Hero */}
        <div className="text-center mb-24">
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/30 border border-red-500/30 text-red-400 text-xs font-mono mb-6 uppercase tracking-wider animate-pulse"
          >
            Digital Shield Initiative
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-br from-white via-slate-200 to-red-500/50 bg-clip-text text-transparent"
          >
            Our Mission & Vision
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed"
          >
            CyberKavach is a collective of security researchers, software developers, and ethical hackers. We are committed to fostering a robust defensive and offensive security culture through collaborative training, simulations, and community auditing.
          </motion.p>
        </div>

        {/* Pillars of Focus */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight">Core Pillars of <span className="text-red-500 font-mono">CyberKavach</span></h2>
            <p className="text-slate-500 text-xs mt-1 font-mono">// CORE COMPETENCIES & OPERATIONS</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((p, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative rounded-2xl bg-white/[0.02] border border-white/10 hover:border-red-500/40 p-6 transition-all hover:bg-white/[0.05]"
              >
                <div className="absolute top-4 right-4 text-[8px] font-mono text-zinc-650 group-hover:text-red-500/40 transition-colors">
                  SEC_PLR_{idx + 1}
                </div>
                <div className="mb-4 p-3 rounded-xl bg-white/[0.03] w-fit border border-white/5 group-hover:border-red-500/20 group-hover:bg-red-500/5 transition-all">
                  {p.icon}
                </div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-white transition-colors">{p.title}</h3>
                <p className="text-sm text-slate-450 leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Timeline Section */}
        <section className="mb-20 max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight">System <span className="text-red-500">Timeline</span></h2>
            <p className="text-slate-500 text-xs mt-1 font-mono">// CHRONOLOGICAL ARCHIVE</p>
          </div>

          <div className="relative border-l border-zinc-800 ml-4 md:ml-32 pl-8 space-y-12">
            {timelineEvents.map((ev, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative"
              >
                {/* Visual marker point */}
                <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-black border-2 border-red-500 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                </div>
                
                {/* Year Label */}
                <span className="hidden md:block absolute -left-[160px] top-1 font-mono text-lg font-extrabold text-red-500">
                  {ev.year}
                </span>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                  <span className="md:hidden block font-mono text-sm font-bold text-red-500 mb-1">{ev.year}</span>
                  <h3 className="text-xl font-bold mb-2 text-white">{ev.title}</h3>
                  <p className="text-slate-450 text-sm leading-relaxed">{ev.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            <span className="font-bold tracking-widest font-mono text-white">CYBERKAVACH</span>
          </div>
          
          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a href="https://linkedin.com/company/cyberkavach" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-white/10 hover:border-red-500 hover:text-red-500 hover:bg-red-500/10 transition-all text-slate-400" title="LinkedIn">
              <LinkedinIcon className="w-5 h-5" />
            </a>
            <a href="https://instagram.com/cyberkavach" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-white/10 hover:border-red-500 hover:text-red-500 hover:bg-red-500/10 transition-all text-slate-400" title="Instagram">
              <InstagramIcon className="w-5 h-5" />
            </a>
            <a href="https://chat.whatsapp.com/cyberkavach" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-white/10 hover:border-red-500 hover:text-red-500 hover:bg-red-500/10 transition-all text-slate-400" title="WhatsApp Community">
              <WhatsappIcon className="w-5 h-5" />
            </a>
          </div>

          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} CyberKavach. All rights reserved.</p>
        </div>
      </footer>

      {/* Floating Social Links Dock */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <a href="https://linkedin.com/company/cyberkavach" target="_blank" rel="noopener noreferrer"
           className="w-11 h-11 rounded-full bg-black/80 border border-zinc-800 flex items-center justify-center hover:border-red-500 text-zinc-400 hover:text-red-500 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all hover:scale-110 hover:shadow-[0_0_20px_rgba(239,68,68,0.25)] flex items-center justify-center"
           title="CyberKavach LinkedIn">
           <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
        </a>
        <a href="https://instagram.com/cyberkavach" target="_blank" rel="noopener noreferrer"
           className="w-11 h-11 rounded-full bg-black/80 border border-zinc-800 flex items-center justify-center hover:border-red-500 text-zinc-400 hover:text-red-500 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all hover:scale-110 hover:shadow-[0_0_20px_rgba(239,68,68,0.25)] flex items-center justify-center"
           title="CyberKavach Instagram">
           <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
        </a>
        <a href="https://chat.whatsapp.com/cyberkavach" target="_blank" rel="noopener noreferrer"
           className="w-11 h-11 rounded-full bg-black/80 border border-zinc-800 flex items-center justify-center hover:border-red-500 text-zinc-400 hover:text-red-500 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all hover:scale-110 hover:shadow-[0_0_20px_rgba(239,68,68,0.25)] flex items-center justify-center text-lg leading-none"
           title="Join WhatsApp Group">
           <span>💬</span>
        </a>
      </div>
    </div>
  );
}
