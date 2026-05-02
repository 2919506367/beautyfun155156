"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  pulse: number;
  pulseSpeed: number;
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = document.getElementById("bf-particle-canvas") as HTMLCanvasElement | null;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;

    canvas.width = w;
    canvas.height = h;

    const isDark = document.documentElement.classList.contains("dark-mode");

    function createParticles() {
      const count = Math.min(Math.floor((w * h) / 18000), 60);
      const particles: Particle[] = [];

      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2.5 + 0.5,
          opacity: Math.random() * 0.35 + 0.05,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.02 + 0.005,
        });
      }
      particlesRef.current = particles;
    }

    createParticles();

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;
      const dark = document.documentElement.classList.contains("dark-mode");

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;
        const currentOpacity = p.opacity + Math.sin(p.pulse) * 0.1;

        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = dark
          ? `rgba(180,200,255,${Math.max(0, Math.min(1, currentOpacity))})`
          : `rgba(79,110,247,${Math.max(0, Math.min(1, currentOpacity))})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            const lineOpacity = (1 - dist / 140) * 0.08;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = dark
              ? `rgba(160,190,255,${Math.max(0, Math.min(0.15, lineOpacity))})`
              : `rgba(79,110,247,${Math.max(0, Math.min(0.12, lineOpacity))})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    }

    draw();

    function handleResize() {
      w = window.innerWidth;
      h = window.innerHeight;
      if (canvas) {
        canvas.width = w;
        canvas.height = h;
      }
      createParticles();
    }

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return null;
}
