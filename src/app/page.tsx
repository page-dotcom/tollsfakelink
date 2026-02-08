'use client';

import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '@/data/supabase';

export default function Home() {
  // --- STATE ---
  const [session, setSession] = useState<any>(null);
  const [theme, setTheme] = useState('light'); // 'light' or 'dark'
  
  // DATA
  const [links, setLinks] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    site_name: 'ShortCuts',
    offer_url: '',
    offer_active: false,
    histats_id: ''
  });

  // INPUTS
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [longUrl, setLongUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");

  // UI CONTROL
  const [viewState, setViewState] = useState<'input'|'processing'|'result'>('input');
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editUrlVal, setEditUrlVal] = useState("");
  const [copyText, setCopyText] = useState("Copy");
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  const [loading, setLoading] = useState(false);

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // --- INIT ---
  useEffect(() => {
    // Cek Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadData();
    });
    // Set Theme Awal
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
    if (error) setToast({ msg: "Login Gagal: " + error.message, type: 'error' });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLinks([]);
  };

  // SHORTEN DENGAN PROGRESS BAR
  const handleShorten = async (e: FormEvent) => {
    e.preventDefault();
    if (!longUrl) return;

    setViewState('processing');
    setProgress(0);

    // Animasi Progress Palsu
    let p = 0;
    const interval = setInterval(() => {
      p += 10;
      if (p > 90) p = 90;
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
      setProgress(100);

      setTimeout(() => {
        if (data.success) {
          setResultUrl(`https://tollsfakelink.vercel.app/${data.shortId}`);
          setViewState('result');
          setLongUrl("");
          fetchLinks();
          setToast({ msg: "Link Berhasil Dibuat!", type: 'success' });
        } else {
          setViewState('input');
          setToast({ msg: data.error, type: 'error' });
        }
      }, 600); 

    } catch {
      setViewState('input');
      setToast({ msg: "Error Server", type: 'error' });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultUrl);
    setCopyText("Copied!");
    setTimeout(() => setCopyText("Copy"), 2000);
    setToast({ msg: "Link Tersalin", type: 'success' });
  };

  // CRUD TABLE
  const handleDelete = async (id: string) => {
    if(!confirm("Hapus?")) return;
    await fetch('/api/links', { method: 'DELETE', body: JSON.stringify({ id }) });
    setLinks(links.filter(l => l.id !== id));
    setToast({ msg: "Terhapus", type: 'success' });
  };

  const startEdit = (link: any) => {
    setEditingId(link.id);
    setEditUrlVal(link.url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await fetch('/api/links', { method: 'PATCH', body: JSON.stringify({ id: editingId, newUrl: editUrlVal }) });
    setEditingId(null);
    fetchLinks();
    setToast({ msg: "Link Updated", type: 'success' });
  };

  const saveSettings = async () => {
    setLoading(true);
    await supabase.from('settings').update({
      site_name: settings.site_name,
      offer_url: settings.offer_url,
      offer_active: settings.offer_active,
      histats_id: settings.histats_id
    }).eq('id', 1);
    setLoading(false);
    setToast({ msg: "Settings Saved", type: 'success' });
  };

  // PAGINATION
  const currentItems = links.slice((currentPage-1)*ITEMS_PER_PAGE, currentPage*ITEMS_PER_PAGE);
  const totalPages = Math.ceil(links.length / ITEMS_PER_PAGE);

  return (
    <>
      {/* TOAST */}
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {/* LOGIN POPUP */}
      {!session && (
        <div className="login-overlay">
          <div className="login-box">
            <h3 style={{margin:'0 0 20px 0', color:'var(--text-main)'}}>LOGIN ADMIN</h3>
            <form onSubmit={handleLogin}>
              <div style={{marginBottom:15}}>
                <input className="form-control" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
              </div>
              <div style={{marginBottom:25}}>
                <input className="form-control" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
              </div>
              <button className="btn-primary" style={{width:'100%', justifyContent:'center'}} disabled={loading}>
                {loading ? '...' : 'LOGIN'}
              </button>
            </form>
          </div>
        </div>
      )}

      {session && (
        <>
          {/* NAVBAR */}
          <nav className="navbar">
            <div className="nav-content">
              <div className="brand">
                <span className="material-icons-round">bolt</span> {settings.site_name}
              </div>
              <div style={{display:'flex', gap:10}}>
                <button className="btn-icon" onClick={toggleTheme}>
                  <span className="material-icons-round">{theme==='light' ? 'dark_mode' : 'light_mode'}</span>
                </button>
                <button className="btn-danger" onClick={handleLogout}>LOGOUT</button>
              </div>
            </div>
          </nav>

          <div className="container">
            
            {/* MAIN CARD */}
            <div className="card">
              <h3 style={{marginTop:0, color:'var(--text-main)'}}>{editingId ? 'Edit Link' : 'Buat Short Link'}</h3>
              
              {/* INPUT FORM */}
              {!editingId && viewState === 'input' && (
                <form onSubmit={handleShorten}>
                  <div className="input-group">
                    <input className="form-control" placeholder="Tempel URL Panjang di sini..." value={longUrl} onChange={e=>setLongUrl(e.target.value)} required />
                    <button className="btn-primary" type="submit">Shorten</button>
                  </div>
                </form>
              )}

              {/* EDIT FORM */}
              {editingId && (
                <div className="input-group">
                  <input className="form-control" value={editUrlVal} onChange={e=>setEditUrlVal(e.target.value)} />
                  <button className="btn-primary" onClick={saveEdit}>Simpan</button>
                  <button className="btn-icon" onClick={()=>setEditingId(null)}>Batal</button>
                </div>
              )}

              {/* PROGRESS BAR */}
              {viewState === 'processing' && (
                <div className="progress-wrap">
                  <div className="progress-bg">
                    <div className="progress-fill" style={{width: `${progress}%`}}></div>
                  </div>
                  <div className="progress-text">Memproses Link... {progress}%</div>
                </div>
              )}

              {/* RESULT AREA */}
              {viewState === 'result' && (
                <div className="result-area">
                  <div className="input-group">
                    <input className="form-control" value={resultUrl} readOnly style={{fontWeight:'bold', color:'var(--primary)'}} />
                    <button className="btn-primary" onClick={handleCopy} style={{background:'#10b981'}}>
                      <span className="material-icons-round">content_copy</span> {copyText}
                    </button>
                  </div>
                  
                  {/* SOSMED ICONS */}
                  <div className="sosmed-grid">
                    <a href={`https://api.whatsapp.com/send?text=${resultUrl}`} target="_blank" className="btn-sosmed wa"><span className="material-icons-round">chat</span></a>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${resultUrl}`} target="_blank" className="btn-sosmed fb"><span className="material-icons-round">facebook</span></a>
                    <a href={`https://twitter.com/intent/tweet?url=${resultUrl}`} target="_blank" className="btn-sosmed tw"><span className="material-icons-round">rss_feed</span></a>
                    <a href={`https://t.me/share/url?url=${resultUrl}`} target="_blank" className="btn-sosmed tg"><span className="material-icons-round">send</span></a>
                  </div>
                  <div style={{textAlign:'center', marginTop:20}}>
                    <a onClick={()=>{setViewState('input'); setLongUrl('');}} style={{color:'var(--text-muted)', cursor:'pointer', textDecoration:'underline'}}>Buat Lagi</a>
                  </div>
                </div>
              )}
            </div>

            {/* SETTINGS TOGGLE */}
            <div className="settings-toggle" onClick={()=>setShowSettings(!showSettings)}>
              <div style={{display:'flex', alignItems:'center', gap:10}}>
                <span className="material-icons-round">settings</span> Pengaturan Website
              </div>
              <span className="material-icons-round">{showSettings ? 'expand_less' : 'expand_more'}</span>
            </div>

            {/* SETTINGS PANEL */}
            {showSettings && (
              <div className="card" style={{marginTop:15, borderLeft:'4px solid var(--primary)'}}>
                <div style={{display:'flex', alignItems:'center', marginBottom:20, padding:15, background:'var(--bg-body)', borderRadius:'var(--radius)'}}>
                  <input type="checkbox" checked={settings.offer_active} onChange={e=>setSettings({...settings, offer_active: e.target.checked})} style={{width:20, height:20, marginRight:10}} />
                  <span style={{fontWeight:600}}>Aktifkan Redirect Offer?</span>
                </div>
                <div style={{marginBottom:15}}>
                  <label style={{display:'block', marginBottom:5, fontSize:13, color:'var(--text-muted)'}}>Nama Situs</label>
                  <input className="form-control" value={settings.site_name} onChange={e=>setSettings({...settings, site_name:e.target.value})} />
                </div>
                <div style={{marginBottom:15}}>
                  <label style={{display:'block', marginBottom:5, fontSize:13, color:'var(--text-muted)'}}>URL Offer</label>
                  <input className="form-control" value={settings.offer_url} onChange={e=>setSettings({...settings, offer_url:e.target.value})} />
                </div>
                <div style={{marginBottom:20}}>
                  <label style={{display:'block', marginBottom:5, fontSize:13, color:'var(--text-muted)'}}>Histats ID</label>
                  <input className="form-control" type="number" value={settings.histats_id} onChange={e=>setSettings({...settings, histats_id:e.target.value})} />
                </div>
                <button className="btn-primary" style={{width:'100%', justifyContent:'center'}} onClick={saveSettings} disabled={loading}>
                  {loading ? 'Menyimpan...' : 'SIMPAN SETTINGS'}
                </button>
              </div>
            )}

            {/* TABLE LIST */}
            <div className="card" style={{marginTop:30, padding:0, overflow:'hidden'}}>
              <div style={{padding:'20px', borderBottom:'1px solid var(--border)'}}>
                <h4 style={{margin:0}}>Daftar Link</h4>
              </div>
              <div className="table-responsive" style={{border:'none', borderRadius:0}}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{width:50}}>Icon</th>
                      <th>Short Link</th>
                      <th>Original URL</th>
                      <th style={{width:60}}>Klik</th>
                      <th style={{textAlign:'right'}}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map(link => (
                      <tr key={link.id}>
                        <td>
                          <img src={`https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=32`} style={{width:24, borderRadius:4}} onError={(e:any)=>e.target.style.display='none'} />
                        </td>
                        <td><b style={{color:'var(--primary)'}}>{link.id}</b></td>
                        <td><div style={{maxWidth:150, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:'var(--text-muted)', fontSize:13}}>{link.url}</div></td>
                        <td><span style={{background:'var(--bg-body)', padding:'2px 8px', borderRadius:4, fontSize:12, fontWeight:600}}>{link.clicks}</span></td>
                        <td style={{textAlign:'right'}}>
                          <button className="action-btn" title="Copy" onClick={()=>navigator.clipboard.writeText(`https://tollsfakelink.vercel.app/${link.id}`)}><span className="material-icons-round" style={{fontSize:18}}>content_copy</span></button>
                          <button className="action-btn" title="Edit" onClick={()=>startEdit(link)}><span className="material-icons-round" style={{fontSize:18}}>edit</span></button>
                          <button className="action-btn" title="Hapus" onClick={()=>handleDelete(link.id)} style={{color:'var(--danger)', borderColor:'var(--danger)'}}><span className="material-icons-round" style={{fontSize:18}}>delete</span></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div style={{padding:20, textAlign:'center', display:'flex', justifyContent:'center', gap:10}}>
                <button className="btn-icon" disabled={currentPage===1} onClick={()=>setCurrentPage(c=>c-1)}>Prev</button>
                <span style={{lineHeight:'35px', fontSize:14}}>{currentPage} / {totalPages||1}</span>
                <button className="btn-icon" disabled={currentPage>=totalPages} onClick={()=>setCurrentPage(c=>c+1)}>Next</button>
              </div>
            </div>

          </div>
          <div style={{textAlign:'center', padding:40, color:'var(--text-muted)', fontSize:12}}>
            &copy; 2026 {settings.site_name}.
          </div>
        </>
      )}
    </>
  );
}
