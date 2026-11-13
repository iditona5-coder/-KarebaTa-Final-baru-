import React, { useState, useEffect, useRef } from "react";
import { KarebaPinIcon } from "./KarebaTaLogo";

interface SplashScreenProps {
  durationMs?: number; // Default 2000ms (2 detik)
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  durationMs = 1200,
  onFinish,
}) => {
  const isStandalone = typeof window !== "undefined" && (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes("android-app://") ||
    window.location.search.includes("source=pwa")
  );

  const initialPct = isStandalone ? 70 : 20;
  const effectiveDuration = isStandalone ? Math.min(durationMs, 450) : durationMs;
  const [progress, setProgress] = useState(initialPct);
  const [isFading, setIsFading] = useState(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round(initialPct + (elapsed / Math.max(1, effectiveDuration - 100)) * (100 - initialPct)));
      setProgress(pct);
      if (elapsed >= effectiveDuration - 100) {
        clearInterval(interval);
      }
    }, 16);

    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, Math.max(0, effectiveDuration - 150));

    const finishTimer = setTimeout(() => {
      if (onFinishRef.current) onFinishRef.current();
    }, effectiveDuration);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [effectiveDuration, initialPct]);

  return (
    <div
      id="karebata-splash-screen"
      className={`fixed inset-0 z-[999999] bg-white flex flex-col items-center justify-center p-6 select-none transition-opacity duration-300 ease-out ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-label="Layar Pembuka Kareba'Ta"
    >
      <div className="flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Ikon Pin Emas Berhuruf K */}
        <div
          className="relative mb-4 drop-shadow-md"
        >
          <KarebaPinIcon size={84} />
        </div>

        {/* Nama Brand: Kareba'Ta */}
        <h1
          className="text-4xl sm:text-5xl font-[900] tracking-tight leading-none mb-1.5 flex items-center justify-center"
          style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
        >
          <span className="text-[#00632B]">Kareba'</span>
          <span className="text-[#E5A000]">Ta</span>
        </h1>

        {/* Slogan Asli: BERITAMU, SUARAMU */}
        <p
          className="text-xs sm:text-[13px] font-extrabold tracking-[0.16em] text-[#E5A000] uppercase mb-8"
          style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
        >
          BERITAMU, SUARAMU
        </p>

        {/* Batang Pemuatan (Loading Bar) yang Berjalan Nyata */}
        <div className="w-44 h-2.5 bg-neutral-100 rounded-full overflow-hidden shadow-inner border border-neutral-200/90 relative">
          <div
            className="h-full bg-gradient-to-r from-[#00632B] via-emerald-500 to-[#E5A000] rounded-full transition-all duration-75 ease-out shadow-xs"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
