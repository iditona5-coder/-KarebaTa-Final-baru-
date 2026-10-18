import React from "react";

export function KarebaPinIcon({
  className = "",
  style,
  size = 36,
}: {
  className?: string;
  style?: React.CSSProperties;
  size?: number | string;
}) {
  const sizeVal = typeof size === "number" ? `${size}px` : size;
  return (
    <svg
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      style={{
        width: sizeVal,
        height: sizeVal,
        minWidth: sizeVal,
        minHeight: sizeVal,
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
  compact = false,
  className = "",
  style,
}: {
  showSubtitle?: boolean;
  compact?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const pinSize = compact ? 32 : 38;

  return (
    <div
      dir="ltr"
      className={`select-none flex items-center ${compact ? "gap-1.5 sm:gap-2" : "gap-2"} shrink-0 ${className}`}
      style={{
        ...style,
      }}
    >
      <div className="shrink-0 flex items-center justify-center">
        <KarebaPinIcon size={pinSize} />
      </div>

      <div className="flex flex-col justify-center shrink-0 text-left">
        <div
          className={`${
            compact
              ? "text-[16px] sm:text-[18px]"
              : "text-[18px] sm:text-[20px]"
          } font-black tracking-tight leading-none whitespace-nowrap`}
          style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
          }}
        >
          <span className="text-[#00632B]">Kareba&apos;</span>
          <span className="text-[#E5A000]">Ta</span>
        </div>

        {showSubtitle && (
          <span
            className={`${
              compact
                ? "text-[7.5px] sm:text-[8.5px] tracking-[0.06em]"
                : "text-[8.5px] sm:text-[9.5px] tracking-[0.08em]"
            } font-extrabold uppercase text-[#E5A000] leading-none mt-0.5 whitespace-nowrap`}
            style={{
              fontFamily: "'Poppins', system-ui, sans-serif",
            }}
          >
            beritamu, suaramu
          </span>
        )}
      </div>
    </div>
  );
}

export default KarebaTaLogo;

