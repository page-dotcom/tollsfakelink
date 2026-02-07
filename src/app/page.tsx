'use client';

import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '@/data/supabase';

export default function Home() {
  // --- STATE ---
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

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
  
  // STATE TOGGLE (Ini yang bikin error kemarin, sekarang diperbaiki)
  const [showList, setShowList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Edit & Feedback
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrlVal, setEditUrlVal] = useState("");
  const [btnCopyText, setBtnCopyText] = useState("COPY");
  const [btnSaveText, setBtnSaveText] = useState("SIMPAN PENGATURAN");
  const [saveBtnColor, setSaveBtnColor] = useState("");

  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'|''} | null>(null);

  // --- INIT ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadData();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadData();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  function loadData() {
    fetchSettings();
    fetchLinks();
  }

  // --- AUTH ---
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoginLoading(false);
    if (error) showToast("Login Gagal: " + error.message, "error");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLinks([]);
  };

  // --- API ---
  async function fetchSettings() {
    const { data } = await supabase.from('settings').select('*').single();
    if (data) {
      setSettings(data);
      document.title = data.site_name;
    }
  }

  async function fetchLinks() {
    const { data } = await supabase.from('links').select('*').order('created_at', { ascending: false });
    if (data) setLinks(data);
  }

  // --- ACTIONS ---
  const showToast = (msg: string, type: 'success'|'error') => {
    setToast({ msg, type });
  };

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
          setCurrentPage(1); 
          showToast("Link Ready!", "success");
        } else {
          setViewState('form');
          showToast("Gagal", "error");
        }
      }, 500);
    } catch { setViewState('form'); }
  };

  const handleCopy = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    if(!id) {
      setBtnCopyText("COPIED!");
      setTimeout(() => setBtnCopyText("COPY"), 1500);
      showToast("Link disalin", "success");
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
    // Hapus dulu dari layar (Biar kerasa cepet)
    const prev = [...links];
    setLinks(links.filter(l => l.id !== id));
    
    const { error } = await supabase.from('links').delete().eq('id', id);
    if (error) {
        setLinks(prev); // Balikin kalo gagal
        showToast("Gagal hapus", "error");
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
    showToast("Link diupdate", "success");
  };

  const handleSaveSettings = async () => {
    setBtnSaveText("MENYIMPAN...");
    await supabase.from('settings').update({
      site_name: settings.site_name,
      offer_url: settings.offer_url,
      histats_id: settings.histats_id
    }).eq('id', 1);
    
    setBtnSaveText("BERHASIL!");
    setSaveBtnColor("#27ae60");
    document.title = settings.site_name;
    setTimeout(() => {
        setBtnSaveText("SIMPAN PENGATURAN");
        setSaveBtnColor("");
    }, 2000);
  };

  const getFavicon = (url: string) => {
    try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`; } 
    catch { return ""; }
  };

  // --- LOGIKA PAGINATION ---
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = links.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(links.length / ITEMS_PER_PAGE);

  const prevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
  const nextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };

  // --- RENDER ---
  return (
    <>
      {/* 1. TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'success' ? '#27ae60' : '#e74c3c',
          color: '#fff', padding: '10px 20px', borderRadius: '50px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.3)', zIndex: 99999, fontWeight: 600, fontSize: '13px'
        }}>
          {toast.msg}
        </div>
      )}

      {/* 2. LOGIN POPUP */}
      {!session && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: '#fff', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{padding: '30px', width: '90%', maxWidth: '350px', textAlign:'center'}}>
            <h3 style={{fontWeight:'bold', color:'#333'}}>LOGIN ADMIN</h3>
            <form onSubmit={handleLogin} style={{marginTop:'20px'}}>
              <input type="email" placeholder="Email" className="form-control input-lg" style={{marginBottom:'10px'}} value={email} onChange={e => setEmail(e.target.value)} required />
              <input type="password" placeholder="Password" className="form-control input-lg" style={{marginBottom:'20px'}} value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="submit" disabled={loginLoading} className="btn btn-primary btn-block btn-lg">
                {loginLoading ? 'Loading...' : 'MASUK'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. MAIN APP */}
      {session && (
        <>
          {/* HEADER FIX RAPI */}
          <nav className="navbar navbar-custom navbar-fixed-top">
            <div className="container-fluid" style={{display:'flex', justifyContent:'space-between', alignItems:'center', height:'100%'}}>
              <div className="navbar-header" style={{float:'none'}}>
                <a className="navbar-brand" href="#" style={{display:'flex', alignItems:'center', gap:'10px'}}>
                  <svg className="brand-icon-svg" viewBox="0 0 24 24" style={{width:28, height:28, fill:'#3498db'}}>
                    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-3.31-2.69-6-6-6c-3.31,0-6,2.69-6,6c0,2.22,1.21,4.15,3,5.19V19 c-2.97-1.35-5-4.42-5-8c0-4.97,4.03-9,9-9s9,4.03,9,9c0,1.86-0.55,3.61-1.5,5.1l-1.45-1.45C18.78,14.16,19.04,13.57,19.14,12.94z M9.64,12.56L7.52,14.68C7.36,14.54,7.18,14.4,7,14.25V17c1.32-0.84,2.2-2.31,2.2-4C9.2,12.89,9.36,12.75,9.64,12.56z M12,8 c2.21,0,4,1.79,4,4s-1.79,4-4,4s-4-1.79-4-4S9.79,8,12,8z"/>
                  </svg>
                  {settings.site_name}
                </a>
              </div>
              <div>
                 <button onClick={handleLogout} className="btn btn-sm btn-danger">
                   <span className="glyphicon glyphicon-log-out"></span> LOGOUT
                 </button>
              </div>
            </div>
          </nav>

          <div className="container">
            <div className="row">
              <div className="col-md-8 col-md-offset-2 col-sm-10 col-sm-offset-1 col-xs-12">
                
                <div className="tool-box">
                  <div className="tool-header">
                    <h2 id="box-title">{editingId ? "Edit URL" : (viewState === 'result' ? "Link Ready!" : "Shorten URL")}</h2>
                    {!editingId && viewState === 'form' && <p className="simple-desc" id="desc-text">Paste long URL below</p>}
                  </div>

                  <div className="tool-body">
                    {!editingId && viewState === 'form' && (
                      <div id="form-view">
                        <form onSubmit={handleShorten}>
                          <div className="input-group input-group-lg">
                            <input type="url" className="form-control input-lg-custom" placeholder="https://..." required value={longUrl} onChange={(e) => setLongUrl(e.target.value)} />
                            <span className="input-group-btn">
                              <button className="btn btn-lg-custom" type="submit">SHORTEN</button>
                            </span>
                          </div>
                        </form>
                      </div>
                    )}

                    {!editingId && viewState === 'loading' && (
                      <div id="loading-area" style={{textAlign:'center'}}>
                        <h2 style={{color:'#3498db', fontWeight:700}}>{progress}%</h2>
                        <small style={{color:'#bbb'}}>PROCESSING...</small>
                      </div>
                    )}

                    {!editingId && viewState === 'result' && (
                      <div id="result-view">
                        <div className="input-group input-group-lg">
                          <input type="text" className="form-control input-lg-custom input-result" value={shortUrl} readOnly />
                          <span className="input-group-btn">
                            <button className="btn btn-lg-custom btn-copy-default" onClick={() => handleCopy(shortUrl)}>{btnCopyText}</button>
                          </span>
                        </div>
                        <span className="reset-link" onClick={() => { setViewState('form'); setLongUrl(""); }} style={{display:'block', marginTop:15, textAlign:'center', cursor:'pointer', color:'#999'}}>Shorten another link</span>
                        
                        <div style={{display:'flex', justifyContent:'center', gap:'10px', marginTop:'20px'}}>
                           <a href={`https://api.whatsapp.com/send?text=${shortUrl}`} target="_blank" style={{width:40,height:40,background:'#25D366',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff'}}><span className="glyphicon glyphicon-comment"></span></a>
                           <a href={`https://www.facebook.com/sharer/sharer.php?u=${shortUrl}`} target="_blank" style={{width:40,height:40,background:'#1877F2',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff'}}><span className="glyphicon glyphicon-share"></span></a>
                           <a href={`https://twitter.com/intent/tweet?url=${shortUrl}`} target="_blank" style={{width:40,height:40,background:'#000',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff'}}><span className="glyphicon glyphicon-retweet"></span></a>
                        </div>
                      </div>
                    )}

                    {editingId && (
                      <div className="edit-view" style={{marginTop:20}}>
                        <div className="input-group">
                          <input type="text" className="form-control" value={editUrlVal} onChange={(e) => setEditUrlVal(e.target.value)} style={{height:55}} />
                          <span className="input-group-btn">
                            <button className="btn btn-success" onClick={saveEdit} style={{height:55}}>SAVE</button>
                          </span>
                        </div>
                        <div style={{marginTop:10, textAlign:'right'}}>
                          <button className="btn btn-xs btn-default" onClick={() => setEditingId(null)}>CANCEL</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* TOMBOL LIST */}
                <div className="text-center">
                  <button className="btn-toggle-list" onClick={() => setShowList(!showList)} style={{background:'#34495e', color:'#fff', border:'none', padding:'10px 20px', borderRadius:'50px'}}>
                    <span className="glyphicon glyphicon-list-alt"></span> {showList ? 'HIDE LIST' : 'MY URL LIST'}
                  </button>
                </div>

                {/* LIST AREA (Pake display: block/none biar elemen tetep ada di DOM) */}
                <div className="list-box" style={{marginTop:20, background:'#fff', padding:20, borderRadius:12, display: showList ? 'block' : 'none'}}>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th style={{width:'50px'}}>Img</th>
                            <th>Short</th>
                            <th>Original</th>
                            <th>Klik</th>
                            <th className="text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentItems.length === 0 ? (
                             <tr><td colSpan={5} className="text-center">Belum ada link.</td></tr>
                          ) : (
                            currentItems.map(link => (
                              <tr key={link.id}>
                                <td><img src={getFavicon(link.url)} style={{width:25, height:25, borderRadius:4}} onError={(e)=>{e.currentTarget.style.display='none'}} /></td>
                                <td><b style={{color:'#333'}}>{link.id}</b></td>
                                <td><div style={{maxWidth:'150px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#999', fontSize:'12px'}}>{link.url}</div></td>
                                <td><span className="badge">{link.clicks || 0}</span></td>
                                <td className="text-right">
                                  <button className="btn btn-xs" onClick={() => handleCopy(`https://tollsfakelink.vercel.app/${link.id}`, link.id)} id={`btn-copy-${link.id}`}><span className="glyphicon glyphicon-copy"></span></button>
                                  <button className="btn btn-xs" onClick={() => openEdit(link.id, link.url)}><span className="glyphicon glyphicon-pencil"></span></button>
                                  <button className="btn btn-xs" onClick={() => handleDelete(link.id)} style={{color:'#e74c3c'}}><span className="glyphicon glyphicon-trash"></span></button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* PAGINATION BUTTONS */}
                    <div className="pagination-area" style={{textAlign:'center', marginTop:15, display:'flex', justifyContent:'center', gap:'10px', alignItems:'center'}}>
                      <button className="btn btn-default btn-sm" onClick={prevPage} disabled={currentPage === 1}>
                        <span className="glyphicon glyphicon-chevron-left"></span> Prev
                      </button>
                      <span style={{fontSize:'12px', color:'#777'}}>
                        Page {currentPage} of {totalPages === 0 ? 1 : totalPages}
                      </span>
                      <button className="btn btn-default btn-sm" onClick={nextPage} disabled={currentPage >= totalPages}>
                        Next <span className="glyphicon glyphicon-chevron-right"></span>
                      </button>
                    </div>
                </div>

                {/* TOMBOL SETTINGS */}
                <div className="text-center" style={{marginTop:30, marginBottom:20}}>
                  <button className="btn-gear-toggle" onClick={() => setShowSettings(!showSettings)} style={{width:40, height:40, borderRadius:'50%', background:'#fff', border:'1px solid #ddd'}}>
                    <span className="glyphicon glyphicon-cog"></span>
                  </button>
                  <div style={{fontSize:12, color:'#ccc', marginTop:5}}>Settings</div>
                </div>

                {/* SETTINGS AREA */}
                <div className="settings-panel" style={{background:'#111', color:'#fff', padding:30, borderRadius:3, marginTop:20, display: showSettings ? 'block' : 'none'}}>
                    <h4>Konfigurasi</h4>
                    <div style={{marginTop:15}}>
                        <label>Site Name</label>
                        <input type="text" className="form-control" value={settings.site_name} onChange={(e) => setSettings({...settings, site_name: e.target.value})} style={{color:'#000'}} />
                        
                        <label style={{marginTop:10}}>Offer URL</label>
                        <textarea className="form-control" rows={2} value={settings.offer_url} onChange={(e) => setSettings({...settings, offer_url: e.target.value})} style={{color:'#000'}}></textarea>
                        
                        <label style={{marginTop:10}}>Histats ID</label>
                        <input type="number" className="form-control" value={settings.histats_id} onChange={(e) => setSettings({...settings, histats_id: e.target.value})} style={{color:'#000'}} />
                        
                        <button className="btn btn-success btn-block" onClick={handleSaveSettings} style={{marginTop:20, background: saveBtnColor || '#27ae60'}}>{btnSaveText}</button>
                    </div>
                </div>

              </div>
            </div>
          </div>
          <div className="footer text-center" style={{padding:20, color:'#999', fontSize:12}}>&copy; 2026 {settings.site_name}</div>
        </>
      )}
    </>
  );
}
