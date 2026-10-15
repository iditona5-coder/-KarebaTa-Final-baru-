export function KarebaPinIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      width: '40px',
      height: '40px',
      backgroundColor: '#EAB308',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 900,
      fontSize: '22px',
      flexShrink: 0,
      ...style
    }}>
      K
    </div>
  );
}

export function KarebaTaLogo() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <KarebaPinIcon />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{ fontWeight: 800, color: '#14532d' }}>Kareba'Ta</span>
        <span style={{ fontSize: '10px', color: '#EAB308' }}>BERITAMU, SUARAMU</span>
      </div>
    </div>
  );
}

export default KarebaTaLogo;
