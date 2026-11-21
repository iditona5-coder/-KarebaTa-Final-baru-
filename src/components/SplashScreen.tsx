import React, { useState, useEffect, useRef } from "react";
import { KarebaPinIcon } from "./KarebaTaLogo";

interface SplashScreenProps {
  durationMs?: number;
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  durationMs = 1200,
  onFinish,
}) => {
  const [isFading, setIsFading] = useState(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, Math.max(0, durationMs - 200));

    const finishTimer = setTimeout(() => {
      if (onFinishRef.current) onFinishRef.current();
    }, durationMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [durationMs]);

  return (
    <div
      id="karebata-splash-screen"
      dir="ltr"
      className={`fixed inset-0 z-[999999] w-full h-[100dvh] box-border bg-white flex flex-col items-center justify-center p-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] select-none transition-opacity duration-200 ease-out ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-label="Layar Pembuka Kareba'Ta"
    >
      <div className="w-full max-w-[500px] mx-auto box-border flex flex-col items-center text-center">
        {/* Ikon Pin Emas Berhuruf K (sama persis dengan logo asli di beranda) */}
        <div className="relative mb-4 drop-shadow-md">
          <KarebaPinIcon size="clamp(68px, 20vw, 84px)" />
        </div>

        {/* Nama Brand & Font sama persis dengan KarebaTaLogo di beranda */}
        <h1
          className="text-[clamp(30px,9vw,48px)] font-black tracking-tight leading-none mb-2 whitespace-nowrap"
          style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
        >
          <span className="text-[#00632B]">Kareba&apos;</span>
          <span className="text-[#E5A000]">Ta</span>
        </h1>

        {/* Slogan Asli: BERITAMU, SUARAMU */}
        <p
          className="text-xs sm:text-[13px] font-extrabold tracking-[0.12em] text-[#E5A000] uppercase leading-none whitespace-nowrap"
          style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
        >
          beritamu, suaramu
        </p>
      </div>
    </div>
  );
};
