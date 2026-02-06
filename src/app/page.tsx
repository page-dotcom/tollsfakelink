'use client';

import { useState } from 'react';

// GANTI LINK AFFILIATE SHORTENER KAMU DI SINI
const AFFILIATE_LINK = "https://safelinku.com/ref/cewekon3"; 

export default function Home() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const handleShorten = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setStatus('loading');

    // Simulasi loading 1.5 detik, lalu muncul notif error + tombol register
    setTimeout(() => {
      setStatus('error');
    }, 1500);
  };

  const openAffiliate = () => {
    window.open(AFFILIATE_LINK, '_blank');
  };

  return (
    <div style={styles.container}>
      
      {/* Container Kotak Utama */}
      <div style={styles.card}>
        
        {/* Header Title */}
        <div style={styles.header}>
          <div style={styles.badge}>PRIVATE SYSTEM</div>
          <h1 style={styles.title}>URL SHORTENER</h1>
        </div>

        {/* Input Area */}
        <form onSubmit={handleShorten} style={styles.form}>
          <input
            type="text"
            placeholder="Paste Link Here..."
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (status === 'error') setStatus('idle');
            }}
            style={styles.input}
          />
          
          <button 
            type="submit" 
            style={status === 'loading' ? styles.buttonLoading : styles.button}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'PROCESSING...' : 'SHORTEN URL'}
          </button>
        </form>

        {/* Notifikasi Error + Tombol Register Affiliate */}
        {status === 'error' && (
          <div style={styles.errorBox}>
            <div style={styles.errorHeader}>
              <span style={{fontSize: '20px'}}>🚫</span>
              <strong>ACCESS DENIED</strong>
            </div>
            
            <p style={styles.errorText}>
              Public registration is closed. You need a premium account to create links.
            </p>

            {/* Tombol Affiliate */}
            <button onClick={openAffiliate} style={styles.registerButton}>
              REGISTER ACCESS &rarr;
            </button>
          </div>
        )}

      </div>

      {/* Footer */}
      <div style={styles.footer}>
        &copy; 2024 SecureLink. System v2.1
      </div>

    </div>
  );
}

// STYLING RAPI & RESPONSIF
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    color: '#ffffff',
    fontFamily: 'Courier New, Courier, monospace',
    padding: '20px', // Memberi jarak aman dari pinggir layar HP
    boxSizing: 'border-box',
  },
  card: {
    width: '100%',
    maxWidth: '400px', // Lebar maksimal di desktop
    backgroundColor: '#0a0a0a', // Sedikit lebih terang dari background utama
    border: '1px solid #333',
    padding: '30px 25px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
    position: 'relative',
    boxSizing: 'border-box',
  },
  header: {
    textAlign: 'center',
    marginBottom: '10px',
  },
  badge: {
    fontSize: '10px',
    backgroundColor: '#222',
    color: '#888',
    padding: '4px 8px',
    border: '1px solid #333',
    display: 'inline-block',
    marginBottom: '10px',
    letterSpacing: '1px',
  },
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '700',
    letterSpacing: '3px',
    color: '#fff',
    borderBottom: '2px solid #fff', // Garis bawah judul
    display: 'inline-block',
    paddingBottom: '5px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  input: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#111',
    border: '1px solid #444',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    textAlign: 'center', // Text di tengah biar rapi
  },
  button: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#fff',
    color: '#000',
    border: 'none',
    fontSize: '14px',
    fontWeight: '900',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    transition: '0.2s',
  },
  buttonLoading: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#333',
    color: '#888',
    border: 'none',
    fontSize: '14px',
    fontWeight: '900',
    cursor: 'not-allowed',
  },
  // Style untuk Kotak Error & Tombol Register
  errorBox: {
    marginTop: '10px',
    backgroundColor: 'rgba(255, 50, 50, 0.05)', // Merah sangat transparan
    border: '1px solid #8B0000', // Border merah gelap
    padding: '20px',
    textAlign: 'center',
    animation: 'fadeIn 0.5s',
  },
  errorHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    color: '#ff5555',
    marginBottom: '10px',
  },
  errorText: {
    fontSize: '12px',
    color: '#aaa',
    marginBottom: '15px',
    lineHeight: '1.4',
  },
  registerButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#8B0000', // Merah gelap
    color: '#fff',
    border: '1px solid #ff5555',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  footer: {
    marginTop: '30px',
    color: '#444',
    fontSize: '10px',
  },
};
