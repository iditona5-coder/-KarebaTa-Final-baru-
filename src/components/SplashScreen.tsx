import React, { useState, useEffect } from "react";
import { KarebaPinIcon } from "./KarebaTaLogo";

interface SplashScreenProps {
  durationMs?: number; // Default 2500ms (2.5 detik)
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  durationMs = 2500,
  onFinish,
}) => {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Jalankan animasi pengisian progress bar dari 0% ke 100%
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / (durationMs - 300)) * 100));
      setProgress(pct);
      if (elapsed >= durationMs - 300) {
        clearInterval(interval);
      }
    }, 25);

    // Mulai efek fade-out halus 350ms sebelum durasi berakhir
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, Math.max(0, durationMs - 350));

    // Selesaikan tampilan splash screen tepat pada waktu durasi
    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, durationMs);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [durationMs, onFinish]);

  return (
    <div
      id="karebata-splash-screen"
      className={`fixed inset-0 z-[999999] bg-white flex flex-col items-center justify-center p-6 select-none transition-all duration-350 ease-out ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-label="Layar Pembuka Kareba'Ta"
    >
      {/* Konten Logo Utama di Tengah */}
      <div className="flex flex-col items-center text-center">
        {/* Ikon Pin Emas Berhuruf K Bersih */}
        <div
          className="relative mb-5"
          style={{
            filter: "drop-shadow(0 10px 22px rgba(229, 160, 0, 0.38))",
          }}
        >
          <KarebaPinIcon size={88} />
        </div>

        {/* Nama Brand: Kareba'Ta dengan Font Poppins Asli */}
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

        {/* Batang Pemuatan (Loading Bar) Halus */}
        <div className="w-32 h-1.5 bg-neutral-100 rounded-full overflow-hidden shadow-inner border border-neutral-200/60 relative">
          <div
            className="h-full bg-gradient-to-r from-[#00632B] to-[#E5A000] rounded-full transition-all duration-75 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
