export function KarebaPinIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      width: "44px", minWidth: "44px", maxWidth: "44px",
      height: "56px", minHeight: "56px",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, ...style
    }}>
      <svg viewBox="0 0 100 130" style={{ width: "44px", height: "54px" }}>
        <path d="M50 126 L46 118 C35 95 8 70 8 42 A42 42 0 0 1 92 42 C92 70 65 95 54 118 L50 126Z" fill="#EAB308" />
        <text x="50" y="68" textAnchor="middle" fill="white" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="54" letterSpacing="-2">K</text>
      </svg>
    </div>
  );
}

export function KarebaTaLogo() {
  return (
    <div style={{
      width: "195px", minWidth: "195px", maxWidth: "195px",
      height: "56px", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0
    }}>
      <KarebaPinIcon />
      <div style={{ display: "flex", flexDirection: "column", flexShrink: 0, marginTop: "-2px" }}>
        <div style={{ display: "flex", whiteSpace: "nowrap", lineHeight: "1" }}>
          <span style={{ fontSize: "26px", fontWeight: 900, color: "#0E5E2F", fontFamily: "'Baloo 2', 'Nunito', sans-serif", letterSpacing: "-0.5px" }}>Kareba'</span>
          <span style={{ fontSize: "26px", fontWeight: 900, color: "#EAB308", fontFamily: "'Baloo 2', 'Nunito', sans-serif", letterSpacing: "-0.5px" }}>Ta</span>
        </div>
        <span style={{
          fontSize: "13px", fontWeight: 700, color: "#EAB308",
          fontFamily: "'Nunito', sans-serif",
          letterSpacing: "0.3px", marginTop: "1px", whiteSpace: "nowrap", lineHeight: "1"
        }}>beritamu suaramu</span>
      </div>
    </div>
  );
}

export default KarebaTaLogo;
