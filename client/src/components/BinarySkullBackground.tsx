"use client";

import React, { useEffect, useRef } from "react";

export function BinarySkullBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Initial mouse center
    mouseRef.current.x = width / 2;
    mouseRef.current.y = height / 2;

    // Load Exact Skull Image
    const skullImg = new Image();
    skullImg.src = "/images/login-skull.png";
    let imgLoaded = false;
    skullImg.onload = () => {
      imgLoaded = true;
    };

    // Circuit lines (waves)
    const lines: any[] = [];
    for (let i = 0; i < 150; i++) {
      lines.push({
        y: Math.random() * height,
        speed: (Math.random() * 2 + 1.5) * (Math.random() > 0.5 ? 1 : -1),
        offset: Math.random() * Math.PI * 2,
        length: Math.random() * width + width, // Covers whole screen length
        thickness: Math.random() * 3 + 1,
        opacity: Math.random() * 0.6 + 0.2
      });
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    let time = 0;
    let animationFrameId: number;
    let bgMouseX = width / 2;
    let bgMouseY = height / 2;

    const animate = () => {
      time += 0.05;

      bgMouseX += (mouseRef.current.x - bgMouseX) * 0.05;
      bgMouseY += (mouseRef.current.y - bgMouseY) * 0.05;

      // Dark red/black background
      ctx.fillStyle = "rgba(5, 0, 0, 1)";
      ctx.fillRect(0, 0, width, height);

      // Draw glowing background wave tracking mouse (Hover effect)
      const gradient = ctx.createRadialGradient(bgMouseX, bgMouseY, 0, bgMouseX, bgMouseY, Math.max(width, height) * 0.6);
      gradient.addColorStop(0, "rgba(255, 0, 0, 0.2)");
      gradient.addColorStop(0.5, "rgba(100, 0, 0, 0.05)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw Circuit Waves FIRST so they appear behind the skull
      ctx.lineCap = "round";
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        line.offset += 0.02;
        
        const waveY = line.y + Math.sin(line.offset + time) * 40;
        
        ctx.beginPath();
        const currentX = (time * 20 * line.speed) % (width + line.length);
        const startX = line.speed > 0 ? currentX - line.length : width - currentX;
        const endX = line.speed > 0 ? currentX : width - currentX + line.length;

        ctx.moveTo(startX, waveY);
        
        // Smooth sinusoidal progression
        const steps = 30;
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const px = startX + (endX - startX) * t;
          const py = waveY + Math.sin(px * 0.015 + time * 3 + line.offset) * 35;
          ctx.lineTo(px, py);
        }

        ctx.strokeStyle = `rgba(255, 0, 0, ${line.opacity})`;
        ctx.lineWidth = line.thickness;
        ctx.stroke();

        // Node dots at end of lines
        const dotX = line.speed > 0 ? endX : startX;
        const dotY = waveY + Math.sin(dotX * 0.015 + time * 3 + line.offset) * 35;

        ctx.beginPath();
        ctx.arc(dotX, dotY, line.thickness * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 100, 100, ${line.opacity * 2.0})`;
        ctx.fill();
      }

      // Draw exact image
      if (imgLoaded) {
        // Calculate size to fit well on the left
        const imgScale = Math.min(width * 0.4 / skullImg.width, height * 0.8 / skullImg.height);
        const drawWidth = skullImg.width * imgScale;
        const drawHeight = skullImg.height * imgScale;
        
        // Position on the left side (25% width)
        const px = width * 0.25 - drawWidth / 2;
        
        // Gentle floating animation
        const py = (height / 2 - drawHeight / 2) + Math.sin(time) * 10;
        
        // Draw image with a red glow behind it
        ctx.shadowBlur = 40;
        ctx.shadowColor = "rgba(255, 0, 0, 0.8)";
        ctx.drawImage(skullImg, px, py, drawWidth, drawHeight);
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
