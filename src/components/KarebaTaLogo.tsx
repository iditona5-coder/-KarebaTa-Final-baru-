export default function KarebaTaLogo() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      flexShrink: 0,
      width: "clamp(135px, 42vw, 195px)",
      height: "auto",
      aspectRatio: "195 / 56",
    }}>
      <img 
        src="/logo-karebata.png" 
        alt="Kareba'Ta"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "left center",
          display: "block"
        }}
      />
    </div>
  );
}
