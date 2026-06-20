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

    // Vertical lines (straight lights)
    const lines: any[] = [];
    for (let i = 0; i < 50; i++) {
      lines.push({
        x: Math.random() * window.innerWidth, // Initial X position
        speed: (Math.random() * 1 + 0.5) * (Math.random() > 0.5 ? 1 : -1), // Slower horizontal drift
        thickness: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.1
      });
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      
      // Redistribute lines randomly on resize so they fill the new width
      lines.forEach(line => {
        line.x = Math.random() * width;
      });
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

      // Draw straight vertical lights
      ctx.lineCap = "round";
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Calculate X position with drift, wrap around screen edges
        let currentX = (line.x + time * 10 * line.speed) % width;
        if (currentX < 0) currentX += width;
        
        ctx.beginPath();
        ctx.moveTo(currentX, 0);
        ctx.lineTo(currentX, height);

        // Optional: dynamic opacity breathing effect based on time and index
        const breathingOpacity = line.opacity + Math.sin(time * 0.5 + i) * 0.1;
        const finalOpacity = Math.max(0.05, Math.min(0.8, breathingOpacity));

        ctx.strokeStyle = `rgba(255, 0, 0, ${finalOpacity})`;
        ctx.lineWidth = line.thickness;
        ctx.stroke();
      }

      // Draw animated welcome text
      const isMobile = width < 1024;
      
      if (!isMobile) {
        const px = width * 0.25;
        const py = height / 2;
        
        ctx.save();
        
        // Dark black background as large as login form (approx 480x580)
        ctx.shadowBlur = 60;
        ctx.shadowColor = "rgba(255, 0, 0, 0.6)";
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.95)"; // Dark black
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(px - 240, py - 290, 480, 580, 20);
        } else {
          ctx.rect(px - 240, py - 290, 480, 580);
        }
        ctx.fill();
        
        // Red inner border
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255, 0, 0, 0.4)";
        ctx.stroke();

        // Text shadow
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(255, 0, 0, 0.8)";
        
        ctx.textBaseline = "middle";

        // Very large code font
        ctx.font = "bold 64px 'Courier New', monospace";
        
        // Typewriter animation (Slow, no repeat, only CYBERKAVACH CLUB)
        const fullText = "CYBERKAVACH\\nCLUB";
        const charsPerTick = 3.5; // Slower speed
        const currentTick = Math.floor(time * charsPerTick);
        const visibleChars = Math.min(currentTick, fullText.length);
        
        let currentText = fullText.substring(0, visibleChars);
        
        // Blinking cursor
        const showCursor = Math.floor(time * 5) % 2 === 0;
        if (visibleChars < fullText.length || showCursor) {
          currentText += "_";
        }
        
        const linesText = currentText.split('\\n');
        const fullLines = fullText.split('\\n');
        
        // Center the text block vertically
        const lineHeight = 80;
        const startY = py - 60 - ((linesText.length - 1) * lineHeight) / 2; // Shifted up slightly to make room
        
        // Hollow text (stroke)
        ctx.strokeStyle = "#ff003c";
        ctx.lineWidth = 2;
        
        ctx.textAlign = "left"; // Use left alignment so text doesn't shift
        
        linesText.forEach((lineText, index) => {
          // Measure the full line width to calculate a static centered start X
          // For the last line, we might have the cursor, so measure the full line + cursor width if needed.
          // To keep it simple, just measure the full static word.
          const fullWidth = ctx.measureText(fullLines[index]).width;
          const startX = px - fullWidth / 2;
          
          ctx.strokeText(lineText, startX, startY + index * lineHeight);
        });
        
        // ─── BOTTOM ULTRA SONIC FINGERPRINT SCANNER ───
        
        const scanX = px;
        const scanY = py + 150; // Positioned at the bottom of the black frame
        
        ctx.save();
        
        // 1. Tech Scanner Brackets (replacing the water effect)
        ctx.strokeStyle = "rgba(255, 0, 60, 0.8)";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(255, 0, 60, 0.5)";
        ctx.lineWidth = 3;
        const boxSize = 45;
        const cornerLen = 15;
        
        // Top-left
        ctx.beginPath(); ctx.moveTo(scanX - boxSize, scanY - boxSize + cornerLen); ctx.lineTo(scanX - boxSize, scanY - boxSize); ctx.lineTo(scanX - boxSize + cornerLen, scanY - boxSize); ctx.stroke();
        // Top-right
        ctx.beginPath(); ctx.moveTo(scanX + boxSize - cornerLen, scanY - boxSize); ctx.lineTo(scanX + boxSize, scanY - boxSize); ctx.lineTo(scanX + boxSize, scanY - boxSize + cornerLen); ctx.stroke();
        // Bottom-left
        ctx.beginPath(); ctx.moveTo(scanX - boxSize, scanY + boxSize - cornerLen); ctx.lineTo(scanX - boxSize, scanY + boxSize); ctx.lineTo(scanX - boxSize + cornerLen, scanY + boxSize); ctx.stroke();
        // Bottom-right
        ctx.beginPath(); ctx.moveTo(scanX + boxSize - cornerLen, scanY + boxSize); ctx.lineTo(scanX + boxSize, scanY + boxSize); ctx.lineTo(scanX + boxSize, scanY + boxSize - cornerLen); ctx.stroke();

        // 2. Abstract fingerprint base (Red techy ridges)
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(255, 0, 60, 0.8)";
        ctx.strokeStyle = "rgba(255, 0, 60, 0.4)";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";

        for (let i = 1; i <= 7; i++) {
          ctx.beginPath();
          // Draw full ellipses for the fingerprint
          ctx.ellipse(scanX, scanY + 5, i * 4.5, i * 6.5, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // 3. Scanning laser sweeper
        const laserY = scanY + 5 + Math.sin(time * 3) * 45;
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(255, 255, 255, 1)"; // Bright white/red glow
        ctx.strokeStyle = "rgba(255, 0, 60, 1)";
        ctx.beginPath();
        ctx.moveTo(scanX - boxSize + 5, laserY);
        ctx.lineTo(scanX + boxSize - 5, laserY);
        ctx.lineWidth = 3;
        ctx.stroke();

        // 4. Laser scan fade trail
        const trailDirection = Math.sign(Math.cos(time * 3));
        const trailY = laserY - trailDirection * 15;
        const gradientLaser = ctx.createLinearGradient(0, laserY, 0, trailY);
        gradientLaser.addColorStop(0, "rgba(255, 0, 60, 0.4)");
        gradientLaser.addColorStop(1, "rgba(255, 0, 60, 0)");
        
        ctx.fillStyle = gradientLaser;
        ctx.fillRect(scanX - boxSize + 5, Math.min(laserY, trailY), boxSize * 2 - 10, Math.abs(laserY - trailY));

        ctx.restore();
        // ──────────────────────────────────────────────
        
        ctx.restore();
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
