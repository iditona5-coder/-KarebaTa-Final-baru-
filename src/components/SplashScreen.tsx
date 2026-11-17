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

  const effectiveDuration = isStandalone ? Math.min(durationMs, 650) : durationMs;
  const [isFading, setIsFading] = useState(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, Math.max(0, effectiveDuration - 150));

    const finishTimer = setTimeout(() => {
      if (onFinishRef.current) onFinishRef.current();
    }, effectiveDuration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [effectiveDuration]);

  return (
    <div
      id="karebata-splash-screen"
      className={`fixed inset-0 z-[999999] w-full h-[100dvh] box-border bg-white flex flex-col items-center justify-center p-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] select-none transition-opacity duration-200 ease-out ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-label="Layar Pembuka Kareba'Ta"
    >
      <div className="w-full max-w-[500px] mx-auto box-border flex flex-col items-center text-center">
        {/* Ikon Pin Emas Berhuruf K */}
        <div className="relative mb-4 drop-shadow-md">
          <KarebaPinIcon size="clamp(68px, 20vw, 84px)" />
        </div>

        {/* Nama Brand: Kareba'Ta */}
        <h1
          className="text-[clamp(30px,9vw,48px)] font-[900] tracking-tight leading-none mb-1.5 flex items-center justify-center flex-wrap"
          style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
        >
          <span className="text-[#00632B]">Kareba'</span>
          <span className="text-[#E5A000]">Ta</span>
        </h1>

        {/* Slogan Asli: BERITAMU, SUARAMU */}
        <p
          className="text-xs sm:text-[13px] font-extrabold tracking-[0.16em] text-[#E5A000] uppercase"
          style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
        >
          BERITAMU, SUARAMU
        </p>
      </div>
    </div>
  );
};
