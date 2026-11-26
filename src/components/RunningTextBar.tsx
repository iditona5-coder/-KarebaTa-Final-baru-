import React, { useRef, useEffect, useCallback } from "react";

export interface BulletinItem {
  id: string;
  category: string;
  text: string;
  location?: string;
  time?: string;
}

interface RunningTextBarProps {
  announcements?: (string | BulletinItem)[];
}

const DEFAULT_ANNOUNCEMENTS: BulletinItem[] = [
  {
    id: "b-promo-1",
    category: "PASANG IKLAN",
    text: "Promosikan Usaha & UMKM Anda di Kareba'Ta! Tarif mulai Rp 25.000 (3 hari) & Rp 50.000 / minggu tayang terus-menerus tanpa batas. Hubungi WhatsApp Admin!",
    location: "Layanan Iklan",
    time: "Aktif",
  },
  {
    id: "b-promo-2",
    category: "IKLAN VIDEO",
    text: "Tersedia slot Iklan Video & Pop-up tampil di layar utama warga langsung terhubung ke WhatsApp jualan Anda! Hubungi WA Admin: 085351037179.",
    location: "Slot Terbatas",
    time: "Aktif",
  },
  {
    id: "b-1",
    category: "LALU LINTAS",
    text: "Arus lalu lintas pesisir dan jalur protokol terpantau lancar dan nyaman dilalui sore ini.",
    location: "Kawasan Pesisir",
    time: "Terkini",
  },
  {
    id: "b-promo-3",
    category: "PROMO UMKM",
    text: "Mau produk atau jasa Anda laris dilihat ribuan warga sekitar setiap hari? Pasang iklan sekarang juga di Kareba'Ta!",
    location: "Kemitraan Usaha",
    time: "Terkini",
  },
  {
    id: "b-3",
    category: "PRAKIRAAN CUACA",
    text: "BMKG Wilayah: Suhu 26°C - 31°C, hembusan angin laut sepoi-sepoi dan potensi gerimis ringan di lereng perbukitan.",
    location: "Kawasan Sekitar",
    time: "30 mnt lalu",
  },
];

export const RunningTextBar: React.FC<RunningTextBarProps> = ({
  announcements = DEFAULT_ANNOUNCEMENTS,
}) => {
  // Normalisasi data pengumuman
  const items: BulletinItem[] = announcements.map((item, idx) => {
    if (typeof item === "string") {
      return {
        id: `ann-${idx}`,
        category: "KABAR WARGA",
        text: item,
        time: "Baru",
      };
    }
    return item;
  });

  // Ref untuk Custom Animation Engine (Bukan Bawaan Browser / Tag Marquee)
  const trackRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef<number>(0);
  const halfWidthRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);

  // Hitung separuh lebar konten untuk seamless infinite wrap
  const measureHalfWidth = useCallback(() => {
    if (trackRef.current) {
      const fullWidth = trackRef.current.scrollWidth;
      halfWidthRef.current = fullWidth / 2;
    }
  }, []);

  // Update posisi transform secara langsung di DOM (60/120fps hardware accelerated)
  const applyTransform = useCallback((x: number) => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${-x}px, 0, 0)`;
    }
  }, []);

  // Custom Tick Engine menggunakan requestAnimationFrame
  useEffect(() => {
    measureHalfWidth();
    window.addEventListener("resize", measureHalfWidth);

    const speed = 36; // Kecepatan gerak: 36 piksel per detik

    const loop = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const half = halfWidthRef.current;
      if (half > 0) {
        offsetRef.current += speed * delta;
        if (offsetRef.current >= half) {
          offsetRef.current = offsetRef.current % half;
        }
        applyTransform(offsetRef.current);
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", measureHalfWidth);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [measureHalfWidth, applyTransform, items]);

  if (items.length === 0) return null;

  return (
    <div
      id="running-text-board"
      className="w-full max-w-full bg-neutral-900 border-b border-neutral-800 text-white flex items-center h-8 sm:h-8.5 overflow-hidden relative select-none shadow-2xs z-30 pointer-events-none"
      style={{ touchAction: "pan-y" }}
    >
      {/* Label Badge Statis Kiri - Non-interaktif */}
      <div className="bg-red-600 text-white h-full px-2.5 sm:px-3 flex items-center gap-1.5 shrink-0 z-20 font-black text-[clamp(10px,2.8vw,11.5px)] tracking-wider uppercase shadow-xs select-none">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
        <span className="whitespace-nowrap font-extrabold tracking-tight">INFO</span>
      </div>

      {/* Area Viewport Marquee (Pasif penuh, tidak dapat diklik) */}
      <div className="flex-1 min-w-0 overflow-hidden relative h-full flex items-center">
        {/* Efek Gradien Tepi Halus Kiri & Kanan */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-neutral-900 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-neutral-900 to-transparent z-10" />

        {/* Jalur Teks Bergerak */}
        <div
          ref={trackRef}
          className="flex items-center h-full whitespace-nowrap will-change-transform"
          style={{ transform: "translate3d(0px, 0, 0)" }}
        >
          {/* Set Pertama */}
          {items.map((item, idx) => (
            <div
              key={`m1-${item.id}-${idx}`}
              className="inline-flex items-center gap-2 px-5 text-[clamp(12.5px,3.4vw,14px)] text-neutral-200 whitespace-nowrap leading-none"
            >
              <span className="text-[clamp(10px,2.8vw,11.5px)] font-bold text-amber-300 bg-neutral-800/90 px-2 py-0.5 rounded border border-neutral-700/60 leading-none">
                {item.category}
              </span>
              <span className="font-medium tracking-wide">{item.text}</span>
              <span className="text-neutral-500 font-bold text-base mx-3 select-none">•</span>
            </div>
          ))}

          {/* Set Kedua (Duplikasi untuk loop tanpa jeda patah) */}
          {items.map((item, idx) => (
            <div
              key={`m2-${item.id}-${idx}`}
              className="inline-flex items-center gap-2 px-5 text-[clamp(12.5px,3.4vw,14px)] text-neutral-200 whitespace-nowrap leading-none"
            >
              <span className="text-[clamp(10px,2.8vw,11.5px)] font-bold text-amber-300 bg-neutral-800/90 px-2 py-0.5 rounded border border-neutral-700/60 leading-none">
                {item.category}
              </span>
              <span className="font-medium tracking-wide">{item.text}</span>
              <span className="text-neutral-500 font-bold text-base mx-3 select-none">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
