import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Animasi Glitch Text */}
        <h1 style={styles.errorCode}>404</h1>
        
        <h2 style={styles.title}>PAGE NOT FOUND</h2>
        
        <p style={styles.description}>
          The link you are looking for does not exist or has been moved to another dimension.
        </p>

        {/* Tombol Kotak Tajam (No Border Radius) */}
        <Link href="/" style={styles.button}>
          RETURN HOME
        </Link>
      </div>

      {/* CSS Animation dalam file yang sama agar mudah copy-paste */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0.8; transform: scale(1); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}

// Styling Object (CSS-in-JS simple)
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: '100vh',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a', // Dark mode profesional
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    padding: '20px',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  content: {
    textAlign: 'center',
    maxWidth: '500px',
    zIndex: 2,
    animation: 'float 3s ease-in-out infinite', // Efek melayang
  },
  errorCode: {
    fontSize: '120px',
    margin: '0',
    fontWeight: '900',
    color: '#333', // Warna gelap biar elegan
    textShadow: '2px 2px 0px #fff', // Efek shadow tajam
    lineHeight: '1',
    animation: 'pulse 2s infinite', // Efek berdenyut
  },
  title: {
    fontSize: '24px',
    margin: '20px 0 10px 0',
    textTransform: 'uppercase',
    letterSpacing: '4px',
    borderBottom: '2px solid #fff', // Garis bawah tajam
    display: 'inline-block',
    paddingBottom: '5px',
  },
  description: {
    fontSize: '16px',
    color: '#888',
    marginBottom: '40px',
    lineHeight: '1.5',
  },
  button: {
    display: 'inline-block',
    padding: '15px 30px',
    backgroundColor: '#fff',
    color: '#000',
    textDecoration: 'none',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    border: 'none',
    borderRadius: '0px', // SESUAI REQUEST: TANPA BORDER RADIUS
    cursor: 'pointer',
    transition: 'background 0.3s',
  }
};
