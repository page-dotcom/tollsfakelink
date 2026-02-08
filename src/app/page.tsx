'use client';

import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '@/data/supabase';

export default function Home() {
  // --- STATE ---
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
  const [toast, setToast] = useState<string | null>(null);

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

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

  // TOAST AUTO HIDE
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

  const showNotif = (msg: string) => setToast(msg);

  // --- ACTIONS ---
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) showNotif("Login Gagal: " + error.message);
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
          setShortUrl(`https://tollsfakelink.vercel.app/${data.shortId}`);
          setViewState('result');
          setLongUrl("");
          fetchLinks();
          showNotif("Sukses! Link Jadi.");
        } else {
          setViewState('input');
          showNotif(data.error);
        }
      }, 500);
    } catch { setViewState('input'); showNotif("Koneksi Error"); }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Hapus link ini?")) return;
    await fetch('/api/links', { method: 'DELETE', body: JSON.stringify({ id }) });
    setLinks(links.filter(l => l.id !== id));
    showNotif("Link Dihapus");
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
    showNotif("Link Berhasil Diupdate");
  };

  const saveSettings = async () => {
    await supabase.from('settings').update({
      site_name: settings.site_name,
      offer_url: settings.offer_url,
      offer_active: settings.offer_active,
      histats_id: settings.histats_id
    }).eq('id', 1);
    showNotif("Pengaturan Tersimpan");
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotif("Tersalin ke Clipboard");
  };

  const currentItems = links.slice((currentPage-1)*ITEMS_PER_PAGE, currentPage*ITEMS_PER_PAGE);
  const totalPages = Math.ceil(links.length / ITEMS_PER_PAGE);

  // RENDER
  if (authChecking) return null; 

  return (
    <>
      {toast && <div className="toast">{toast}</div>}

      {/* LOGIN POPUP (GLASS + SHADOW) */}
      {!session && (
        <div className="login-overlay">
          <div className="login-card">
            <div className="login-icon">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
            </div>
            <h3 style={{marginTop:0, marginBottom:10, color:'#1e293b'}}>Admin Access</h3>
            <p style={{color:'#64748b', fontSize:14, marginBottom:30}}>Silakan login untuk mengelola link.</p>
            
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <input className="form-control" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <input className="form-control" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
              </div>
              <button className="btn btn-primary btn-full">MASUK DASHBOARD</button>
            </form>
          </div>
        </div>
      )}

      {/* MAIN DASHBOARD */}
      {session && (
        <>
          <nav className="navbar-custom">
            <div className="container" style={{display:'flex', justifyContent:'space-between'}}>
              <a href="#" className="navbar-brand">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
                {settings.site_name}
              </a>
              <button onClick={async()=>{await supabase.auth.signOut(); setLinks([])}} className="btn-logout">LOGOUT</button>
            </div>
          </nav>

          <div className="container">
            <div style={{maxWidth:800, margin:'0 auto'}}>
              
              {/* CARD UTAMA */}
              <div className="card">
                <div className="card-header">
                  <span className="material-icons-round" style={{color:'#3b82f6'}}>link</span>
                  {editingId ? 'Edit Link URL' : 'Buat Short Link Baru'}
                </div>
                <div className="card-body">
                  
                  {editingId ? (
                    <div>
                      <input className="form-control" value={editUrlVal} onChange={e=>setEditUrlVal(e.target.value)} style={{marginBottom:15}} />
                      <div className="input-group" style={{gap:10}}>
                        <button className="btn btn-primary btn-full" onClick={saveEdit}>SIMPAN PERUBAHAN</button>
                        <button className="btn btn-outline btn-full" onClick={()=>setEditingId(null)}>BATAL</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* INPUT */}
                      {viewState === 'input' && (
                        <form onSubmit={handleShorten}>
                          <div className="input-group" style={{gap:10}}>
                            <input className="form-control" placeholder="Tempel URL Panjang di sini..." value={longUrl} onChange={e=>setLongUrl(e.target.value)} required style={{borderRadius:6}} />
                            <button className="btn btn-primary" style={{borderRadius:6}}>SHORTEN</button>
                          </div>
                        </form>
                      )}

                      {/* LOADING */}
                      {viewState === 'loading' && (
                        <div style={{textAlign:'center', padding:20, color:'#64748b'}}>
                          <span className="material-icons-round" style={{animation:'spin 1s linear infinite'}}>refresh</span>
                          <div style={{marginTop:5}}>Memproses Link...</div>
                        </div>
                      )}

                      {/* RESULT */}
                      {viewState === 'result' && (
                        <div className="result-box">
                          <div className="short-url-text">{shortUrl}</div>
                          <button className="btn btn-primary" onClick={()=>copyText(shortUrl)} style={{marginBottom:20}}>
                            <span className="material-icons-round">content_copy</span> SALIN LINK
                          </button>
                          
                          <div className="social-area">
                            <div style={{fontSize:13, color:'#94a3b8', marginBottom:10}}>Bagikan Ke:</div>
                            <div className="social-icons">
                              <a href={`https://api.whatsapp.com/send?text=${shortUrl}`} target="_blank" className="social-btn bg-wa"><svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
                              <a href={`https://www.facebook.com/sharer/sharer.php?u=${shortUrl}`} target="_blank" className="social-btn bg-fb"><svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
                              <a href={`https://twitter.com/intent/tweet?url=${shortUrl}`} target="_blank" className="social-btn bg-tw"><svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg></a>
                              <a href={`https://t.me/share/url?url=${shortUrl}`} target="_blank" className="social-btn bg-tg"><svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg></a>
                            </div>
                            <div style={{marginTop:20}}>
                              <a style={{cursor:'pointer', textDecoration:'underline', color:'#3b82f6', fontSize:14}} onClick={()=>{setViewState('input'); setLongUrl('');}}>Buat Link Lagi</a>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* BUTTON TOGGLE */}
              <div style={{display:'flex', gap:10, justifyContent:'center', marginBottom:20}}>
                <button className="btn btn-outline" onClick={()=>setShowList(!showList)}>
                  {showList ? 'Tutup Daftar Link' : 'Lihat Daftar Link'}
                </button>
                <button className="btn btn-outline" onClick={()=>setShowSettings(!showSettings)}>
                  Pengaturan
                </button>
              </div>

              {/* LIST TABLE (FIXED DESKTOP, SCROLL MOBILE) */}
              {showList && (
                <div className="card">
                  <div className="card-header">Daftar Link Aktif</div>
                  <div className="card-body" style={{padding:0}}>
                    <div className="table-wrapper">
                      <table className="table">
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
                              <td><img src={`https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=32`} width="24" height="24" style={{borderRadius:4}} onError={(e:any)=>e.target.style.display='none'} /></td>
                              <td><b style={{color:'#4f46e5'}}>{link.id}</b></td>
                              <td><div className="col-url">{link.url}</div></td>
                              <td style={{textAlign:'center', fontWeight:'bold', color:'#3b82f6'}}>{link.clicks}</td>
                              <td className="col-action">
                                <button className="btn-icon" title="Copy" onClick={()=>copyText(`https://tollsfakelink.vercel.app/${link.id}`)}>
                                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                                </button>
                                <button className="btn-icon" title="Edit" onClick={()=>startEdit(link)}>
                                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                                </button>
                                <button className="btn-icon delete" title="Hapus" onClick={()=>handleDelete(link.id)}>
                                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Pagination */}
                    <div style={{padding:20, display:'flex', justifyContent:'center', gap:10}}>
                      <button className="btn btn-outline" style={{padding:'5px 12px', height:'auto'}} disabled={currentPage===1} onClick={()=>setCurrentPage(c=>c-1)}>Prev</button>
                      <span style={{fontSize:13, alignSelf:'center'}}>Page {currentPage} / {totalPages||1}</span>
                      <button className="btn btn-outline" style={{padding:'5px 12px', height:'auto'}} disabled={currentPage>=totalPages} onClick={()=>setCurrentPage(c=>c+1)}>Next</button>
                    </div>
                  </div>
                </div>
              )}

              {/* SETTINGS PANEL */}
              {showSettings && (
                <div className="card">
                  <div className="card-header">Konfigurasi</div>
                  <div className="card-body">
                    <div style={{background:'#f1f5f9', padding:15, borderRadius:8, marginBottom:20, display:'flex', alignItems:'center'}}>
                      <input type="checkbox" checked={settings.offer_active} onChange={e=>setSettings({...settings, offer_active:e.target.checked})} style={{width:18, height:18, marginRight:12}} />
                      <span style={{fontWeight:600, color:'#0f172a'}}>Aktifkan Redirect Offer?</span>
                    </div>

                    <div className="form-group">
                      <label className="label">Nama Situs</label>
                      <input className="input" value={settings.site_name} onChange={e=>setSettings({...settings, site_name:e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="label">URL Offer (Target)</label>
                      <textarea className="input" style={{height:'auto', paddingTop:10}} rows={2} value={settings.offer_url} onChange={e=>setSettings({...settings, offer_url:e.target.value})}></textarea>
                    </div>
                    <div className="form-group">
                      <label className="label">Histats ID</label>
                      <input className="input" value={settings.histats_id} onChange={e=>setSettings({...settings, histats_id:e.target.value})} />
                    </div>
                    <button className="btn btn-primary btn-full" onClick={saveSettings}>SIMPAN PENGATURAN</button>
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
