'use client';

import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '@/data/supabase';

export default function Home() {
  // STATE DATA
  const [session, setSession] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    site_name: 'ShortCuts',
    offer_url: '',
    offer_active: false,
    histats_id: ''
  });

  // STATE INPUT
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  
  // STATE EDIT
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editUrlVal, setEditUrlVal] = useState("");

  // STATE UI
  const [viewState, setViewState] = useState<'input'|'loading'|'result'>('input');
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showList, setShowList] = useState(false);
  const [toast, setToast] = useState<{msg: string} | null>(null);

  // INIT
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadData();
    });
    supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (session) loadData();
    });
  }, []);

  // TOAST TIMER
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

  const showNotif = (msg: string) => setToast({ msg });

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

    // Animasi Progress Bar
    let p = 0;
    const interval = setInterval(() => {
      p += 10;
      if(p > 90) p = 90;
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
          setShortUrl(`https://tollsfakelink.vercel.app/${data.shortId}`);
          setViewState('result');
          setLongUrl("");
          fetchLinks();
          showNotif("Link Berhasil Dibuat!");
        } else {
          setViewState('input');
          showNotif(data.error);
        }
      }, 500);
    } catch {
      setViewState('input');
      showNotif("Error Koneksi");
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Hapus link ini?")) return;
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
    showNotif("Link Updated");
  };

  const saveSettings = async () => {
    await supabase.from('settings').update({
      site_name: settings.site_name,
      offer_url: settings.offer_url,
      offer_active: settings.offer_active,
      histats_id: settings.histats_id
    }).eq('id', 1);
    showNotif("Pengaturan Disimpan");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotif("Tersalin!");
  };

  // --- RENDER ---
  return (
    <>
      {toast && <div className="custom-toast">{toast.msg}</div>}

      {/* LOGIN POPUP */}
      {!session && (
        <div className="login-overlay">
          <div className="login-box">
            <h3 style={{marginTop:0, marginBottom:20, fontWeight:'bold', color:'#333'}}>LOGIN ADMIN</h3>
            <form onSubmit={handleLogin}>
              <div style={{marginBottom:15}}>
                <input className="form-control" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
              </div>
              <div style={{marginBottom:20}}>
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
                <span className="material-icons" style={{color:'#337ab7'}}>link</span>
                {settings.site_name}
              </a>
              <button onClick={async()=>{await supabase.auth.signOut(); setLinks([])}} className="btn-logout">LOGOUT</button>
            </div>
          </nav>

          <div className="container">
            <div style={{maxWidth:700, margin:'0 auto'}}>
              
              {/* PANEL UTAMA */}
              <div className="panel">
                <div className="panel-header">
                  <h3 className="panel-title">{editingId ? 'Edit Link' : 'Buat Short Link'}</h3>
                </div>
                <div className="panel-body">
                  
                  {/* EDIT FORM */}
                  {editingId ? (
                    <div>
                      <label>URL Asli:</label>
                      <input className="form-control" value={editUrlVal} onChange={e=>setEditUrlVal(e.target.value)} style={{marginBottom:15}} />
                      <button className="btn btn-success" onClick={saveEdit} style={{marginRight:10}}>SIMPAN</button>
                      <button className="btn btn-default" style={{background:'#eee'}} onClick={()=>setEditingId(null)}>BATAL</button>
                    </div>
                  ) : (
                    <>
                      {/* INPUT FORM */}
                      {viewState === 'input' && (
                        <form onSubmit={handleShorten}>
                          <div className="input-group">
                            <input className="form-control" placeholder="https://..." value={longUrl} onChange={e=>setLongUrl(e.target.value)} required />
                            <span className="input-group-btn">
                              <button className="btn btn-primary" type="submit">SHORTEN</button>
                            </span>
                          </div>
                        </form>
                      )}

                      {/* LOADING */}
                      {viewState === 'loading' && (
                        <div>
                          <div className="progress">
                            <div className="progress-bar-striped" style={{width: `${progress}%`}}>Process {progress}%</div>
                          </div>
                        </div>
                      )}

                      {/* RESULT */}
                      {viewState === 'result' && (
                        <div style={{textAlign:'center'}}>
                          <div className="input-group">
                            <input className="form-control" value={shortUrl} readOnly style={{fontWeight:'bold', color:'#337ab7'}} />
                            <span className="input-group-btn">
                              <button className="btn btn-success" onClick={()=>copyToClipboard(shortUrl)}>COPY</button>
                            </span>
                          </div>
                          
                          <div className="social-area">
                            <p style={{color:'#999', fontSize:12, marginBottom:10}}>Bagikan ke:</p>
                            <a href={`https://api.whatsapp.com/send?text=${shortUrl}`} target="_blank" className="social-icon bg-wa">W</a>
                            <a href={`https://www.facebook.com/sharer/sharer.php?u=${shortUrl}`} target="_blank" className="social-icon bg-fb">F</a>
                            <a href={`https://twitter.com/intent/tweet?url=${shortUrl}`} target="_blank" className="social-icon bg-tw">T</a>
                          </div>
                          
                          <div style={{marginTop:20}}>
                            <a style={{cursor:'pointer', textDecoration:'underline'}} onClick={()=>{setViewState('input'); setLongUrl('')}}>Buat Lagi</a>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* TOGGLES */}
              <div style={{textAlign:'center', marginBottom:20}}>
                <button className="btn btn-default" style={{marginRight:10}} onClick={()=>setShowList(!showList)}>
                  {showList ? 'Tutup List' : 'Lihat List Link'}
                </button>
                <button className="btn btn-default" onClick={()=>setShowSettings(!showSettings)}>
                  Pengaturan
                </button>
              </div>

              {/* LIST TABLE */}
              {showList && (
                <div className="panel">
                  <div className="panel-body" style={{padding:0}}>
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th style={{width:50}}>Img</th>
                          <th>Short Link</th>
                          <th>Original</th>
                          <th>Klik</th>
                          <th style={{textAlign:'right'}}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {links.map(link => (
                          <tr key={link.id}>
                            <td><img src={`https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=32`} style={{width:24}} onError={(e:any)=>e.target.style.display='none'} /></td>
                            <td><b style={{color:'#337ab7'}}>{link.id}</b></td>
                            <td><div style={{maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12}}>{link.url}</div></td>
                            <td><span style={{background:'#eee', padding:'2px 6px', borderRadius:3, fontSize:11}}>{link.clicks}</span></td>
                            <td style={{textAlign:'right'}}>
                              <button className="btn btn-xs btn-info" onClick={()=>copyToClipboard(`https://tollsfakelink.vercel.app/${link.id}`)} title="Copy"><span className="material-icons" style={{fontSize:14}}>content_copy</span></button>
                              <button className="btn btn-xs btn-warning" onClick={()=>startEdit(link)} title="Edit"><span className="material-icons" style={{fontSize:14}}>edit</span></button>
                              <button className="btn btn-xs btn-danger-xs" onClick={()=>handleDelete(link.id)} title="Hapus"><span className="material-icons" style={{fontSize:14}}>delete</span></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SETTINGS */}
              {showSettings && (
                <div className="panel">
                  <div className="panel-header">Konfigurasi</div>
                  <div className="panel-body">
                    
                    <div style={{background:'#f5f5f5', padding:10, borderRadius:4, marginBottom:15, border:'1px solid #eee'}}>
                      <label style={{display:'flex', alignItems:'center', cursor:'pointer'}}>
                        <input type="checkbox" checked={settings.offer_active} onChange={e=>setSettings({...settings, offer_active:e.target.checked})} style={{marginRight:10, width:18, height:18}} />
                        AKTIFKAN REDIRECT OFFER?
                      </label>
                    </div>

                    <div style={{marginBottom:10}}>
                      <label>Nama Situs</label>
                      <input className="form-control" value={settings.site_name} onChange={e=>setSettings({...settings, site_name:e.target.value})} />
                    </div>
                    <div style={{marginBottom:10}}>
                      <label>URL Offer</label>
                      <textarea className="form-control" rows={2} value={settings.offer_url} onChange={e=>setSettings({...settings, offer_url:e.target.value})}></textarea>
                    </div>
                    <div style={{marginBottom:20}}>
                      <label>Histats ID</label>
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
