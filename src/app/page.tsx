'use client';

import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '@/data/supabase';

export default function Home() {
  // --- STATE SYSTEM ---
  const [session, setSession] = useState<any>(null);
  const [theme, setTheme] = useState('light'); // Default Light Mode
  
  // Data
  const [links, setLinks] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    site_name: 'ShortTools',
    offer_url: '',
    offer_active: false,
    histats_id: ''
  });

  // Inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [longUrl, setLongUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");

  // Flow Control
  // 'input' -> 'processing' -> 'result'
  const [viewState, setViewState] = useState<'input'|'processing'|'result'>('input');
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editUrlVal, setEditUrlVal] = useState("");

  // UI Feedback
  const [copyText, setCopyText] = useState("Copy");
  const [loading, setLoading] = useState(false); // Untuk login/save
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // --- INIT ---
  useEffect(() => {
    // Cek Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadData();
    });
    // Set Theme Attribute ke Body
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // Toast Timer
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  function loadData() {
    supabase.from('settings').select('*').single().then(({ data }) => {
      if (data) { setSettings(data); document.title = data.site_name; }
    });
    fetchLinks();
  }

  async function fetchLinks() {
    const res = await fetch('/api/links');
    const json = await res.json();
    if (json.success) setLinks(json.data || []);
  }

  // --- ACTIONS ---
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setToast({ msg: "Login Gagal", type: 'error' });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLinks([]);
  };

  // --- CORE SHORTEN PROCESS ---
  const handleShorten = async (e: FormEvent) => {
    e.preventDefault();
    if (!longUrl) return;

    // 1. Masuk Mode Processing (Loading Bar)
    setViewState('processing');
    setProgress(0);

    // Animasi Palsu Progress Bar (Biar Keliatan Kerja)
    let p = 0;
    const interval = setInterval(() => {
      p += Math.floor(Math.random() * 15);
      if (p > 90) p = 90; // Tahan di 90% sampai respon API
      setProgress(p);
    }, 100);

    try {
      const res = await fetch('/api/save-link', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ url: longUrl })
      });
      const data = await res.json();

      clearInterval(interval);
      setProgress(100); // Mentok 100%

      setTimeout(() => {
        if (data.success) {
          setResultUrl(`https://tollsfakelink.vercel.app/${data.shortId}`);
          setViewState('result'); // Pindah ke Layar Hasil
          setLongUrl("");
          fetchLinks();
          setToast({ msg: "Link Berhasil Dibuat!", type: 'success' });
        } else {
          setViewState('input');
          setToast({ msg: data.error, type: 'error' });
        }
      }, 500); // Delay dikit biar animasi 100% keliatan

    } catch {
      clearInterval(interval);
      setViewState('input');
      setToast({ msg: "Error Koneksi", type: 'error' });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultUrl);
    setCopyText("Copied!");
    setTimeout(() => setCopyText("Copy"), 2000);
    setToast({ msg: "Link disalin", type: 'success' });
  };

  const resetTool = () => {
    setViewState('input');
    setResultUrl("");
    setLongUrl("");
  };

  // --- CRUD ACTIONS ---
  const saveSettings = async () => {
    setLoading(true);
    await supabase.from('settings').update({
      site_name: settings.site_name,
      offer_url: settings.offer_url,
      offer_active: settings.offer_active,
      histats_id: settings.histats_id
    }).eq('id', 1);
    setLoading(false);
    setToast({ msg: "Pengaturan Disimpan", type: 'success' });
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Hapus link ini?")) return;
    await fetch('/api/links', { method: 'DELETE', body: JSON.stringify({ id }) });
    setLinks(links.filter(l => l.id !== id));
    setToast({ msg: "Link Terhapus", type: 'success' });
  };

  const startEdit = (link: any) => {
    setEditingId(link.id);
    setEditUrlVal(link.url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveEdit = async () => {
    if(!editingId) return;
    await fetch('/api/links', { method: 'PATCH', body: JSON.stringify({ id: editingId, newUrl: editUrlVal }) });
    setEditingId(null);
    fetchLinks();
    setToast({ msg: "Link Update", type: 'success' });
  };

  // --- RENDER ---
  const currentItems = links.slice((currentPage-1)*ITEMS_PER_PAGE, currentPage*ITEMS_PER_PAGE);
  const totalPages = Math.ceil(links.length / ITEMS_PER_PAGE);

  return (
    <>
      {/* TOAST */}
      {toast && (
        <div style={{
          position:'fixed', top:20, left:'50%', transform:'translateX(-50%)',
          background: toast.type==='success' ? '#10b981' : '#ef4444', color:'#fff',
          padding:'10px 20px', borderRadius:6, fontWeight:600, zIndex:100000
        }}>
          {toast.msg}
        </div>
      )}

      {/* LOGIN POPUP */}
      {!session && (
        <div className="login-backdrop">
          <div className="login-card">
            <h3 style={{marginTop:0, marginBottom:20, color:'var(--text-main)'}}>Admin Login</h3>
            <form onSubmit={handleLogin}>
              <div style={{marginBottom:15}}>
                <input className="input-field" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%'}} required />
              </div>
              <div style={{marginBottom:25}}>
                <input className="input-field" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%'}} required />
              </div>
              <button className="btn btn-primary" style={{width:'100%', justifyContent:'center'}} disabled={loading}>
                {loading ? 'Masuk...' : 'LOGIN'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DASHBOARD */}
      {session && (
        <>
          {/* NAVBAR */}
          <nav className="navbar">
            <div className="container nav-content">
              <div className="brand">
                <span className="material-icons-round" style={{color:'var(--primary)'}}>bolt</span>
                {settings.site_name}
              </div>
              <div style={{display:'flex', gap:10}}>
                {/* TOMBOL GANTI TEMA */}
                <button className="theme-btn" onClick={toggleTheme} title="Ganti Tema">
                  <span className="material-icons-round">
                    {theme === 'light' ? 'dark_mode' : 'light_mode'}
                  </span>
                </button>
                <button onClick={handleLogout} className="btn btn-danger btn-sm">LOGOUT</button>
              </div>
            </div>
          </nav>

          <div className="container">
            
            {/* MAIN CARD (SHORTENER) */}
            <div className="card">
              <h3 style={{margin:'0 0 20px 0', color:'var(--text-main)'}}>
                {editingId ? 'Edit Link' : 'Buat Short Link Baru'}
              </h3>

              {/* 1. INPUT VIEW */}
              {viewState === 'input' && !editingId && (
                <form onSubmit={handleShorten}>
                  <div className="input-group">
                    <input className="input-field" placeholder="Tempel URL Panjang di sini..." value={longUrl} onChange={e=>setLongUrl(e.target.value)} required />
                    <button className="btn btn-primary" type="submit">Shorten</button>
                  </div>
                </form>
              )}

              {/* MODE EDIT */}
              {editingId && (
                <div className="input-group">
                  <input className="input-field" value={editUrlVal} onChange={e=>setEditUrlVal(e.target.value)} />
                  <button className="btn btn-primary" onClick={saveEdit}>Simpan</button>
                  <button className="btn btn-outline" onClick={()=>setEditingId(null)}>Batal</button>
                </div>
              )}

              {/* 2. PROCESSING VIEW (PROGRESS BAR) */}
              {viewState === 'processing' && (
                <div style={{textAlign:'center', padding:'20px 0'}}>
                  <h4 style={{margin:0, color:'var(--text-main)'}}>Memproses Link...</h4>
                  <div className="progress-container">
                    <div className="progress-bar" style={{width: `${progress}%`}}></div>
                  </div>
                  <div className="progress-text">{progress}% Selesai</div>
                </div>
              )}

              {/* 3. RESULT VIEW (COPY & SHARE) */}
              {viewState === 'result' && (
                <div className="result-box">
                  <div className="input-group">
                    <input className="input-field" value={resultUrl} readOnly style={{fontWeight:'bold', color:'var(--primary)'}} />
                    <button className="btn btn-copy" onClick={handleCopy}>
                      <span className="material-icons-round">content_copy</span>
                      {copyText}
                    </button>
                  </div>

                  {/* AREA SHARE SOSMED */}
                  <div className="share-area">
                    <span className="share-label">Bagikan ke Sosial Media:</span>
                    <div className="social-grid">
                      <a href={`https://api.whatsapp.com/send?text=${resultUrl}`} target="_blank" className="social-btn bg-wa"><span className="material-icons-round">chat</span></a>
                      <a href={`https://www.facebook.com/sharer/sharer.php?u=${resultUrl}`} target="_blank" className="social-btn bg-fb"><span className="material-icons-round">facebook</span></a>
                      <a href={`https://twitter.com/intent/tweet?url=${resultUrl}`} target="_blank" className="social-btn bg-tw"><span className="material-icons-round">rss_feed</span></a>
                      <a href={`https://t.me/share/url?url=${resultUrl}`} target="_blank" className="social-btn bg-tg"><span className="material-icons-round">send</span></a>
                    </div>
                    <div style={{marginTop:20}}>
                      <span onClick={resetTool} style={{color:'var(--text-muted)', cursor:'pointer', textDecoration:'underline', fontSize:14}}>Buat Link Lagi</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* BUTTON TOGGLE SETTINGS */}
            <div className="settings-toggle-btn" onClick={()=>setShowSettings(!showSettings)}>
              <span><span className="material-icons-round" style={{verticalAlign:'middle', marginRight:8}}>settings</span> Pengaturan Website</span>
              <span className="material-icons-round">{showSettings ? 'expand_less' : 'expand_more'}</span>
            </div>

            {/* SETTINGS PANEL */}
            {showSettings && (
              <div className="card" style={{marginTop:15, borderLeft:'4px solid var(--primary)'}}>
                {/* CHECKBOX */}
                <div style={{display:'flex', alignItems:'center', background:'var(--bg-page)', padding:15, borderRadius:6, marginBottom:20, border:'1px solid var(--border)'}}>
                  <input type="checkbox" checked={settings.offer_active} onChange={e=>setSettings({...settings, offer_active: e.target.checked})} style={{width:20, height:20, marginRight:10}} />
                  <span style={{fontWeight:600, color:'var(--text-main)'}}>Aktifkan Redirect Offer?</span>
                </div>

                <div style={{marginBottom:15}}>
                  <label style={{display:'block', marginBottom:8, fontSize:13, color:'var(--text-muted)'}}>Nama Situs</label>
                  <input className="input-field" value={settings.site_name} onChange={e=>setSettings({...settings, site_name:e.target.value})} style={{width:'100%'}} />
                </div>
                <div style={{marginBottom:15}}>
                  <label style={{display:'block', marginBottom:8, fontSize:13, color:'var(--text-muted)'}}>URL Offer (Target Redirect)</label>
                  <input className="input-field" value={settings.offer_url} onChange={e=>setSettings({...settings, offer_url:e.target.value})} style={{width:'100%'}} />
                </div>
                <div style={{marginBottom:20}}>
                  <label style={{display:'block', marginBottom:8, fontSize:13, color:'var(--text-muted)'}}>Histats ID</label>
                  <input className="input-field" type="number" value={settings.histats_id} onChange={e=>setSettings({...settings, histats_id:e.target.value})} style={{width:'100%'}} />
                </div>
                <button className="btn btn-primary" style={{width:'100%', justifyContent:'center'}} onClick={saveSettings} disabled={loading}>
                  {loading ? 'Menyimpan...' : 'SIMPAN PENGATURAN'}
                </button>
              </div>
            )}

            {/* TABLE */}
            <div className="card" style={{marginTop:30, padding:0, overflow:'hidden'}}>
              <div style={{padding:'20px', borderBottom:'1px solid var(--border)'}}>
                <h4 style={{margin:0, color:'var(--text-main)'}}>Daftar Link Aktif</h4>
              </div>
              <div className="table-wrapper" style={{border:'none', borderRadius:0}}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{width:50}}>Icon</th>
                      <th>Short Link</th>
                      <th>Original URL</th>
                      <th style={{width:70}}>Klik</th>
                      <th style={{textAlign:'right'}}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map(link => (
                      <tr key={link.id}>
                        <td>
                          <img src={`https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=32`} style={{width:24, borderRadius:4}} onError={(e:any)=>e.target.style.display='none'} />
                        </td>
                        <td><span style={{fontWeight:600, color:'var(--primary)'}}>{link.id}</span></td>
                        <td><span style={{color:'var(--text-muted)', fontSize:13, maxWidth:150, display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{link.url}</span></td>
                        <td><span style={{background:'var(--bg-page)', padding:'2px 8px', borderRadius:4, fontSize:12, fontWeight:600}}>{link.clicks}</span></td>
                        <td style={{textAlign:'right'}}>
                          <button className="action-btn" onClick={()=>navigator.clipboard.writeText(`https://tollsfakelink.vercel.app/${link.id}`)} title="Copy"><span className="material-icons-round" style={{fontSize:18}}>content_copy</span></button>
                          <button className="action-btn" onClick={()=>startEdit(link)} title="Edit"><span className="material-icons-round" style={{fontSize:18}}>edit</span></button>
                          <button className="action-btn" onClick={()=>handleDelete(link.id)} style={{color:'var(--danger)', borderColor:'var(--danger)'}} title="Hapus"><span className="material-icons-round" style={{fontSize:18}}>delete</span></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div style={{padding:20, textAlign:'center', display:'flex', justifyContent:'center', gap:10}}>
                <button className="btn btn-outline" style={{padding:'5px 15px'}} disabled={currentPage===1} onClick={()=>setCurrentPage(c=>c-1)}>Prev</button>
                <span style={{lineHeight:'35px', fontSize:14}}>{currentPage} / {totalPages||1}</span>
                <button className="btn btn-outline" style={{padding:'5px 15px'}} disabled={currentPage>=totalPages} onClick={()=>setCurrentPage(c=>c+1)}>Next</button>
              </div>
            </div>

          </div>
          
          <div style={{textAlign:'center', padding:40, color:'var(--text-muted)', fontSize:13}}>
            &copy; 2026 {settings.site_name}. Developed by Yasue.
          </div>
        </>
      )}
    </>
  );
}
