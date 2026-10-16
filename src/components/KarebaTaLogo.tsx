import React, { useState } from "react";

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
      className={className}
      style={{
        width: "40px",
        height: "40px",
        minWidth: "40px",
        minHeight: "40px",
        flexShrink: 0,
        flexGrow: 0,
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
  const [hasImgError, setHasImgError] = useState(false);

  // Jika file gambar /logo-karebata.png tersedia, tampilkan sesuai pengaturan ukuran user
  if (!hasImgError) {
    return (
      <img
        src="/logo-karebata.png"
        alt="Kareba'Ta"
        className={className}
        onError={() => setHasImgError(true)}
        style={{
          width: "185px",
          minWidth: "185px",
          maxWidth: "185px",
          height: "56px",
          minHeight: "56px",
          maxHeight: "56px",
          objectFit: "contain",
          display: "block",
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }

  // Fallback SVG asli yang tajam dan presisi jika gambar file png belum dimuat
  return (
    <div
      className={`select-none ${className}`}
      style={{
        height: "40px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexShrink: 0,
        flexGrow: 0,
        ...style,
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          minWidth: "40px",
          minHeight: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          flexGrow: 0,
        }}
      >
        <KarebaPinIcon />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flexShrink: 0,
          flexGrow: 0,
        }}
      >
        <div
          style={{
            fontSize: "18px",
            lineHeight: 1,
            whiteSpace: "nowrap",
            flexShrink: 0,
            flexGrow: 0,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            fontFamily: "'Poppins', system-ui, sans-serif",
          }}
        >
          <span style={{ color: "#00632B" }}>Kareba'</span>
          <span style={{ color: "#E5A000" }}>Ta</span>
        </div>

        {showSubtitle && (
          <span
            style={{
              fontSize: "9px",
              lineHeight: 1,
              whiteSpace: "nowrap",
              flexShrink: 0,
              flexGrow: 0,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#E5A000",
              marginTop: "2px",
              textTransform: "uppercase",
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
