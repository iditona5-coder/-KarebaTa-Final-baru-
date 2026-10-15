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
        width: "44px",
        height: "44px",
        minWidth: "44px",
        minHeight: "44px",
        maxWidth: "44px",
        maxHeight: "44px",
        flexShrink: 0,
        flexGrow: 0,
        ...style,
      }}
      aria-label="Logo Pin Kareba'Ta"
    >
      <path
        d="M 50 118 C 47 108 10 70 10 46 A 40 40 0 1 1 90 46 C 90 70 53 108 50 118 Z"
        fill="#E5A000"
      />
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
}: {
  showSubtitle?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`select-none ${className}`}
      style={{
        width: "185px",
        minWidth: "185px",
        maxWidth: "185px",
        height: "56px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexShrink: 0,
        flexGrow: 0,
      }}
    >
      <KarebaPinIcon
        style={{
          width: "44px",
          height: "44px",
          minWidth: "44px",
          minHeight: "44px",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <span style={{ fontSize: "20px", fontWeight: 800, lineHeight: "20px", whiteSpace: "nowrap", color: "#166534" }}>
          Kareba'Ta
        </span>
        {showSubtitle && (
          <span style={{ fontSize: "10px", fontWeight: 700, lineHeight: "10px", whiteSpace: "nowrap", color: "#CA8A04", marginTop: "2px", letterSpacing: "0.5px" }}>
            BERITAMU, SUARAMU
          </span>
        )}
      </div>
    </div>
  );
}
