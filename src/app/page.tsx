'use client';

import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '@/data/supabase';

export default function Home() {
  // --- STATE ---
  const [session, setSession] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true); // Biar gak kedip login

  // DATA
  const [links, setLinks] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    site_name: 'Yasue Tools',
    offer_url: '',
    offer_active: false,
    histats_id: ''
  });

  // INPUTS
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  
  // UI LOGIC
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editUrlVal, setEditUrlVal] = useState("");
  const [viewState, setViewState] = useState<'input'|'loading'|'result'>('input');
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showList, setShowList] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // --- INIT ---
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

  // AUTO HIDE TOAST
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
    setProgress(0);
    
    // Fake Progress Bar
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
          showNotif("Link Berhasil Dibuat!");
        } else {
          setViewState('input');
          showNotif(data.error);
        }
      }, 300);
    } catch {
      setViewState('input');
      showNotif("Error Koneksi Server");
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Yakin hapus?")) return;
    await fetch('/api/links', { method: 'DELETE', body: JSON.stringify({ id }) });
    setLinks(links.filter(l => l.id !== id));
    showNotif("Link Terhapus");
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
    showNotif("Tersalin ke Clipboard!");
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = links.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(links.length / ITEMS_PER_PAGE);

  // --- RENDER SCREEN ---
  if (authChecking) return <div style={{height:'100vh', background:'#eee'}}></div>; // Blank saat loading

  return (
    <>
      {toast && <div className="toast">{toast}</div>}

      {/* LOGIN POPUP */}
      {!session && (
        <div className="login-backdrop">
          <div className="login-panel">
            <h3 style={{marginTop:0, marginBottom:20, textAlign:'center', color:'#333'}}>ADMIN LOGIN</h3>
            <form onSubmit={handleLogin}>
              <div style={{marginBottom:15}}>
                <label style={{fontSize:12, fontWeight:'bold', color:'#777'}}>EMAIL</label>
                <input className="form-control" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
              </div>
              <div style={{marginBottom:25}}>
                <label style={{fontSize:12, fontWeight:'bold', color:'#777'}}>PASSWORD</label>
                <input className="form-control" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
              </div>
              <button className="btn btn-primary btn-block">MASUK</button>
            </form>
          </div>
        </div>
      )}

      {/* DASHBOARD */}
      {session && (
        <>
          <nav className="navbar-custom">
            <div className="container navbar-inner">
              <a href="#" className="navbar-brand">
                <span className="material-icons-round">dashboard</span>
                {settings.site_name}
              </a>
              <button onClick={async()=>{await supabase.auth.signOut(); setLinks([])}} className="btn-logout">LOGOUT</button>
            </div>
          </nav>

          <div className="container">
            <div style={{maxWidth:750, margin:'0 auto'}}>
              
              {/* CARD 1: SHORTEN / EDIT */}
              <div className="panel">
                <div className="panel-header">
                  {editingId ? 'EDIT LINK URL' : 'BUAT SHORT LINK BARU'}
                </div>
                <div className="panel-body">
                  
                  {editingId ? (
                    /* EDIT FORM */
                    <div>
                      <input className="form-control" value={editUrlVal} onChange={e=>setEditUrlVal(e.target.value)} style={{marginBottom:15}} />
                      <div style={{display:'flex', gap:10}}>
                        <button className="btn btn-success" style={{flex:1}} onClick={saveEdit}>SIMPAN</button>
                        <button className="btn btn-outline" style={{flex:1}} onClick={()=>setEditingId(null)}>BATAL</button>
                      </div>
                    </div>
                  ) : (
                    /* CREATE FORM */
                    <>
                      {viewState === 'input' && (
                        <form onSubmit={handleShorten}>
                          <div style={{display:'flex', gap:10}}>
                            <input className="form-control" placeholder="Tempel URL Panjang di sini..." value={longUrl} onChange={e=>setLongUrl(e.target.value)} required />
                            <button className="btn btn-primary">SHORTEN</button>
                          </div>
                        </form>
                      )}

                      {viewState === 'loading' && (
                        <div style={{textAlign:'center'}}>
                          <div className="progress">
                            <div className="progress-bar" style={{width: `${progress}%`}}></div>
                          </div>
                          <small style={{color:'#777'}}>Memproses Data... {progress}%</small>
                        </div>
                      )}

                      {viewState === 'result' && (
                        <div>
                          <div style={{display:'flex', gap:10}}>
                            <input className="form-control" value={shortUrl} readOnly style={{background:'#f8f9fa', color:'#3498db', fontWeight:'bold'}} />
                            <button className="btn btn-success" onClick={()=>copyText(shortUrl)}>COPY</button>
                          </div>
                          
                          <div className="social-box">
                            <div style={{fontSize:12, color:'#999'}}>Bagikan Link:</div>
                            <div className="social-icons">
                              <a href={`https://api.whatsapp.com/send?text=${shortUrl}`} target="_blank" className="icon-link bg-wa"><span className="material-icons-round" style={{color:'white'}}>chat</span></a>
                              <a href={`https://www.facebook.com/sharer/sharer.php?u=${shortUrl}`} target="_blank" className="icon-link bg-fb"><span className="material-icons-round" style={{color:'white'}}>facebook</span></a>
                              <a href={`https://twitter.com/intent/tweet?url=${shortUrl}`} target="_blank" className="icon-link bg-tw"><span className="material-icons-round" style={{color:'white'}}>rss_feed</span></a>
                            </div>
                            <div style={{marginTop:20}}>
                              <a style={{cursor:'pointer', textDecoration:'underline', color:'#3498db', fontSize:14}} onClick={()=>{setViewState('input'); setLongUrl('');}}>Buat Link Lagi</a>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* BUTTON TOGGLES */}
              <div style={{display:'flex', justifyContent:'center', gap:10, marginBottom:20}}>
                <button className="btn btn-outline" onClick={()=>setShowList(!showList)}>
                  {showList ? 'Tutup Daftar Link' : 'Lihat Daftar Link'}
                </button>
                <button className="btn btn-outline" onClick={()=>setShowSettings(!showSettings)}>
                  Pengaturan
                </button>
              </div>

              {/* TABLE LIST (HITAM & ZEBRA) */}
              {showList && (
                <div className="panel">
                  <div className="panel-header">DAFTAR LINK AKTIF</div>
                  <div className="panel-body" style={{padding:0}}>
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th style={{width:50}}>ICON</th>
                            <th>SHORT LINK</th>
                            <th>ORIGINAL</th>
                            <th style={{width:70}}>KLIK</th>
                            <th style={{textAlign:'center', width:120}}>AKSI</th>
                          </tr>
                        </thead>
                        <tbody>
                          {links.length === 0 ? (
                            <tr><td colSpan={5} style={{textAlign:'center', padding:20, color:'#999'}}>Belum ada data.</td></tr>
                          ) : currentItems.map(link => (
                            <tr key={link.id}>
                              <td style={{textAlign:'center'}}>
                                <img src={`https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=32`} style={{width:24, borderRadius:4}} onError={(e:any)=>e.target.style.display='none'} />
                              </td>
                              <td><span style={{fontWeight:'bold', color:'#3498db'}}>{link.id}</span></td>
                              <td><div style={{maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#666'}}>{link.url}</div></td>
                              <td><span style={{background:'#333', color:'#fff', padding:'2px 8px', borderRadius:10, fontSize:11}}>{link.clicks}</span></td>
                              <td style={{textAlign:'center'}}>
                                <button className="btn-action" onClick={()=>copyText(`https://tollsfakelink.vercel.app/${link.id}`)} title="Copy"><span className="material-icons-round" style={{fontSize:18}}>content_copy</span></button>
                                <button className="btn-action" onClick={()=>startEdit(link)} title="Edit"><span className="material-icons-round" style={{fontSize:18}}>edit</span></button>
                                <button className="btn-action btn-del" onClick={()=>handleDelete(link.id)} title="Hapus"><span className="material-icons-round" style={{fontSize:18}}>delete</span></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination */}
                    <div style={{padding:20, display:'flex', justifyContent:'center', gap:10}}>
                      <button className="btn btn-outline" style={{padding:'5px 10px', fontSize:12}} disabled={currentPage===1} onClick={()=>setCurrentPage(c=>c-1)}>Prev</button>
                      <span style={{fontSize:13, lineHeight:'30px'}}>Page {currentPage} / {totalPages||1}</span>
                      <button className="btn btn-outline" style={{padding:'5px 10px', fontSize:12}} disabled={currentPage>=totalPages} onClick={()=>setCurrentPage(c=>c+1)}>Next</button>
                    </div>
                  </div>
                </div>
              )}

              {/* SETTINGS PANEL */}
              {showSettings && (
                <div className="panel">
                  <div className="panel-header">KONFIGURASI SITUS</div>
                  <div className="panel-body">
                    
                    <div className="checkbox-row">
                      <label style={{width:'100%', fontWeight:'bold', color:'#333', display:'flex', alignItems:'center', cursor:'pointer'}}>
                        <input type="checkbox" checked={settings.offer_active} onChange={e=>setSettings({...settings, offer_active:e.target.checked})} />
                        AKTIFKAN REDIRECT OFFER?
                      </label>
                    </div>

                    <div style={{marginTop:15}}>
                      <label style={{fontSize:12, color:'#777', fontWeight:'bold'}}>NAMA SITUS</label>
                      <input className="form-control" value={settings.site_name} onChange={e=>setSettings({...settings, site_name:e.target.value})} />
                    </div>
                    <div style={{marginTop:15}}>
                      <label style={{fontSize:12, color:'#777', fontWeight:'bold'}}>URL OFFER (TARGET)</label>
                      <textarea className="form-control" rows={2} value={settings.offer_url} onChange={e=>setSettings({...settings, offer_url:e.target.value})}></textarea>
                    </div>
                    <div style={{marginTop:15, marginBottom:20}}>
                      <label style={{fontSize:12, color:'#777', fontWeight:'bold'}}>HISTATS ID</label>
                      <input className="form-control" value={settings.histats_id} onChange={e=>setSettings({...settings, histats_id:e.target.value})} />
                    </div>
                    <button className="btn btn-primary btn-block" onClick={saveSettings}>SIMPAN PENGATURAN</button>
                  </div>
                </div>
              )}

            </div>
          </div>

          <div className="footer">
            &copy; 2026 {settings.site_name}. All Rights Reserved.
          </div>
        </>
      )}
    </>
  );
}
