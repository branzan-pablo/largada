"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Only show splash in standalone PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true;

    if (!isStandalone) {
      setVisible(false);
      return;
    }

    // Start fade-out after app has loaded
    const timer = setTimeout(() => setFadeOut(true), 800);
    const removeTimer = setTimeout(() => setVisible(false), 1300);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{ backgroundColor: "#FF4D00" }}
    >
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="splash-circle splash-circle-1" />
        <div className="splash-circle splash-circle-2" />
        <div className="splash-circle splash-circle-3" />
      </div>

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <Image
          src="/icons/icon-512.png"
          alt="Largada"
          width={120}
          height={120}
          className="rounded-3xl shadow-2xl"
          priority
        />
        <span
          className="text-3xl tracking-wider text-white"
          style={{ fontFamily: "var(--font-logo)" }}
        >
          LARGADA
        </span>
      </div>
    </div>
  );
}
