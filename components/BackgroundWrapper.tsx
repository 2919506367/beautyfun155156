"use client";

import { usePathname } from "next/navigation";
import ParticleBackground from "@/components/ParticleBackground";

export default function BackgroundWrapper() {
  const pathname = usePathname();

  if (pathname === "/login") {
    return null;
  }

  return (
    <>
      <div className="bf-app-bg-layer" aria-hidden="true" />
      <div className="bf-app-mesh" aria-hidden="true" />
      <div className="bf-app-noise" aria-hidden="true" />
      <div className="bf-app-orb bf-orb-1" aria-hidden="true" />
      <div className="bf-app-orb bf-orb-2" aria-hidden="true" />
      <div className="bf-app-orb bf-orb-3" aria-hidden="true" />
      <canvas className="bf-particles-canvas" aria-hidden="true" id="bf-particle-canvas" />
      <ParticleBackground />
    </>
  );
}
