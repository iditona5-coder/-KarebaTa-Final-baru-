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

    // Mulai efek fade-out halus 400ms sebelum durasi berakhir
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, Math.max(0, durationMs - 400));

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
      className={`fixed inset-0 z-[999999] bg-white flex flex-col items-center justify-between py-12 px-6 select-none transition-all duration-400 ease-out ${
        isFading ? "opacity-0 scale-102 pointer-events-none" : "opacity-100 scale-100"
      }`}
      style={{
        WebkitFontSmoothing: "antialiased",
        touchAction: "none",
      }}
      aria-label="Layar Pembuka Kareba'Ta"
    >
      {/* Spacer Atas */}
      <div className="w-full flex justify-center pt-4">
        <span className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">
          Kareba'Ta Media Warga
        </span>
      </div>

      {/* Konten Utama di Tengah Sempurna */}
      <div className="flex flex-col items-center text-center animate-fade-in">
        {/* Ikon Pin Emas Berhuruf K Bersih & Beresolusi Kristal */}
        <div
          className="relative mb-5 transition-transform duration-700 ease-out"
          style={{
            filter: "drop-shadow(0 14px 28px rgba(229, 160, 0, 0.42))",
          }}
        >
          <KarebaPinIcon size={96} />
        </div>

        {/* Nama Brand: Kareba'Ta */}
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none mb-1.5 flex items-center justify-center">
          <span className="text-[#00632B]">Kareba'</span>
          <span className="text-[#E5A000]">Ta</span>
        </h1>

        {/* Slogan: BERITAMU, SUARAMU */}
        <p className="text-[12px] sm:text-[13px] font-extrabold tracking-[0.2em] text-[#E5A000] uppercase mb-8">
          BERITAMU, SUARAMU
        </p>

        {/* Batang Pemuatan (Loading Bar) Halus Berdurasi 2-3 Detik */}
        <div className="w-36 h-1.5 bg-neutral-100 rounded-full overflow-hidden shadow-inner border border-neutral-200/60 relative">
          <div
            className="h-full bg-gradient-to-r from-[#00632B] to-[#E5A000] rounded-full transition-all duration-75 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Bagian Bawah: Hak Cipta & Info Singkat */}
      <div className="flex flex-col items-center gap-1 text-center pb-2">
        <p className="text-[11px] font-semibold text-neutral-500">
          Kabar dan Momen Warga Terkini
        </p>
        <p className="text-[10px] text-neutral-400 font-medium">
          Versi 2.0 • Berbagi Informasi Cepat & Akurat
        </p>
      </div>
    </div>
  );
};
