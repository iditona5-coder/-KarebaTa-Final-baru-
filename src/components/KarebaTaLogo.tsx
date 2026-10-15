export default function KarebaTaLogo() {
  return (
    <div style={{ 
      width: "195px", 
      minWidth: "195px",
      height: "54px", 
      display: "flex",
      alignItems: "center",
      flexShrink: 0,
    }}>
      <svg viewBox="0 0 340 62" style={{ width: "100%", height: "100%", display: "block", overflow: "visible" }}>
        {/* PIN K - Lebih bulat mirip asli */}
        <path d="M32 0 C 50 0, 62 12, 62 27 C 62 43, 42 58, 32 68 C 22 58, 2 43, 2 27 C 2 12, 14 0, 32 0 Z" fill="#F5B400" />
        <text x="32" y="42" textAnchor="middle" fill="white" fontFamily="Inter, Arial Black, sans-serif" fontWeight="900" fontSize="34" style={{ letterSpacing: "-1px" }}>K</text>
        
        {/* JARAK DI SINI - saya mundurkan jadi 78, tadinya 70 makanya mepet */}
        <text x="78" y="38" fontFamily="Inter, Arial Black, sans-serif" fontWeight="900" fontSize="39" fill="#0E5A2E">Kareba</text>
        <text x="225" y="38" fontFamily="Inter, Arial Black, sans-serif" fontWeight="900" fontSize="39" fill="#F5B400">’Ta</text>
        <text x="78" y="56" fontFamily="Inter, Arial, sans-serif" fontWeight="600" fontSize="13" fill="#B68F00" letterSpacing="0.6">beritamu suaramu</text>
      </svg>
    </div>
  );
}
