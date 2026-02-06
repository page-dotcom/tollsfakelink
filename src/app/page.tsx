'use client';
import { useState } from 'react';

export default function TambahLink() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const res = await fetch('/api/save-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();
    if (data.success) {
      // Menampilkan hasil link yang sudah jadi
      setResult(`${window.location.origin}/${data.shortId}`);
      setUrl('');
    } else {
      alert('Gagal menyimpan: ' + data.error);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <h2>Buat Shortlink Acak</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="url"
          placeholder="Masukkan URL Panjang (https://...)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '10px', backgroundColor: '#0070f3', color: '#white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          {loading ? 'Menyimpan...' : 'Generate Link'}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#eaffea', border: '1px solid #28a745', borderRadius: '5px' }}>
          <p>Berhasil dibuat!</p>
          <code style={{ wordBreak: 'break-all' }}>{result}</code>
          <button 
            onClick={() => navigator.clipboard.writeText(result)}
            style={{ marginLeft: '10px', fontSize: '12px', cursor: 'pointer' }}
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
}
