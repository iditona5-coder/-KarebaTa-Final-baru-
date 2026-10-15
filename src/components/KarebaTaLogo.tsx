// components/Header.tsx - KODE LENGKAP ANTI MEPET KANAN
import KarebaTaLogo from "./KarebaTaLogo";

export default function Header() {
  return (
    <header 
      style={{ 
        width: "100%",
        height: "64px",
        backgroundColor: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: "16px",
        paddingRight: "24px", // INI KUNCI - JARAK KANAN 24px BIAR TIDAK MEPET
        boxSizing: "border-box",
        borderBottom: "1px solid #eee",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}
    >
      {/* KIRI - LOGO */}
      <div style={{ flexShrink: 0 }}>
        <KarebaTaLogo />
      </div>

      {/* KANAN - ICON MEDIA - TIDAK MEPET KANAN LAGI */}
      <div 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "16px", // JARAK ANTAR ICON 16px
          paddingRight: "4px"
        }}
      >
        {/* Icon Search */}
        <button style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-3.5-3.5"/></svg>
        </button>

        {/* Icon Kamera */}
        <button style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
        </button>

        {/* Icon Gambar */}
        <button style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21
