"use client";

import React, { useEffect, useRef } from "react";

export function CosmicBackground() {
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

    // Galaxy Size Configuration
    let R = Math.max(width, height) * 0.36;
    if (R < 320) R = 320;
    if (R > 680) R = 680;

    // Stars representation in 3D Galactic space
    interface Star {
      r: number; // radius from center
      spiralOffset: number; // arm offset angle
      theta: number; // current orbit angle
      orbitSpeed: number; // orbital angular velocity
      x3d: number; // local coordinate x
      y3d: number; // local coordinate y (vertical thickness)
      z3d: number; // local coordinate z
      vx: number; // velocity x
      vy: number; // velocity y
      vz: number; // velocity z
      size: number;
      color: string;
      alpha: number;
      isCore: boolean;
    }

    // Volumetric Nebula Gas Clouds
    interface NebulaCloud {
      r: number;
      spiralOffset: number;
      theta: number;
      orbitSpeed: number;
      x3d: number;
      y3d: number;
      z3d: number;
      size: number;
      color: string;
      alpha: number;
    }

    // Relativistic Jet streams from center (perpendicular to disc plane)
    interface JetParticle {
      lx: number; // local x
      ly: number; // local y (vertical height)
      lz: number; // local z
      speed: number;
      size: number;
      color: string;
      alpha: number;
      direction: number; // 1 for up, -1 for down
    }

    // Parallax background stars
    interface BgStar {
      x: number;
      y: number;
      z: number;
      size: number;
      alpha: number;
      color: string;
    }

    const stars: Star[] = [];
    const numStars = 400;
    const numArms = 2;
    const armWarp = 4.2;

    // Generate Galaxy Stars
    for (let i = 0; i < numStars; i++) {
      let r = 0;
      let spiralOffset = 0;
      let theta = Math.random() * Math.PI * 2;
      let orbitSpeed = 0;
      let y3d = 0;
      let size = 1.0 + Math.random() * 1.5;
      let alpha = 0.35 + Math.random() * 0.65;
      let isCore = false;

      if (i < 320) {
        // Core bulge stars (dense central oblate spheroid distribution)
        isCore = true;
        r = Math.pow(Math.random(), 1.8) * (R * 0.22);
        spiralOffset = Math.random() * Math.PI * 2;
        orbitSpeed = (0.005 + Math.random() * 0.006) * (1.2 - r / (R * 0.22));
        // Vertical thickness flattened (oblate spheroid)
        y3d = (Math.random() - 0.5) * (R * 0.14) * (1 - r / (R * 0.22));
      } else {
        // Spiral arm stars
        r = R * 0.15 + Math.pow(Math.random(), 1.2) * (R * 0.85);
        const arm = Math.floor(Math.random() * numArms);
        spiralOffset = arm * (Math.PI * 2 / numArms);
        orbitSpeed = 0.0008 + (0.0018 * (R / r));
        // Taper height as distance increases
        y3d = (Math.random() - 0.5) * (R * 0.08) * (1 - r / R);
      }

      // Star color selection based on galactic temperature/chemistry
      const rand = Math.random();
      const color = rand > 0.85 
        ? "rgba(103, 232, 249, "   // Electric Cyan
        : rand > 0.55 
          ? "rgba(196, 181, 253, " // Violet Purple
          : rand > 0.3 
            ? "rgba(254, 243, 199, " // Soft Warm Gold
            : "rgba(255, 255, 255, "; // Pure White

      stars.push({
        r,
        spiralOffset,
        theta,
        orbitSpeed,
        x3d: r * Math.cos(theta + spiralOffset),
        y3d,
        z3d: r * Math.sin(theta + spiralOffset),
        vx: 0,
        vy: 0,
        vz: 0,
        size,
        color,
        alpha,
        isCore
      });
    }

    // Generate Volumetric Nebula Clouds (large soft colored gradients along spiral arms)
    const nebulae: NebulaCloud[] = [];
    const numClouds = 45;
    const cloudColors = [
      "rgba(139, 92, 246, ", // Purple
      "rgba(219, 39, 119, ", // Deep Pink / Magenta
      "rgba(6, 182, 212, "   // Cyan
    ];

    for (let i = 0; i < numClouds; i++) {
      const r = R * 0.12 + Math.pow(Math.random(), 1.1) * (R * 0.88);
      const arm = Math.floor(Math.random() * numArms);
      const spiralOffset = arm * (Math.PI * 2 / numArms);
      const theta = Math.random() * Math.PI * 2;
      const orbitSpeed = 0.0006 + (0.0012 * (R / r));
      const size = 20 + Math.random() * 26;
      const alpha = 0.04 + Math.random() * 0.07;
      const color = cloudColors[Math.floor(Math.random() * cloudColors.length)];

      nebulae.push({
        r,
        spiralOffset,
        theta,
        orbitSpeed,
        x3d: r * Math.cos(theta + spiralOffset),
        y3d: (Math.random() - 0.5) * (R * 0.06) * (1 - r / R),
        z3d: r * Math.sin(theta + spiralOffset),
        size,
        color,
        alpha
      });
    }

    // Relativistic Jet Streams (shooting perpendicular along Y-axis from core)
    const jets: JetParticle[] = [];
    const maxJets = 120;

    const spawnJet = () => {
      const direction = Math.random() > 0.5 ? 1 : -1;
      const size = 0.8 + Math.random() * 1.6;
      const speed = 1.6 + Math.random() * 2.2;
      const color = Math.random() > 0.6 ? "rgba(103, 232, 249, " : "rgba(255, 255, 255, ";

      jets.push({
        lx: (Math.random() - 0.5) * 8,
        ly: 0,
        lz: (Math.random() - 0.5) * 8,
        speed,
        size,
        color,
        alpha: 0.9,
        direction
      });
    };

    // Pre-populate some jet particles
    for (let i = 0; i < maxJets / 2; i++) {
      const direction = Math.random() > 0.5 ? 1 : -1;
      const size = 0.8 + Math.random() * 1.6;
      const speed = 1.6 + Math.random() * 2.2;
      const color = Math.random() > 0.6 ? "rgba(103, 232, 249, " : "rgba(255, 255, 255, ";
      const ly = Math.random() * R * 0.6 * direction;
      jets.push({
        lx: (Math.random() - 0.5) * 8,
        ly,
        lz: (Math.random() - 0.5) * 8,
        speed,
        size,
        color,
        alpha: 0.9 * (1 - Math.abs(ly) / (R * 0.6)),
        direction
      });
    }

    // Parallax background stars (placed at distance, rotation scaled down)
    const bgStars: BgStar[] = [];
    const numBgStars = 150;
    for (let i = 0; i < numBgStars; i++) {
      const angle1 = Math.random() * Math.PI * 2;
      const angle2 = Math.random() * Math.PI - Math.PI / 2;
      const distance = R * 1.8 + Math.random() * R;
      const x = distance * Math.cos(angle1) * Math.cos(angle2);
      const y = distance * Math.sin(angle2);
      const z = distance * Math.sin(angle1) * Math.cos(angle2);
      bgStars.push({
        x,
        y,
        z,
        size: 0.4 + Math.random() * 0.9,
        alpha: 0.2 + Math.random() * 0.6,
        color: Math.random() > 0.5 ? "rgba(167, 139, 250, " : "rgba(255, 255, 255, "
      });
    }

    // Interactive black hole & supernova structures
    interface CosmicEvent {
      type: "blackhole" | "supernova";
      x: number;
      y: number;
      z: number;
      age: number;
      maxAge: number;
      color: string;
      particles: {
        x: number;
        y: number;
        z: number;
        vx: number;
        vy: number;
        vz: number;
        size: number;
        color: string;
        alpha: number;
      }[];
    }
    const cosmicEvents: CosmicEvent[] = [];

    const triggerBlackHole = (sx: number, sy: number, sz: number) => {
      // Pull strength event
      cosmicEvents.push({
        type: "blackhole",
        x: sx,
        y: sy,
        z: sz,
        age: 0,
        maxAge: 200,
        color: "rgba(139, 92, 246, ",
        particles: []
      });
    };

    const triggerSupernova = (sx: number, sy: number, sz: number) => {
      // Exploding particles
      const particles = [];
      const numP = 25;
      const colors = ["rgba(103, 232, 249, ", "rgba(167, 139, 250, ", "rgba(255, 255, 255, "];

      for (let i = 0; i < numP; i++) {
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        const velocity = 2.0 + Math.random() * 4.0;
        particles.push({
          x: sx,
          y: sy,
          z: sz,
          vx: Math.cos(phi) * Math.sin(theta) * velocity,
          vy: Math.cos(theta) * velocity,
          vz: Math.sin(phi) * Math.sin(theta) * velocity,
          size: 1.0 + Math.random() * 2.0,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1.0
        });
      }

      cosmicEvents.push({
        type: "supernova",
        x: sx,
        y: sy,
        z: sz,
        age: 0,
        maxAge: 45,
        color: Math.random() > 0.5 ? "rgba(6, 182, 212, " : "rgba(139, 92, 246, ",
        particles
      });
    };

    // Astrolabe Surveyor Mouse State
    let mouseX = -1000;
    let mouseY = -1000;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.closest("button") ||
          target.closest("a") ||
          target.closest("input") ||
          target.closest("form"))
      ) {
        return;
      }

      // Check if clicked close to center (R * 0.1) for black hole, otherwise supernova
      const centerX = width / 2;
      const centerY = height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < R * 0.25) {
        // Trigger black hole at core
        triggerBlackHole(0, 0, 0);
      } else {
        // Trigger supernova at click coordinate projected to Z=0 plane roughly
        const scale = fov / 800; // rough fov estimate
        const pX = (e.clientX - centerX) / scale;
        const pY = (e.clientY - centerY) / scale;
        triggerSupernova(pX, pY, 0);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);

    // 3D Matrix/Rotation Config
    const fov = 850;
    let baseAngleY = 0;
    let baseAngleX = 0.58; // tilted perspective

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Slow orbit rotation
      baseAngleY += 0.0016;

      // Oscillate camera angle slightly to highlight depth
      const waveAngleX = baseAngleX + Math.sin(Date.now() * 0.0006) * 0.06;
      const waveAngleY = baseAngleY;

      const cosX = Math.cos(waveAngleX);
      const sinX = Math.sin(waveAngleX);
      const cosY = Math.cos(waveAngleY);
      const sinY = Math.sin(waveAngleY);

      // Handle relativistic jet spawns
      if (jets.length < maxJets) {
        spawnJet();
      }

      // Physics interactions with events (Gravity pulls and shockwaves)
      cosmicEvents.forEach((ev) => {
        ev.age++;

        if (ev.type === "blackhole") {
          const force = 12.5 * (1 - ev.age / ev.maxAge);
          // Pull all stars towards gravity center
          stars.forEach((s) => {
            const dx = ev.x - s.x3d;
            const dy = ev.y - s.y3d;
            const dz = ev.z - s.z3d;
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
            if (dist < R * 0.95) {
              const pull = (1 - dist / (R * 0.95)) * force * 0.08;
              s.vx += (dx / dist) * pull;
              s.vy += (dy / dist) * pull;
              s.vz += (dz / dist) * pull;
            }
          });

          // Trigger supernova when blackhole collapses
          if (ev.age === ev.maxAge - 1) {
            triggerSupernova(ev.x, ev.y, ev.z);
          }
        } 
        else if (ev.type === "supernova") {
          // Push stars away
          const force = 22.0 * (1 - ev.age / ev.maxAge);
          stars.forEach((s) => {
            const dx = s.x3d - ev.x;
            const dy = s.y3d - ev.y;
            const dz = s.z3d - ev.z;
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
            if (dist < R * 0.6) {
              const push = (1 - dist / (R * 0.6)) * force * 0.12;
              s.vx += (dx / dist) * push;
              s.vy += (dy / dist) * push;
              s.vz += (dz / dist) * push;
            }
          });
        }
      });

      // Filter expired events
      for (let i = cosmicEvents.length - 1; i >= 0; i--) {
        if (cosmicEvents[i].age >= cosmicEvents[i].maxAge) {
          cosmicEvents.splice(i, 1);
        }
      }

      // Container for rendering depth sorted items
      interface RenderItem {
        type: "star" | "nebula" | "jet" | "event_particle";
        px: number;
        py: number;
        scale: number;
        zDepth: number;
        size: number;
        color: string;
        alpha: number;
        starRef?: Star;
      }

      const renderList: RenderItem[] = [];

      // 1. Project Background Stars (Parallax, rotates at 12% speed, no tilt sway)
      const cosBg = Math.cos(waveAngleY * 0.12);
      const sinBg = Math.sin(waveAngleY * 0.12);
      bgStars.forEach((b) => {
        // Orbit rotation
        const rx = b.x * cosBg - b.z * sinBg;
        const rz = b.x * sinBg + b.z * cosBg;
        // Projection (Z offset to background)
        const zDepth = rz + fov * 1.5;
        const scale = fov / zDepth;
        const px = centerX + rx * scale;
        const py = centerY + b.y * scale;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          renderList.push({
            type: "star",
            px,
            py,
            scale,
            zDepth,
            size: b.size,
            color: b.color,
            alpha: b.alpha
          });
        }
      });

      // 2. Project Core & Arm Stars
      stars.forEach((s) => {
        // Apply physics velocity offsets
        s.x3d += s.vx;
        s.y3d += s.vy;
        s.z3d += s.vz;

        // Apply orbital rotation update
        s.theta += s.orbitSpeed;
        const localX = s.r * Math.cos(s.theta + s.spiralOffset) + (s.x3d - s.r * Math.cos(s.theta + s.spiralOffset));
        const localZ = s.r * Math.sin(s.theta + s.spiralOffset) + (s.z3d - s.r * Math.sin(s.theta + s.spiralOffset));

        // Drag/friction towards default orbit
        s.vx *= 0.90;
        s.vy *= 0.90;
        s.vz *= 0.90;

        // Perform camera rotation mapping (around Y, then X)
        const rx1 = localX * cosY - localZ * sinY;
        const rz1 = localX * sinY + localZ * cosY;
        
        const ry2 = s.y3d * cosX - rz1 * sinX;
        const rz2 = s.y3d * sinX + rz1 * cosX;

        const zDepth = rz2 + fov;
        const scale = fov / Math.max(10, zDepth);
        const px = centerX + rx1 * scale;
        const py = centerY + ry2 * scale;

        if (rz2 > -fov * 0.8) {
          renderList.push({
            type: "star",
            px,
            py,
            scale,
            zDepth,
            size: s.size,
            color: s.color,
            alpha: s.alpha,
            starRef: s
          });
        }
      });

      // 3. Project Nebula Gas Clouds
      nebulae.forEach((n) => {
        n.theta += n.orbitSpeed;
        const localX = n.r * Math.cos(n.theta + n.spiralOffset);
        const localZ = n.r * Math.sin(n.theta + n.spiralOffset);

        const rx1 = localX * cosY - localZ * sinY;
        const rz1 = localX * sinY + localZ * cosY;
        const ry2 = n.y3d * cosX - rz1 * sinX;
        const rz2 = n.y3d * sinX + rz1 * cosX;

        const zDepth = rz2 + fov;
        const scale = fov / Math.max(10, zDepth);
        const px = centerX + rx1 * scale;
        const py = centerY + ry2 * scale;

        if (rz2 > -fov * 0.85) {
          renderList.push({
            type: "nebula",
            px,
            py,
            scale,
            zDepth,
            size: n.size,
            color: n.color,
            alpha: n.alpha
          });
        }
      });

      // 4. Project relativistic Jet particles
      for (let i = jets.length - 1; i >= 0; i--) {
        const j = jets[i];
        j.ly += j.speed * j.direction;

        // Fade out as height increases
        j.alpha = 0.95 * (1 - Math.abs(j.ly) / (R * 0.65));

        // Delete when too high
        if (Math.abs(j.ly) > R * 0.65 || j.alpha <= 0.05) {
          jets.splice(i, 1);
          continue;
        }

        // Apply same rotation maps
        const rx1 = j.lx * cosY - j.lz * sinY;
        const rz1 = j.lx * sinY + j.lz * cosY;
        const ry2 = j.ly * cosX - rz1 * sinX;
        const rz2 = j.ly * sinX + rz1 * cosX;

        const zDepth = rz2 + fov;
        const scale = fov / Math.max(10, zDepth);
        const px = centerX + rx1 * scale;
        const py = centerY + ry2 * scale;

        if (rz2 > -fov * 0.8) {
          renderList.push({
            type: "jet",
            px,
            py,
            scale,
            zDepth,
            size: j.size,
            color: j.color,
            alpha: j.alpha
          });
        }
      }

      // 5. Project cosmic event particles (supernova explosions)
      cosmicEvents.forEach((ev) => {
        if (ev.type === "supernova") {
          const ageRatio = ev.age / ev.maxAge;
          const alpha = 1.0 - ageRatio;

          ev.particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.z += p.vz;
            p.vx *= 0.97;
            p.vy *= 0.97;
            p.vz *= 0.97;

            const rx1 = p.x * cosY - p.z * sinY;
            const rz1 = p.x * sinY + p.z * cosY;
            const ry2 = p.y * cosX - rz1 * sinX;
            const rz2 = p.y * sinX + rz1 * cosX;

            const zDepth = rz2 + fov;
            const scale = fov / Math.max(10, zDepth);
            const px = centerX + rx1 * scale;
            const py = centerY + ry2 * scale;

            if (rz2 > -fov * 0.8) {
              renderList.push({
                type: "event_particle",
                px,
                py,
                scale,
                zDepth,
                size: p.size,
                color: p.color,
                alpha: alpha * p.alpha
              });
            }
          });
        }
      });

      // Z-Buffer Depth Sorting: draw from back (highest zDepth) to front (lowest zDepth)
      renderList.sort((a, b) => b.zDepth - a.zDepth);

      // Render all items
      renderList.forEach((item) => {
        const finalAlpha = Math.max(0, Math.min(1.0, item.alpha * (item.scale * 1.1)));
        if (finalAlpha <= 0) return;

        if (item.type === "star") {
          const size = Math.max(0.1, item.size * item.scale);
          ctx.fillStyle = `${item.color}${finalAlpha})`;
          ctx.beginPath();
          ctx.arc(item.px, item.py, size, 0, Math.PI * 2);
          ctx.fill();
        } 
        else if (item.type === "nebula") {
          const size = Math.max(2, item.size * item.scale);
          ctx.save();
          ctx.globalCompositeOperation = "screen";

          const cloudGrad = ctx.createRadialGradient(item.px, item.py, 0, item.px, item.py, size);
          cloudGrad.addColorStop(0, `${item.color}${finalAlpha * 0.95})`);
          cloudGrad.addColorStop(0.4, `${item.color}${finalAlpha * 0.4})`);
          cloudGrad.addColorStop(1.0, "rgba(0, 0, 0, 0)");

          ctx.fillStyle = cloudGrad;
          ctx.beginPath();
          ctx.arc(item.px, item.py, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } 
        else if (item.type === "jet") {
          const size = Math.max(0.2, item.size * item.scale);
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          
          ctx.fillStyle = `${item.color}${finalAlpha * 0.8})`;
          ctx.beginPath();
          ctx.arc(item.px, item.py, size, 0, Math.PI * 2);
          ctx.fill();

          if (item.size > 1.4) {
            ctx.shadowColor = "#67e8f9";
            ctx.shadowBlur = 4;
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.beginPath();
            ctx.arc(item.px, item.py, size * 0.45, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
        else if (item.type === "event_particle") {
          const size = Math.max(0.2, item.size * item.scale);
          ctx.fillStyle = `${item.color}${finalAlpha * 0.9})`;
          ctx.beginPath();
          ctx.arc(item.px, item.py, size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 6. Draw central accretion core glow (bulge light bloom)
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, R * 0.4);
      coreGrad.addColorStop(0, "rgba(255, 250, 230, 0.38)");
      coreGrad.addColorStop(0.18, "rgba(255, 204, 0, 0.2)");
      coreGrad.addColorStop(0.42, "rgba(219, 39, 119, 0.08)"); // Pink nebulae haze
      coreGrad.addColorStop(0.75, "rgba(139, 92, 246, 0.02)");
      coreGrad.addColorStop(1.0, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, R * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 7. Draw cosmic event overlays (expanding rings/lines)
      cosmicEvents.forEach((ev) => {
        const ageRatio = ev.age / ev.maxAge;
        const alpha = 1.0 - ageRatio;

        const rx1 = ev.x * cosY - ev.z * sinY;
        const rz1 = ev.x * sinY + ev.z * cosY;
        const ry2 = ev.y * cosX - rz1 * sinX;
        const rz2 = ev.y * sinX + rz1 * cosX;

        if (rz2 > -fov * 0.8) {
          const scale = fov / Math.max(10, rz2 + fov);
          const px = centerX + rx1 * scale;
          const py = centerY + ry2 * scale;

          if (ev.type === "supernova") {
            const ringRad = ageRatio * R * 0.75 * scale;
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
            ctx.shadowColor = "#a78bfa";
            ctx.shadowBlur = 18 * alpha;
            ctx.lineWidth = 5 * alpha * scale;
            ctx.beginPath();
            ctx.arc(px, py, ringRad, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = ev.color + `${alpha * 0.45})`;
            ctx.lineWidth = 12 * alpha * scale;
            ctx.beginPath();
            ctx.arc(px, py, ringRad, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            ctx.shadowBlur = 0;
          } 
          else if (ev.type === "blackhole") {
            // Draw space time collapsing grid lines around center
            const rings = 4;
            ctx.save();
            ctx.strokeStyle = `rgba(167, 139, 250, ${alpha * 0.7})`;
            ctx.lineWidth = 0.8 * scale;
            for (let r = 1; r <= rings; r++) {
              const radius = (1 - ageRatio) * R * 0.3 * (r / rings) * scale;
              ctx.beginPath();
              ctx.arc(px, py, radius, 0, Math.PI * 2);
              ctx.stroke();
            }
            ctx.restore();
          }
        }
      });

      // 8. Draw Astrolabe Cursor Reticle (surveyor locking system)
      if (mouseX > 0 && mouseY > 0 && mouseX < width && mouseY < height) {
        ctx.strokeStyle = "#a78bfa";
        ctx.lineWidth = 0.85;
        ctx.shadowColor = "#c4b5fd";
        ctx.shadowBlur = 6;

        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 26, 0, Math.PI * 2);
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.moveTo(mouseX - 34, mouseY); ctx.lineTo(mouseX - 26, mouseY);
        ctx.moveTo(mouseX + 26, mouseY); ctx.lineTo(mouseX + 34, mouseY);
        ctx.moveTo(mouseX, mouseY - 34); ctx.lineTo(mouseX, mouseY - 26);
        ctx.moveTo(mouseX, mouseY + 26); ctx.lineTo(mouseX, mouseY + 34);
        ctx.stroke();

        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Match stars
        const distances = renderList
          .filter((item) => item.type === "star" && item.starRef)
          .map((item) => {
            const dx = item.px - mouseX;
            const dy = item.py - mouseY;
            return {
              item,
              dist: Math.sqrt(dx*dx + dy*dy)
            };
          });

        const candidates = distances
          .filter((d) => d.dist < 130)
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 3);

        candidates.forEach((cand) => {
          const alpha = (1 - cand.dist / 130) * 0.7;
          ctx.strokeStyle = `rgba(167, 139, 250, ${alpha * 0.4})`;
          ctx.beginPath();
          ctx.moveTo(cand.item.px, cand.item.py);
          ctx.lineTo(mouseX, mouseY);
          ctx.stroke();

          const bSize = 3.5;
          ctx.strokeStyle = `rgba(103, 232, 249, ${alpha * 0.7})`;
          ctx.strokeRect(cand.item.px - bSize, cand.item.py - bSize, bSize * 2, bSize * 2);

          ctx.font = "6.5px monospace";
          ctx.fillStyle = `rgba(167, 139, 250, ${alpha})`;
          const starId = Math.abs(Math.floor((cand.item.starRef?.r || 0) * 1.5)) + 100;
          ctx.fillText(`STAR_K_${starId}`, cand.item.px + bSize + 3, cand.item.py - 2);
        });

        ctx.font = "7px monospace";
        ctx.fillStyle = "rgba(103, 232, 249, 0.85)";
        ctx.textAlign = "center";
        ctx.fillText("COSMIC_SURVEYOR_ACTIVE", mouseX, mouseY - 42);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {/* photographic Milky Way backdrop */}
      <div 
        className="absolute inset-0 bg-[url('/images/milky-way-bg.png')] bg-cover bg-center opacity-65 select-none scale-[1.03]" 
        style={{ pointerEvents: "none" }}
      />
      {/* Soft gradient blends to keep the UI text clean & legible */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/75 pointer-events-none mix-blend-multiply" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  );
}
