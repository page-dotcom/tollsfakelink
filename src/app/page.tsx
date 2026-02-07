'use client';

import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '@/data/supabase';

export default function Home() {
  // --- AUTH STATE ---
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // --- APP STATE ---
  const [settings, setSettings] = useState({
    site_name: 'ShortCuts',
    offer_url: '',
    histats_id: ''
  });

  const [viewState, setViewState] = useState<'form' | 'loading' | 'result'>('form');
  const [progress, setProgress] = useState(0);
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  
  const [links, setLinks] = useState<any[]>([]);
  const [showList, setShowList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Edit & Feedback
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrlVal, setEditUrlVal] = useState("");
  const [btnCopyText, setBtnCopyText] = useState("COPY");
  const [btnSaveText, setBtnSaveText] = useState("SIMPAN PENGATURAN");

  // Custom Toast (Notifikasi)
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'|''} | null>(null);

  // --- CEK LOGIN SAAT BUKA WEB ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchSettings();
        fetchLinks();
      }
    });

    // Listener jika login/logout berubah
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchSettings();
        fetchLinks();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Timer Toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- FUNGSI LOGIN / LOGOUT ---
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoginLoading(false);
    
    if (error) {
      showToast("Login Gagal: " + error.message, "error");
    } else {
      showToast("Selamat Datang!", "success");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLinks([]); // Bersihkan data di layar
    showToast("Berhasil Logout", "success");
  };

  // --- API DATA ---
  async function fetchSettings() {
    const { data } = await supabase.from('settings').select('*').single();
    if (data) {
      setSettings(data);
      document.title = data.site_name;
    }
  }

  async function fetchLinks() {
    // Karena sudah login, RLS Supabase akan mengizinkan kita baca data
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data) setLinks(data);
    if (error) console.error(error);
  }

  // --- HELPER ---
  const showToast = (msg: string, type: 'success'|'error') => {
    setToast({ msg, type });
  };

  const getFavicon = (url: string) => {
    try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`; } 
    catch { return ""; }
  };

  // --- ACTIONS (Sama seperti sebelumnya) ---
  const handleShorten = async (e: FormEvent) => {
    e.preventDefault();
    if (!longUrl) return;

    setViewState('loading');
    let p = 0;
    const interval = setInterval(() => { p += 5; setProgress(p); if(p>=95) clearInterval(interval); }, 30);

    try {
      const res = await fetch('/api/save-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: longUrl })
      });
      const data = await res.json();
      
      clearInterval(interval);
      setProgress(100);

      setTimeout(() => {
        if (data.success) {
          const result = `https://tollsfakelink.vercel.app/${data.shortId}`; 
          setShortUrl(result);
          localStorage.setItem('lastLink', result);
          setViewState('result');
          setLongUrl("");
          fetchLinks(); 
          showToast("Link berhasil dibuat", "success");
        } else {
          setViewState('form');
          showToast("Gagal membuat link", "error");
        }
      }, 500);
    } catch { setViewState('form'); }
  };

  const handleCopy = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    if(!id) {
      setBtnCopyText("COPIED!");
      setTimeout(() => setBtnCopyText("COPY"), 1500);
      showToast("Tersalin ke clipboard", "success");
    } else {
      const btn = document.getElementById(`btn-copy-${id}`);
      if(btn) {
        const ori = btn.innerHTML;
        btn.innerHTML = '<span class="glyphicon glyphicon-ok"></span>';
        setTimeout(() => btn.innerHTML = ori, 1500);
      }
    }
  };

  const handleDelete = async (id: string) => {
    // UI Hapus duluan
    setLinks(links.filter(l => l.id !== id)); 
    
    const { error } = await supabase.from('links').delete().eq('id', id);
    if (error) {
      fetchLinks(); // Balikin data kalo gagal
      showToast("Gagal menghapus", "error");
    } else {
      showToast("Data dihapus", "success");
    }
  };

  const openEdit = (id: string, url: string) => {
    setEditingId(id);
    setEditUrlVal(url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveEdit = async () => {
    await supabase.from('links').update({ url: editUrlVal }).eq('id', editingId);
    setEditingId(null);
    fetchLinks();
    showToast("Data diupdate", "success");
  };

  const handleSaveSettings = async () => {
    setBtnSaveText("MENYIMPAN...");
    const { error } = await supabase.from('settings').update({
      site_name: settings.site_name,
      offer_url: settings.offer_url,
      histats_id: settings.histats_id
    }).eq('id', 1);
    
    if(!error) {
      setBtnSaveText("BERHASIL!");
      document.title = settings.site_name;
      showToast("Pengaturan disimpan", "success");
    } else {
      setBtnSaveText("GAGAL");
    }
    setTimeout(() => setBtnSaveText("SIMPAN PENGATURAN"), 2000);
  };

  // --- RENDER ---
  return (
    <>
      {/* 1. TOAST NOTIFICATION */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'success' ? '#27ae60' : '#e74c3c',
          color: '#fff', padding: '12px 25px', borderRadius: '50px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.3)', zIndex: 99999, fontWeight: 600, fontSize: '14px',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          {toast.msg}
        </div>
      )}

      {/* 2. LOGIN POPUP (JIKA BELUM LOGIN) */}
      {!session && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.85)', zIndex: 10000,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{background: '#fff', padding: '40px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}}>
            <h3 style={{marginTop:0, textAlign:'center', color:'#333', fontWeight:'bold'}}>PRIVATE ACCESS</h3>
            <p style={{textAlign:'center', color:'#777', marginBottom:'30px'}}>Silakan login untuk mengelola link.</p>
            
            <form onSubmit={handleLogin}>
              <div style={{marginBottom:'15px'}}>
                <input 
                  type="email" 
                  placeholder="Email" 
                  className="form-control input-lg" 
                  style={{width:'100%', height:'50px'}}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div style={{marginBottom:'25px'}}>
                <input 
                  type="password" 
                  placeholder="Password" 
                  className="form-control input-lg" 
                  style={{width:'100%', height:'50px'}}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={loginLoading}
                style={{
                  width:'100%', height:'50px', border:'none', borderRadius:'5px',
                  background: loginLoading ? '#ccc' : '#3498db', color:'#fff', 
                  fontWeight:'bold', fontSize:'16px', cursor: loginLoading ? 'not-allowed':'pointer'
                }}
              >
                {loginLoading ? 'MASUK...' : 'LOGIN DASHBOARD'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. DASHBOARD (HANYA MUNCUL JIKA SUDAH LOGIN) */}
      {session && (
        <>
          <nav className="navbar navbar-custom navbar-fixed-top">
            <div className="container-fluid">
              <div className="navbar-header">
                <a className="navbar-brand" href="#">
                  <svg className="brand-icon-svg" viewBox="0 0 24 24" style={{width:32, fill:'#3498db', marginRight:10}}>
                    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-3.31-2.69-6-6-6c-3.31,0-6,2.69-6,6c0,2.22,1.21,4.15,3,5.19V19 c-2.97-1.35-5-4.42-5-8c0-4.97,4.03-9,9-9s9,4.03,9,9c0,1.86-0.55,3.61-1.5,5.1l-1.45-1.45C18.78,14.16,19.04,13.57,19.14,12.94z M9.64,12.56L7.52,14.68C7.36,14.54,7.18,14.4,7,14.25V17c1.32-0.84,2.2-2.31,2.2-4C9.2,12.89,9.36,12.75,9.64,12.56z M12,8 c2.21,0,4,1.79,4,4s-1.79,4-4,4s-4-1.79-4-4S9.79,8,12,8z"/>
                  </svg>
                  {settings.site_name}
                </a>
              </div>
              
              {/* TOMBOL LOGOUT (Dipojok Kanan) */}
              <div style={{float:'right', marginTop:'15px'}}>
                <button onClick={handleLogout} style={{background:'none', border:'none', color:'#e74c3c', fontWeight:'bold', fontSize:'12px'}}>
                  LOGOUT <span className="glyphicon glyphicon-log-out"></span>
                </button>
              </div>
            </div>
          </nav>

          <div className="container">
            <div className="row">
              <div className="col-md-8 col-md-offset-2 col-sm-10 col-sm-offset-1 col-xs-12">
                
                <div className="tool-box">
                  <div className="tool-header">
                    <h2 id="box-title">
                      {editingId ? "Edit URL" : (viewState === 'result' ? "Link Ready!" : "Shorten URL")}
                    </h2>
                    {!editingId && viewState === 'form' && (
                      <p className="simple-desc" id="desc-text">Paste long URL below</p>
                    )}
                  </div>

                  <div className="tool-body">
                    {/* FORM */}
                    {!editingId && viewState === 'form' && (
                      <div id="form-view">
                        <form onSubmit={handleShorten}>
                          <div className="input-group input-group-lg">
                            <input type="url" id="oriUrl" className="form-control input-lg-custom" placeholder="https://..." required value={longUrl} onChange={(e) => setLongUrl(e.target.value)} />
                            <span className="input-group-btn">
                              <button className="btn btn-lg-custom" type="submit">SHORTEN</button>
                            </span>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* LOADING */}
                    {!editingId && viewState === 'loading' && (
                      <div id="loading-area" style={{display:'block', textAlign:'center'}}>
                        <h2 style={{margin:'10px 0', color:'#3498db', fontWeight:700}} id="p-percent">{progress}%</h2>
                        <small style={{color:'#bbb', letterSpacing:'1px'}}>PROCESSING LINK...</small>
                      </div>
                    )}

                    {/* RESULT */}
                    {!editingId && viewState === 'result' && (
                      <div id="result-view" style={{display:'block'}}>
                        <div className="input-group input-group-lg">
                          <input type="text" id="resUrl" className="form-control input-lg-custom input-result" value={shortUrl} readOnly />
                          <span className="input-group-btn">
                            <button className="btn btn-lg-custom btn-copy-default" id="btnCopy" type="button" onClick={() => handleCopy(shortUrl)}>
                              {btnCopyText}
                            </button>
                          </span>
                        </div>
                        <span className="reset-link" style={{display:'block', marginTop:15, cursor:'pointer', textDecoration:'underline', color:'#999'}} 
                              onClick={() => { setViewState('form'); setLongUrl(""); localStorage.removeItem('lastLink'); }}>
                            Shorten another link
                        </span>

                        {/* SHARE AREA (INLINE STYLE BIAR MUNCUL) */}
                        <div style={{display:'flex', justifyContent:'center', gap:'10px', marginTop:'25px'}}>
                            <a href={`https://api.whatsapp.com/send?text=${shortUrl}`} target="_blank" style={{width:40,height:40,borderRadius:'50%',background:'#25D366',display:'flex',alignItems:'center',justifyContent:'center'}}><svg viewBox="0 0 24 24" style={{width:20,fill:'#fff'}}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
                            <a href={`https://www.facebook.com/sharer/sharer.php?u=${shortUrl}`} target="_blank" style={{width:40,height:40,borderRadius:'50%',background:'#1877F2',display:'flex',alignItems:'center',justifyContent:'center'}}><svg viewBox="0 0 24 24" style={{width:20,fill:'#fff'}}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
                            <a href={`https://t.me/share/url?url=${shortUrl}`} target="_blank" style={{width:40,height:40,borderRadius:'50%',background:'#0088cc',display:'flex',alignItems:'center',justifyContent:'center'}}><svg viewBox="0 0 24 24" style={{width:20,fill:'#fff'}}><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg></a>
                        </div>
                      </div>
                    )}

                    {/* EDIT FORM */}
                    {editingId && (
                      <div className="edit-view" style={{marginTop:20}}>
                        <div className="input-group">
                          <input type="text" className="form-control" value={editUrlVal} onChange={(e) => setEditUrlVal(e.target.value)} style={{height:55}} />
                          <span className="input-group-btn">
                            <button className="btn btn-success" type="button" onClick={saveEdit} style={{height:55, padding:'0 20px'}}>SAVE</button>
                          </span>
                        </div>
                        <div style={{marginTop:10, textAlign:'right'}}>
                          <button className="btn btn-xs btn-default" onClick={() => setEditingId(null)}>CANCEL</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* LIST BUTTON */}
                <div className="text-center">
                  <button className={`btn-toggle-list ${showList ? 'active' : ''}`} id="btnShowList" onClick={() => setShowList(!showList)} 
                    style={{background:'#34495e', color:'#fff', border:'none', padding:'10px 20px', borderRadius:'50px', fontWeight:600}}>
                    <span className="glyphicon glyphicon-list-alt" style={{marginRight:5}}></span> 
                    {showList ? 'HIDE LIST' : 'MY URL LIST'}
                  </button>
                </div>

                {/* URL LIST AREA */}
                {showList && (
                  <div className="list-box" id="urlListArea" style={{display:'block', marginTop:20, background:'#fff', borderRadius:12, padding:20, boxShadow:'0 5px 20px rgba(0,0,0,0.05)'}}>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr><th>Image</th><th>Short Link</th><th>Original URL</th><th>Clicks</th><th>Date</th><th className="text-right">Action</th></tr>
                        </thead>
                        <tbody id="listBody">
                          {links.length === 0 ? (
                            <tr><td colSpan={6} className="text-center" style={{padding:20}}>Belum ada data link.</td></tr>
                          ) : (
                            links.map(link => (
                              <tr key={link.id}>
                                <td><img src={getFavicon(link.url)} style={{width:35, height:35, borderRadius:8, background:'#eee'}} onError={(e)=>{e.currentTarget.style.display='none'}} /></td>
                                <td><div className="short-link-text">{link.id}</div></td>
                                <td><span className="ori-link-text" style={{display:'block', maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#999'}}>{link.url}</span></td>
                                <td><span className="badge" style={{background:'#3498db'}}>{link.clicks || 0}</span></td>
                                <td style={{color:'#888', fontSize:13}}>{new Date(link.created_at).toLocaleDateString()}</td>
                                <td className="text-right">
                                  <button className="btn-action-icon" style={{border:'none', background:'none', color:'#bbb'}} onClick={() => handleCopy(`https://tollsfakelink.vercel.app/${link.id}`, link.id)}><span id={`btn-copy-${link.id}`} className="glyphicon glyphicon-copy"></span></button>
                                  <button className="btn-action-icon" style={{border:'none', background:'none', color:'#bbb'}} onClick={() => openEdit(link.id, link.url)}><span className="glyphicon glyphicon-pencil"></span></button>
                                  <button className="btn-action-icon btn-del" style={{border:'none', background:'none', color:'#bbb'}} onClick={() => handleDelete(link.id)}><span className="glyphicon glyphicon-trash"></span></button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SETTINGS BUTTON */}
                <div className="text-center" style={{marginTop:30, marginBottom:20}}>
                  <button className="btn-gear-toggle" id="btnShowSettings" onClick={() => setShowSettings(!showSettings)} style={{width:40, height:40, borderRadius:'50%', background: showSettings?'#3498db':'#fff', color: showSettings?'#fff':'#555', border:'1px solid #ddd'}}>
                    <span className="glyphicon glyphicon-cog"></span>
                  </button>
                  <div style={{fontSize:12, color:'#ccc', marginTop:5}}>Settings</div>
                </div>

                {/* SETTINGS PANEL */}
                {showSettings && (
                  <div className="settings-panel" id="settingsArea" style={{display:'block', background:'#2c3e50', color:'#fff', padding:30, borderRadius:12, marginTop:20}}>
                    <div className="settings-header">
                      <h4 style={{marginTop:0}}><span className="glyphicon glyphicon-wrench" style={{fontSize:16}}></span> Konfigurasi Situs</h4>
                    </div>
                    <div className="settings-body" style={{marginTop:20}}>
                        <div className="form-group">
                          <label>Site Name</label>
                          <div className="input-group">
                            <span className="input-group-addon" style={{color:'#000'}}><i className="glyphicon glyphicon-home"></i></span>
                            <input type="text" className="form-control" value={settings.site_name} onChange={(e) => setSettings({...settings, site_name: e.target.value})} style={{color:'#000'}} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>URL Offer / Redirect Traffic</label>
                          <div className="input-group">
                            <span className="input-group-addon" style={{color:'#000'}}><i className="glyphicon glyphicon-share-alt"></i></span>
                            <textarea className="form-control" rows={2} value={settings.offer_url} onChange={(e) => setSettings({...settings, offer_url: e.target.value})} style={{color:'#000'}}></textarea>
                          </div>
                          <p className="help-block" style={{fontSize:12, color:'#ccc'}}>Link tujuan jika visitor membuka root domain.</p>
                        </div>
                        <div className="form-group">
                          <label>Histats / Analytics ID</label>
                          <div className="input-group">
                            <span className="input-group-addon" style={{color:'#000'}}><i className="glyphicon glyphicon-stats"></i></span>
                            <input type="number" className="form-control" value={settings.histats_id} onChange={(e) => setSettings({...settings, histats_id: e.target.value})} style={{color:'#000'}} />
                          </div>
                        </div>
                        <div style={{marginTop:25}}>
                          <button type="button" className="btn btn-block btn-save" onClick={handleSaveSettings} style={{background:'#27ae60', color:'#fff'}}>{btnSaveText}</button>
                        </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          <div className="footer text-center" style={{padding:20, color:'#999', fontSize:12}}>
            &copy; 2026 {settings.site_name}. All Rights Reserved.
          </div>
        </>
      )}
    </>
  );
}
