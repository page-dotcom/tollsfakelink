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

  // INPUT
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  
  // UI
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editUrlVal, setEditUrlVal] = useState("");
  const [viewState, setViewState] = useState<'input'|'loading'|'result'>('input');
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showList, setShowList] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Pagination
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

  // Timer Toast
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

  // ACTIONS
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) showNotif("Login Gagal: " + error.message);
  };

  const handleShorten = async (e: FormEvent) => {
    e.preventDefault();
    if (!longUrl) return;

    setViewState('loading');
    setProgress(0);
    
    let p = 0;
    const interval = setInterval(() => { p += 20; if(p>95) p=95; setProgress(p); }, 150);

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
          setShortUrl(`https://tollsfakelink.vercel.app/${data.shortId}`);
          setViewState('result');
          setLongUrl("");
          fetchLinks();
          showNotif("Link Siap!");
        } else {
          setViewState('input');
          showNotif(data.error);
        }
      }, 300);
    } catch { setViewState('input'); showNotif("Error Server"); }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Hapus?")) return;
    await fetch('/api/links', { method: 'DELETE', body: JSON.stringify({ id }) });
    setLinks(links.filter(l => l.id !== id));
    showNotif("Terhapus");
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
    showNotif("Link Update");
  };

  const saveSettings = async () => {
    await supabase.from('settings').update({
      site_name: settings.site_name,
      offer_url: settings.offer_url,
      offer_active: settings.offer_active,
      histats_id: settings.histats_id
    }).eq('id', 1);
    showNotif("Setting Tersimpan");
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotif("Copied!");
  };

  const currentItems = links.slice((currentPage-1)*ITEMS_PER_PAGE, currentPage*ITEMS_PER_PAGE);
  const totalPages = Math.ceil(links.length / ITEMS_PER_PAGE);

  // --- RENDER ---
  if (authChecking) return null; 

  return (
    <>
      {toast && <div className="toast">{toast}</div>}

      {/* LOGIN POPUP (SVG ICON + GAK KOTAK BANGET) */}
      {!session && (
        <div className="login-overlay">
          <div className="login-box">
            <div className="login-icon-wrap">
              {/* ICON GEMBOK */}
              <svg width="30" height="30" viewBox="0 0 24 24" fill="#333"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
            </div>
            <h3 style={{marginTop:0, marginBottom:20, color:'#333'}}>ADMIN ACCESS</h3>
            <form onSubmit={handleLogin}>
              <div style={{marginBottom:15}}>
                <input className="form-control" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
              </div>
              <div style={{marginBottom:25}}>
                <input className="form-control" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
              </div>
              <button className="btn btn-primary btn-block">MASUK DASHBOARD</button>
            </form>
          </div>
        </div>
      )}

      {/* DASHBOARD */}
      {session && (
        <>
          <nav className="navbar-custom">
            <div className="container" style={{display:'flex', justifyContent:'space-between'}}>
              <a href="#" className="navbar-brand">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
                {settings.site_name}
              </a>
              <button onClick={async()=>{await supabase.auth.signOut(); setLinks([])}} className="btn-logout">LOGOUT</button>
            </div>
          </nav>

          <div className="container">
            <div style={{maxWidth:700, margin:'0 auto'}}>
              
              {/* CARD UTAMA */}
              <div className="panel">
                <div className="panel-header">
                  {editingId ? 'Edit Link' : 'Buat Short Link Baru'}
                </div>
                <div className="panel-body">
                  
                  {editingId ? (
                    <div>
                      <input className="form-control" value={editUrlVal} onChange={e=>setEditUrlVal(e.target.value)} style={{marginBottom:15}} />
                      <div style={{display:'flex', gap:10}}>
                        <button className="btn btn-success" style={{flex:1}} onClick={saveEdit}>SIMPAN</button>
                        <button className="btn btn-danger" style={{flex:1}} onClick={()=>setEditingId(null)}>BATAL</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* INPUT */}
                      {viewState === 'input' && (
                        <form onSubmit={handleShorten}>
                          <div className="input-group">
                            <input className="form-control" placeholder="Tempel URL Panjang di sini..." value={longUrl} onChange={e=>setLongUrl(e.target.value)} required />
                            <button className="btn btn-primary">SHORTEN</button>
                          </div>
                        </form>
                      )}

                      {/* LOADING */}
                      {viewState === 'loading' && (
                        <div style={{textAlign:'center'}}>
                          <div style={{background:'#f1f1f1', height:8, borderRadius:10, overflow:'hidden', marginBottom:10}}>
                            <div style={{width:`${progress}%`, background:'#3498db', height:'100%', transition:'width 0.2s'}}></div>
                          </div>
                          <small style={{color:'#777'}}>Memproses... {progress}%</small>
                        </div>
                      )}

                      {/* RESULT */}
                      {viewState === 'result' && (
                        <div>
                          <div className="input-group">
                            <input className="form-control" value={shortUrl} readOnly style={{background:'#fff', fontWeight:'bold', color:'#3498db'}} />
                            <button className="btn btn-success" onClick={()=>copyText(shortUrl)}>COPY</button>
                          </div>
                          
                          <div style={{marginTop:20, textAlign:'center', borderTop:'1px dashed #ddd', paddingTop:15}}>
                            <small style={{color:'#999'}}>Bagikan Ke:</small>
                            <div className="social-row">
                              <a href={`https://api.whatsapp.com/send?text=${shortUrl}`} target="_blank" className="social-link bg-wa"><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
                              <a href={`https://www.facebook.com/sharer/sharer.php?u=${shortUrl}`} target="_blank" className="social-link bg-fb"><svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
                              <a href={`https://twitter.com/intent/tweet?url=${shortUrl}`} target="_blank" className="social-link bg-tw"><svg viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg></a>
                              <a href={`https://t.me/share/url?url=${shortUrl}`} target="_blank" className="social-link bg-tg"><svg viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg></a>
                            </div>
                            <div style={{marginTop:15}}>
                              <a style={{cursor:'pointer', textDecoration:'underline', fontSize:13, color:'#3498db'}} onClick={()=>{setViewState('input'); setLongUrl('');}}>Buat Lagi</a>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* TOGGLE BUTTONS */}
              <div style={{display:'flex', gap:10, justifyContent:'center', marginBottom:20}}>
                <button className="btn btn-outline" style={{background:'#fff', border:'1px solid #ccc', color:'#555'}} onClick={()=>setShowList(!showList)}>
                  {showList ? 'Tutup Daftar Link' : 'Lihat Daftar Link'}
                </button>
                <button className="btn btn-outline" style={{background:'#fff', border:'1px solid #ccc', color:'#555'}} onClick={()=>setShowSettings(!showSettings)}>
                  Pengaturan
                </button>
              </div>

              {/* LIST TABLE (FIXED ALIGNMENT) */}
              {showList && (
                <div className="panel">
                  <div className="panel-header">DAFTAR LINK AKTIF</div>
                  <div className="panel-body" style={{padding:0}}>
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th style={{width:50}}>Icon</th>
                            <th>Short Link</th>
                            <th>Original</th>
                            <th style={{width:60}}>Klik</th>
                            <th className="td-action">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {links.map(link => (
                            <tr key={link.id}>
                              <td><img src={`https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=32`} style={{width:24, borderRadius:4}} onError={(e:any)=>e.target.style.display='none'} /></td>
                              <td><b style={{color:'#3498db'}}>{link.id}</b></td>
                              <td><div style={{maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#777'}}>{link.url}</div></td>
                              <td><span style={{background:'#eee', padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:600}}>{link.clicks}</span></td>
                              {/* KOLOM AKSI (SEJAJAR) */}
                              <td className="td-action">
                                <button className="btn-icon" title="Copy" onClick={()=>copyText(`https://tollsfakelink.vercel.app/${link.id}`)}>
                                  <span className="material-icons-round" style={{fontSize:16}}>content_copy</span>
                                </button>
                                <button className="btn-icon" title="Edit" onClick={()=>startEdit(link)}>
                                  <span className="material-icons-round" style={{fontSize:16}}>edit</span>
                                </button>
                                <button className="btn-icon del" title="Hapus" onClick={()=>handleDelete(link.id)}>
                                  <span className="material-icons-round" style={{fontSize:16}}>delete</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* PAGINATION */}
                    <div style={{padding:20, textAlign:'center', display:'flex', justifyContent:'center', gap:10}}>
                      <button className="btn btn-outline" style={{padding:'5px 15px'}} disabled={currentPage===1} onClick={()=>setCurrentPage(c=>c-1)}>Prev</button>
                      <span style={{fontSize:13, lineHeight:'30px'}}>Page {currentPage} / {totalPages||1}</span>
                      <button className="btn btn-outline" style={{padding:'5px 15px'}} disabled={currentPage>=totalPages} onClick={()=>setCurrentPage(c=>c+1)}>Next</button>
                    </div>
                  </div>
                </div>
              )}

              {/* SETTINGS PANEL */}
              {showSettings && (
                <div className="panel">
                  <div className="panel-header">KONFIGURASI</div>
                  <div className="panel-body">
                    
                    <div className="check-area">
                      <label style={{display:'flex', alignItems:'center', cursor:'pointer', width:'100%', fontWeight:'bold', color:'#333'}}>
                        <input type="checkbox" checked={settings.offer_active} onChange={e=>setSettings({...settings, offer_active:e.target.checked})} />
                        AKTIFKAN REDIRECT OFFER?
                      </label>
                    </div>

                    <div style={{marginTop:15}}>
                      <label style={{fontSize:12, fontWeight:'bold', color:'#777'}}>NAMA SITUS</label>
                      <input className="form-control" value={settings.site_name} onChange={e=>setSettings({...settings, site_name:e.target.value})} />
                    </div>
                    <div style={{marginTop:15}}>
                      <label style={{fontSize:12, fontWeight:'bold', color:'#777'}}>URL OFFER</label>
                      <textarea className="form-control" rows={2} value={settings.offer_url} onChange={e=>setSettings({...settings, offer_url:e.target.value})}></textarea>
                    </div>
                    <div style={{marginTop:15, marginBottom:20}}>
                      <label style={{fontSize:12, fontWeight:'bold', color:'#777'}}>HISTATS ID</label>
                      <input className="form-control" value={settings.histats_id} onChange={e=>setSettings({...settings, histats_id:e.target.value})} />
                    </div>
                    <button className="btn btn-primary btn-block" onClick={saveSettings}>SIMPAN PENGATURAN</button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </>
      )}
    </>
  );
}
