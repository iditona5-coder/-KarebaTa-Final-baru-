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
  const pinSize = compact ? "clamp(26px, 7.5vw, 36px)" : "clamp(38px, 10.5vw, 50px)";

  return (
    <div
      dir="ltr"
      className={`select-none flex items-center min-w-0 max-w-full ${compact ? "gap-1.5 sm:gap-2" : "gap-2 sm:gap-3"} ${className}`}
      style={{
        ...style,
      }}
    >
      <div className="shrink-0 flex items-center justify-center">
        <KarebaPinIcon size={pinSize} />
      </div>

      <div className="flex flex-col justify-center min-w-0 text-left">
        <div
          className={`${
            compact
              ? "text-[clamp(14.5px,4.2vw,20px)]"
              : "text-[clamp(20px,5.8vw,26px)]"
          } font-black tracking-tight leading-none whitespace-nowrap`}
          style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
          }}
        >
          <span className="text-emerald-500">Kareba&apos;</span>
          <span className="text-[#E5A000]">Ta</span>
        </div>

        {showSubtitle && (
          <span
            className={`${
              compact
                ? "text-[clamp(7.5px,2vw,9.5px)] tracking-[0.05em]"
                : "text-[clamp(9.5px,2.6vw,12px)] tracking-[0.1em]"
            } font-extrabold uppercase text-[#E5A000] leading-none mt-1 whitespace-nowrap`}
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

