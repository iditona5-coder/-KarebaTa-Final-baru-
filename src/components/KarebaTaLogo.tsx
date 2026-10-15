export default function KarebaTaLogo() {
  return (
    <div style={{ 
      width: "180px", 
      minWidth: "180px",
      height: "52px",
      display: "flex", 
      alignItems: "center",
      flexShrink: 0 
    }}>
      <svg viewBox="0 0 320 60" style={{ width: "100%", height: "100%" }}>
        {/* PIN K */}
        <g>
          <path d="M28 2 C 45 2, 58 15, 58 30 C 58 45, 35 62, 28 68 C 21 62, -2 45, -2 30 C -2 15, 11 2, 28 2 Z" fill="#EAB308" transform="translate(4 0) scale(0.9)"/>
          <text x="28" y="42" textAnchor="middle" fill="white" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="38">K</text>
        </g>
        {/* KAREBA */}
        <text x="70" y="38" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="42" fill="#0A5C2E" letterSpacing="-1">Kareba</text>
        {/* 'TA KUNING */}
        <text x="218" y="38" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="42" fill="#EAB308">’Ta</text>
        {/* beritamu suaramu */}
        <text x="70" y="56" fontFamily="Arial, sans-serif" fontWeight="600" fontSize="13" fill="#EAB308" letterSpacing="0.5">beritamu suaramu</text>
      </svg>
    </div>
  );
}
