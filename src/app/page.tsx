'use client';

import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '@/data/supabase';

export default function Home() {
  // STATE
  const [session, setSession] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // DATA
  const [links, setLinks] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    site_name: 'ShortTools',
    offer_url: '',
    offer_active: false,
    histats_id: ''
  });

  // INPUTS
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  
  // UI
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editUrlVal, setEditUrlVal] = useState("");
  const [viewState, setViewState] = useState<'input'|'loading'|'result'>('input');
  const [showSettings, setShowSettings] = useState(false);
  const [showList, setShowList] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'danger'} | null>(null);

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // INIT
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) await loadData();
      setAuthChecking(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (session) loadData();
      setAuthChecking(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // TOAST TIMER
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function loadData() {
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

  const showNotif = (msg: string, type: 'success'|'danger' = 'success') => setToast({ msg, type });

  // ACTIONS
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) showNotif("Login Failed: " + error.message, "danger");
  };

  const handleShorten = async (e: FormEvent) => {
    e.preventDefault();
    if (!longUrl) return;

    setViewState('loading');
    
    try {
      const res = await fetch('/api/save-link', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ url: longUrl })
      });
      const data = await res.json();
      
      setTimeout(() => {
        if (data.success) {
          setShortUrl(`https://sekphim-tv.eu.org/${data.shortId}`);
          setViewState('result');
          setLongUrl("");
          fetchLinks();
          showNotif("Link Berhasil Dibuat!", "success");
        } else {
          setViewState('input');
          showNotif(data.error, "danger");
        }
      }, 500);
    } catch { setViewState('input'); showNotif("Error Server", "danger"); }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Yakin hapus?")) return;
    await fetch('/api/links', { method: 'DELETE', body: JSON.stringify({ id }) });
    setLinks(links.filter(l => l.id !== id));
    showNotif("Link Dihapus", "success");
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
    showNotif("Link Diupdate", "success");
  };

  const saveSettings = async () => {
    await supabase.from('settings').update({
      site_name: settings.site_name,
      offer_url: settings.offer_url,
      offer_active: settings.offer_active,
      histats_id: settings.histats_id
    }).eq('id', 1);
    showNotif("Pengaturan Tersimpan", "success");
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotif("Tersalin ke Clipboard!", "success");
  };

  const currentItems = links.slice((currentPage-1)*ITEMS_PER_PAGE, currentPage*ITEMS_PER_PAGE);
  const totalPages = Math.ceil(links.length / ITEMS_PER_PAGE);

  // RENDER
  if (authChecking) return null;

  return (
    <>
      {toast && (
        <div className={`alert-toast alert-${toast.type}`}>
          {toast.msg}
        </div>
      )}

      {/* --- LOGIN POPUP BARU (FIXED & RAPI) --- */}
      {!session && (
        <div className="login-overlay">
          <div className="login-box" style={{padding: '40px 30px'}}>
            
            {/* Header dengan Icon Bulat */}
            <div className="login-header" style={{textAlign: 'center', marginBottom: '30px'}}>
              <div className="login-icon" style={{
                width: '70px', height: '70px', 
                background: '#eff6ff', color: '#3b82f6', 
                borderRadius: '50%', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', 
                margin: '0 auto 15px auto',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)'
              }}>
                {/* SVG GEMBOK KEREN */}
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM8.9 6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2H8.9V6zM18 20H6V10h12v10z"/>
                </svg>
              </div>
              <h3 style={{margin: '0 0 5px 0', color: '#1e293b', fontWeight: '800', fontSize: '22px'}}>Welcome Back</h3>
              <p style={{margin: 0, color: '#64748b', fontSize: '14px'}}>Please login to access the dashboard</p>
            </div>

            {/* Form Input */}
            <form onSubmit={handleLogin}>
              <div className="form-group" style={{marginBottom: '15px'}}>
                <label style={{display:'block', fontSize:'12px', fontWeight:'700', color:'#475569', marginBottom:'8px', textTransform:'uppercase'}}>Email Address</label>
                <input 
                  className="form-control" 
                  type="email" 
                  placeholder="admin@example.com" 
                  value={email} 
                  onChange={e=>setEmail(e.target.value)} 
                  required 
                  style={{background: '#f8fafc'}}
                />
              </div>
              
              <div className="form-group" style={{marginBottom: '25px'}}>
                <label style={{display:'block', fontSize:'12px', fontWeight:'700', color:'#475569', marginBottom:'8px', textTransform:'uppercase'}}>Password</label>
                <input 
                  className="form-control" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e=>setPassword(e.target.value)} 
                  required 
                  style={{background: '#f8fafc'}}
                />
              </div>

              <button className="btn btn-primary btn-full" style={{
                height: '50px', fontSize: '15px', fontWeight: 'bold', 
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)', width: '100%'
              }}>
                SIGN IN NOW
              </button>
            </form>

          </div>
        </div>
      )}

      
      {/* DASHBOARD */}
      {session && (
        <>
          <nav className="navbar-bs3">
            <div className="container nav-flex">
              <a href="#" className="navbar-brand">
                <span className="material-icons-round">link</span>
                {settings.site_name}
              </a>
              <button onClick={async()=>{await supabase.auth.signOut(); setLinks([])}} className="btn-logout">LOGOUT</button>
            </div>
          </nav>

          <div className="container">
            <div style={{maxWidth:750, margin:'0 auto'}}>
              
              {/* PANEL UTAMA */}
              <div className="panel">
                <div className="panel-heading">
                  {editingId ? 'Edit Link' : 'Buat Short Link Baru'}
                </div>
                <div className="panel-body">
                  
                  {editingId ? (
                    <div>
                      <div className="form-group">
                        <input className="form-control" value={editUrlVal} onChange={e=>setEditUrlVal(e.target.value)} />
                      </div>
                      <div style={{display:'flex', gap:10}}>
                        <button className="btn btn-success btn-block" onClick={saveEdit}>SIMPAN</button>
                        <button className="btn btn-default btn-block" onClick={()=>setEditingId(null)}>BATAL</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* INPUT */}
                      {viewState === 'input' && (
                        <form onSubmit={handleShorten}>
                          <div className="input-group-bs3">
                            <input className="form-control" placeholder="Tempel URL Panjang di sini..." value={longUrl} onChange={e=>setLongUrl(e.target.value)} required />
                            <button className="btn btn-primary">SHORTEN</button>
                          </div>
                        </form>
                      )}

                      {/* LOADING */}
                      {viewState === 'loading' && (
                        <div style={{textAlign:'center', padding:20, color:'#777'}}>
                          Memproses Permintaan...
                        </div>
                      )}

                      {/* RESULT */}
                      {viewState === 'result' && (
                        <div className="well">
                          <div className="result-url">{shortUrl}</div>
                          <button className="btn btn-success" onClick={()=>copyText(shortUrl)}>SALIN URL</button>
                          
                          <div className="social-wrap">
                            <small style={{color:'#777'}}>Bagikan Ke:</small>
                            <div className="social-icons">
                              <a href={`https://api.whatsapp.com/send?text=${shortUrl}`} target="_blank" className="social-btn bg-wa"><span className="material-icons-round">chat</span></a>
                              <a href={`https://www.facebook.com/sharer/sharer.php?u=${shortUrl}`} target="_blank" className="social-btn bg-fb"><span className="material-icons-round">facebook</span></a>
                              <a href={`https://twitter.com/intent/tweet?url=${shortUrl}`} target="_blank" className="social-btn bg-tw"><span className="material-icons-round">rss_feed</span></a>
                              <a href={`https://t.me/share/url?url=${shortUrl}`} target="_blank" className="social-btn bg-tg"><span className="material-icons-round">send</span></a>
                            </div>
                            <div style={{marginTop:15}}>
                              <a style={{cursor:'pointer', textDecoration:'underline', color:'#337ab7'}} onClick={()=>{setViewState('input'); setLongUrl('');}}>Buat Link Lagi</a>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* TOGGLES */}
              <div style={{display:'flex', gap:10, justifyContent:'center', marginBottom:20}}>
                <button className="btn btn-default" onClick={()=>setShowList(!showList)}>
                  {showList ? 'Tutup Daftar Link' : 'Lihat Daftar Link'}
                </button>
                <button className="btn btn-default" onClick={()=>setShowSettings(!showSettings)}>
                  Pengaturan
                </button>
              </div>

              {/* LIST TABLE (FIXED WIDTH AKSI) */}
              {showList && (
                <div className="panel">
                  <div className="panel-heading">DAFTAR LINK</div>
                  <div className="panel-body" style={{padding:0}}>
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th style={{width:50}}>Icon</th>
                            <th>Short Link</th>
                            <th>Original</th>
                            <th style={{width:70, textAlign:'center'}}>Klik</th>
                            <th className="col-action">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentItems.map(link => (
                            <tr key={link.id}>
                              <td><img src={`https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=32`} style={{width:20, borderRadius:3}} onError={(e:any)=>e.target.style.display='none'} /></td>
                              <td><b style={{color:'#337ab7'}}>{link.id}</b></td>
                              <td><div style={{maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#777', fontSize:12}}>{link.url}</div></td>
                              <td style={{textAlign:'center', fontWeight:'bold'}}>{link.clicks}</td>
                              <td className="col-action">
                                <button className="btn btn-info btn-xs" title="Copy" onClick={()=>copyText(`https://sekphim-tv.eu.org/${link.id}`)}>C</button>
                                <button className="btn btn-warning btn-xs" title="Edit" onClick={()=>startEdit(link)}>E</button>
                                <button className="btn btn-danger-xs btn-xs" title="Hapus" onClick={()=>handleDelete(link.id)}>X</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Pagination */}
                    <div style={{padding:15, textAlign:'center'}}>
                      <button className="btn btn-default btn-xs" disabled={currentPage===1} onClick={()=>setCurrentPage(c=>c-1)}>Prev</button>
                      <span style={{margin:'0 10px', fontSize:12}}>Page {currentPage}</span>
                      <button className="btn btn-default btn-xs" disabled={currentPage>=totalPages} onClick={()=>setCurrentPage(c=>c+1)}>Next</button>
                    </div>
                  </div>
                </div>
              )}

              {/* SETTINGS PANEL */}
              {showSettings && (
                <div className="panel">
                  <div className="panel-heading">KONFIGURASI</div>
                  <div className="panel-body">
                    
                    <div className="well" style={{padding:10, marginBottom:15, display:'flex', alignItems:'center', cursor:'pointer'}} onClick={()=>setSettings({...settings, offer_active:!settings.offer_active})}>
                      <input type="checkbox" checked={settings.offer_active} readOnly style={{marginRight:10}} />
                      <span style={{fontWeight:'bold'}}>AKTIFKAN REDIRECT OFFER?</span>
                    </div>

                    <div className="form-group">
                      <label>NAMA SITUS</label>
                      <input className="form-control" value={settings.site_name} onChange={e=>setSettings({...settings, site_name:e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>URL OFFER (TARGET)</label>
                      <textarea className="form-control" rows={2} value={settings.offer_url} onChange={e=>setSettings({...settings, offer_url:e.target.value})}></textarea>
                    </div>
                    <div className="form-group">
                      <label>HISTATS ID</label>
                      <input className="form-control" value={settings.histats_id} onChange={e=>setSettings({...settings, histats_id:e.target.value})} />
                    </div>
                    <button className="btn btn-primary btn-block" onClick={saveSettings}>SIMPAN PENGATURAN</button>
                  </div>
                </div>
              )}

            </div>
          </div>

          <footer className="footer">
            &copy; 2026 {settings.site_name}. All Rights Reserved.
          </footer>
        </>
      )}
    </>
  );
}
