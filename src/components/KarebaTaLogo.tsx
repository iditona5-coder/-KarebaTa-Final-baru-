import React from "react";

export function KarebaPinIcon({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      style={{
        ...style,
      }}
      aria-label="Logo Pin Kareba'Ta"
    >
      {/* Bentuk Pin Lokasi Warna Kuning Keemasan Khas Kareba'Ta */}
      <path
        d="M 50 118 C 47 108 10 70 10 46 A 40 40 0 1 1 90 46 C 90 70 53 108 50 118 Z"
        fill="#E5A000"
      />

      {/* Huruf K Tebal Putih Bersih di Dalam Pin */}
      <path
        d="M 30 25 H 41 V 44.5 L 59.5 25 H 73.5 L 50.5 47.5 L 74.5 71 H 60.5 L 41 51 V 71 H 30 V 25 Z"
        fill="#ffffff"
      />
    </svg>
  );
}

export function KarebaTaLogo({
  showSubtitle = true,
  className = "",
  style,
}: {
  showSubtitle?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`select-none flex items-center gap-2 shrink-0 ${className}`}
      style={style}
    >
      {/* Ikon Pin Lokasi Kareba'Ta - Skala Responsif di Semua Layar HP */}
      <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center">
        <KarebaPinIcon className="w-full h-full" />
      </div>

      {/* Tipografi Brand Kareba'Ta */}
      <div className="flex flex-col justify-center leading-none shrink-0">
        <div className="text-[17px] sm:text-[19px] font-black tracking-tight leading-none whitespace-nowrap font-sans">
          <span className="text-[#00632B]">Kareba&apos;</span>
          <span className="text-[#E5A000]">Ta</span>
        </div>

        {showSubtitle && (
          <span className="text-[8.5px] sm:text-[9.5px] font-extrabold tracking-wider text-[#E5A000] uppercase mt-0.5 whitespace-nowrap font-sans">
            beritamu, suaramu
          </span>
        )}
      </div>
    </div>
  );
}

export default KarebaTaLogo;

