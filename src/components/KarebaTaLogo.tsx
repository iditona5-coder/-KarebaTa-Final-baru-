export default function KarebaTaLogo() {
  return (
    <div 
      style={{ 
        width: "180px", 
        minWidth: "180px",
        maxWidth: "180px",
        height: "52px", 
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
        flexGrow: 0
      }}
    >
      <svg viewBox="0 0 320 62" style={{ width: "100%", height: "100%", display: "block" }}>
        {/* PIN KUNING */}
        <path d="M32 2 C 48 2, 60 14, 60 28 C 60 44, 38 60, 32 66 C 26 60, 4 44, 4 28 C 4 14, 16 2, 32 2 Z" fill="#EAB308" />
        <text x="32" y="42" textAnchor="middle" fill="white" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="36">K</text>
        
        {/* KAREBA HIJAU */}
        <text x="70" y="38" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="40" fill="#0A5C2E" letterSpacing="-0.5">Kareba</text>
        {/* 'TA KUNING */}
        <text x="216" y="38" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="40" fill="#EAB308">’Ta</text>
        {/* SLOGAN */}
        <text x="70" y="56" fontFamily="Arial, sans-serif" fontWeight="600" fontSize="13.5" fill="#C49A00" letterSpacing="0.4">beritamu suaramu</text>
      </svg>
    </div>
  );
        }
