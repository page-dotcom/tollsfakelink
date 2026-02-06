'use client';
import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/save-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(`${window.location.origin}/${data.shortId}`);
        setUrl('');
      } else {
        alert('Gagal: ' + data.error);
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ 
      backgroundColor: '#000', 
      color: '#fff', 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      padding: '20px'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '450px', 
        padding: '30px', 
        border: '1px solid #333', 
        borderRadius: '12px',
        backgroundColor: '#111'
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '10px', textAlign: 'center' }}>URL Shortener</h1>
        <p style={{ color: '#888', textAlign: 'center', marginBottom: '25px', fontSize: '14px' }}>
          Masukkan link tujuan, sistem akan buatkan ID acak.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="url"
            placeholder="Tempel link di sini (https://...)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            style={{ 
              width: '100%', 
              padding: '12px', 
              marginBottom: '15px', 
              borderRadius: '6px', 
              border: '1px solid #333', 
              backgroundColor: '#000',
              color: '#fff',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '12px', 
              backgroundColor: '#fff', 
              color: '#000', 
              border: 'none', 
              borderRadius: '6px', 
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Sedang Memproses...' : 'Buat Shortlink'}
          </button>
        </form>

        {result && (
          <div style={{ 
            marginTop: '25px', 
            padding: '15px', 
            backgroundColor: '#1a1a1a', 
            border: '1px dashed #444', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#aaa' }}>Link Kamu Berhasil Dibuat:</p>
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              alignItems: 'center', 
              justifyContent: 'center',
              wordBreak: 'break-all',
              backgroundColor: '#000',
              padding: '10px',
              borderRadius: '4px'
            }}>
              <span style={{ color: '#00ff00', fontSize: '14px' }}>{result}</span>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(result);
                alert('Tersalin!');
              }}
              style={{ 
                marginTop: '15px',
                background: 'none',
                border: '1px solid #555',
                color: '#ccc',
                padding: '5px 15px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Salin Link
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
