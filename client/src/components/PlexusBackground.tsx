"use client";

import React, { useEffect, useRef } from "react";

interface Particle {
  x: number; // 3D X
  y: number; // 3D Y
  z: number; // 3D Z
  clusterId: number; // The cluster this particle belongs to
  clusterOffsetX: number; // Relative X to cluster center
  clusterOffsetY: number; // Relative Y to cluster center
  clusterOffsetZ: number; // Relative Z to cluster center
  isSuperNode: boolean; // Super-connected node (thick, bright, long lines)
  offsetX: number; // Mouse repulsion offset X
  offsetY: number; // Mouse repulsion offset Y
}

interface ClusterCenter {
  x: number;
  y: number;
  z: number;
}

function drawLightning(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  opacity: number,
  isSuper: boolean
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Divide distance into segments for jagged lightning
  const segments = Math.max(3, Math.floor(dist / 25));

  // Perpendicular unit vector
  const nx = -dy / dist;
  const ny = dx / dist;

  ctx.beginPath();
  ctx.moveTo(x1, y1);

  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const bx = x1 + dx * t;
    const by = y1 + dy * t;

    // Lightning displacement
    const factor = Math.sin(t * Math.PI);
    const maxDisplacement = isSuper ? 12 : 4;
    const displacement = (Math.random() - 0.5) * maxDisplacement * factor;

    const sx = bx + nx * displacement;
    const sy = by + ny * displacement;

    ctx.lineTo(sx, sy);
  }

  ctx.lineTo(x2, y2);

  // Lightning edge style
  ctx.strokeStyle = `rgba(255, 0, 0, ${isSuper ? opacity * 0.9 : opacity * 0.4})`;
  ctx.lineWidth = isSuper ? 3.0 : 1.5;
  ctx.stroke();

  if (isSuper) {
    // Sharp hot core for lightning
    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
    ctx.lineWidth = 1.0;
    ctx.stroke();
  }
}

export default function PlexusBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    // Check reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mediaQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mediaQuery.addEventListener("change", handleMotionChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let angle = 0; // spiral vortex angle

    // Plexus Configuration
    const numParticles = 400; // Optimized density to guarantee no freezing or mess
    const numClusters = 10; // More clusters to spread across the screen
    const maxZ = 1000;
    const fov = 400; // Perspective FOV
    const speed = 3.5; // Dynamic Z speed
    const repulsionRadius = 250; // Cursor interaction area
    const repulsionForce = 200; // Cursor warp push
    const lerpSpeed = 0.08;
    
    // Line distances
    const normalLineThreshold = 200; // Short connection within same cluster
    const superLineThreshold = 1200; // Massive cross-cluster connection

    const particles: Particle[] = [];
    const clusterCenters: ClusterCenter[] = [];

    // Initialize Cluster Centers in 3D space
    for (let c = 0; c < numClusters; c++) {
      clusterCenters.push({
        x: (Math.random() - 0.5) * width * 2.0,
        y: (Math.random() - 0.5) * height * 2.0,
        z: Math.random() * maxZ,
      });
    }

    // Initialize particles and assign them to clusters
    for (let i = 0; i < numParticles; i++) {
      const clusterId = i % numClusters;
      // Spread particles very widely to fill the background like a network
      const clusterOffsetX = (Math.random() - 0.5) * 1200;
      const clusterOffsetY = (Math.random() - 0.5) * 1200;
      const clusterOffsetZ = (Math.random() - 0.5) * 600;

      // Assign a few particles as "Super-Nodes"
      // These will build long, thick, extremely bright connections across clusters
      const isSuperNode = i % 25 === 0;

      particles.push({
        x: 0,
        y: 0,
        z: 0,
        clusterId,
        clusterOffsetX,
        clusterOffsetY,
        clusterOffsetZ,
        isSuperNode,
        offsetX: 0,
        offsetY: 0,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
      mouseRef.current.active = false;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    // Animation Loop
    const animate = () => {
      if (reducedMotionRef.current) {
        // Reduced motion: static fallback
        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        ctx.fillRect(0, 0, width, height);

        // Draw basic static connection lines & dots
        ctx.strokeStyle = "rgba(255, 0, 0, 0.15)";
        ctx.fillStyle = "rgba(255, 0, 0, 0.4)";
        particles.forEach((p, idx) => {
          const center = clusterCenters[p.clusterId];
          const zDepth = (center.z + p.clusterOffsetZ) || 400;
          const px = ((center.x + p.clusterOffsetX) / zDepth) * fov + width / 2;
          const py = ((center.y + p.clusterOffsetY) / zDepth) * fov + height / 2;
          if (px >= 0 && px <= width && py >= 0 && py <= height) {
            ctx.beginPath();
            ctx.arc(px, py, p.isSuperNode ? 4 : 2, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        return;
      }

      // Clear canvas (transparent to let main black background shine)
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;
      angle += 0.002; // Slow spiral vortex angle
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      // Update Cluster Centers (Move Z forward)
      for (let c = 0; c < numClusters; c++) {
        const center = clusterCenters[c];
        center.z -= speed;
        if (center.z <= 10) {
          center.z = maxZ;
          center.x = (Math.random() - 0.5) * width * 1.5;
          center.y = (Math.random() - 0.5) * height * 1.5;
        }
      }

      // 1. Project particles
      const projected: { 
        drawX: number; 
        drawY: number; 
        opacity: number; 
        isSuperNode: boolean; 
        clusterId: number; 
        z: number;
      }[] = [];

      for (let i = 0; i < numParticles; i++) {
        const p = particles[i];
        const center = clusterCenters[p.clusterId];

        // 3D coordinates based on cluster center + offset
        const rawX = center.x + p.clusterOffsetX;
        const rawY = center.y + p.clusterOffsetY;
        const rawZ = center.z + p.clusterOffsetZ;

        // Prevent division by zero and wrap Z smoothly
        const zVal = rawZ <= 10 ? rawZ + maxZ : rawZ;

        // Perspective projection
        let px = (rawX / zVal) * fov;
        let py = (rawY / zVal) * fov;

        // Dynamic vortex rotation around center of screen
        const rotX = px * cosAngle - py * sinAngle + width / 2;
        const rotY = px * sinAngle + py * cosAngle + height / 2;
        px = rotX;
        py = rotY;

        // Mouse interaction (repulsion)
        let targetOffsetX = 0;
        let targetOffsetY = 0;

        if (mouse.active) {
          const dx = px - mouse.x;
          const dy = py - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < repulsionRadius) {
            const force = (repulsionRadius - dist) / repulsionRadius;
            const angleDist = dist || 1;
            targetOffsetX = (dx / angleDist) * force * repulsionForce;
            targetOffsetY = (dy / angleDist) * force * repulsionForce;
          }
        }

        // Smooth interpolation
        p.offsetX += (targetOffsetX - p.offsetX) * lerpSpeed;
        p.offsetY += (targetOffsetY - p.offsetY) * lerpSpeed;

        const drawX = px + p.offsetX;
        const drawY = py + p.offsetY;

        const opacity = (1 - zVal / maxZ) * 0.95;

        projected.push({
          drawX,
          drawY,
          opacity,
          isSuperNode: p.isSuperNode,
          clusterId: p.clusterId,
          z: zVal,
        });
      }

      // 2. Draw Connection Edges
      for (let i = 0; i < numParticles; i++) {
        const pA = projected[i];
        if (pA.drawX < 0 || pA.drawX > width || pA.drawY < 0 || pA.drawY > height) continue;

        let connections = 0;
        for (let j = i + 1; j < Math.min(i + 12, numParticles); j++) {
          if (connections >= 4) break; // Clean mesh topology limit

          const pB = projected[j];
          if (pB.drawX < 0 || pB.drawX > width || pB.drawY < 0 || pB.drawY > height) continue;

          const dx = pA.drawX - pB.drawX;
          const dy = pA.drawY - pB.drawY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Clean topology logic: only connect to very close neighbors to avoid a messy spiderweb
          const threshold = (pA.isSuperNode || pB.isSuperNode) ? 450 : 180;

          if (dist < threshold) {
            const proximityFactor = 1 - dist / threshold;
            const lineOpacity = proximityFactor * (pA.isSuperNode || pB.isSuperNode ? 0.95 : 0.65);
            drawLightning(ctx, pA.drawX, pA.drawY, pB.drawX, pB.drawY, lineOpacity, pA.isSuperNode || pB.isSuperNode);
            connections++;
          }
        }
      }

      // 3. Draw Nodes (Particles)
      for (let i = 0; i < numParticles; i++) {
        const p = projected[i];
        if (p.drawX < 0 || p.drawX > width || p.drawY < 0 || p.drawY > height) continue;

        // Super-nodes are larger
        const baseRadius = p.isSuperNode ? 4.5 : 2.5;
        const radius = Math.max(1.0, (1 - p.z / maxZ) * baseRadius * 2.5);

        // Sharp geometric nodes instead of large glows
        ctx.fillStyle = `rgba(255, 0, 0, ${p.opacity * 0.8})`;
        ctx.beginPath();
        ctx.arc(p.drawX, p.drawY, radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        if (p.isSuperNode) {
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
          ctx.beginPath();
          ctx.arc(p.drawX, p.drawY, radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none block z-10"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
