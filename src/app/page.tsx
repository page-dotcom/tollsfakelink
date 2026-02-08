'use client';

import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '@/data/supabase';

export default function Home() {
  // --- AUTH & DATA ---
  const [session, setSession] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    site_name: 'ShortCuts',
    offer_url: '',
    offer_active: false,
    histats_id: ''
  });

  // --- INPUTS ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [editUrlVal, setEditUrlVal] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- UI STATES ---
  const [viewState, setViewState] = useState<'form' | 'loading' | 'result'>('form');
  const [progress, setProgress] = useState(0);
  const [showList, setShowList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  
  // --- PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // --- FEEDBACK ---
  const [copyBtnText, setBtnCopyText] = useState("COPY");
  
  // PERBAIKAN DISINI: Nama variabel disamakan
  const [btnSaveText, setBtnSaveText] = useState("SIMPAN PENGATURAN"); 
  const [saveBtnColor, setSaveBtnColor] = useState(""); // Tambahan biar gak error warna
  
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
    supabase.from('settings').select('*').single().then(({ data }) => {
      if (data) {
        setSettings(data);
        document.title = data.site_name;
      }
    });
    fetchLinks();
  }

  async function fetchLinks() {
    const res = await fetch('/api/links');
    const json = await res.json();
    if (json.success) setLinks(json.data || []);
  }

  // --- ACTIONS ---
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

  const handleShorten = async (e: FormEvent) => {
    e.preventDefault();
    if (!longUrl) return;

    setViewState('loading');
    let p = 0;
    const interval = setInterval(() => { p += 10; setProgress(p); if(p>=90) clearInterval(interval); }, 50);

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
          showToast("Link berhasil dibuat!", "success");
        } else {
          setViewState('form');
          showToast(data.error || "Gagal membuat link", "error");
        }
      }, 500);
    } catch (err: any) {
      setViewState('form');
      showToast("Error Koneksi", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Hapus link ini?")) return;
    await fetch('/api/links', { method: 'DELETE', body: JSON.stringify({ id }) });
    setLinks(links.filter(l => l.id !== id));
    showToast("Link dihapus", "success");
  };

  const handleSaveSettings = async () => {
    // FIX: Menggunakan nama variabel yang benar (setBtnSaveText)
    setBtnSaveText("MENYIMPAN...");
    
    await supabase.from('settings').update({
      site_name: settings.site_name,
      offer_url: settings.offer_url,
      offer_active: settings.offer_active,
      histats_id: settings.histats_id
    }).eq('id', 1);
    
    setBtnSaveText("BERHASIL!");
    setSaveBtnColor("#27ae60"); // Hijau
    
    document.title = settings.site_name;
    setTimeout(() => {
        setBtnSaveText("SIMPAN PENGATURAN");
        setSaveBtnColor(""); // Reset warna
    }, 2000);
  };

  // Helper UI
  const showToast = (msg: string, type: 'success'|'error') => setToast({ msg, type });
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setBtnCopyText("COPIED!");
    setTimeout(() => setBtnCopyText("COPY"), 1500);
  };
  const getFavicon = (url: string) => {
    try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`; }
    catch { return ""; }
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = links.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(links.length / ITEMS_PER_PAGE);

  return (
    <>
      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'success' ? '#27ae60' : '#c0392b', color: '#fff',
          padding: '10px 20px', borderRadius: 50, zIndex: 99999, fontWeight: 'bold'
        }}>
          {toast.msg}
        </div>
      )}

      {/* LOGIN POPUP */}
      {!session && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'#fff', zIndex:10000, display:'flex', justifyContent:'center', alignItems:'center'}}>
          <div style={{width:'90%', maxWidth:350, textAlign:'center'}}>
            <h3>LOGIN ADMIN</h3>
            <form onSubmit={handleLogin}>
              <input type="email" placeholder="Email" className="form-control" style={{marginBottom:10, height:45}} value={email} onChange={e=>setEmail(e.target.value)} />
              <input type="password" placeholder="Password" className="form-control" style={{marginBottom:20, height:45}} value={password} onChange={e=>setPassword(e.target.value)} />
              <button disabled={loginLoading} className="btn btn-primary btn-block btn-lg">{loginLoading?'...':'MASUK'}</button>
            </form>
          </div>
        </div>
      )}

      {/* DASHBOARD */}
      {session && (
        <>
          <nav className="navbar navbar-custom navbar-fixed-top">
            <div className="container-fluid">
              <div className="navbar-header" style={{display:'flex', justifyContent:'space-between', width:'100%', alignItems:'center'}}>
                <a className="navbar-brand" href="#">{settings.site_name}</a>
                <button onClick={handleLogout} className="btn btn-xs btn-danger" style={{marginTop:8}}>LOGOUT</button>
              </div>
            </div>
          </nav>

          <div className="container">
            <div className="row">
              <div className="col-md-8 col-md-offset-2">
                
                <div className="tool-box">
                  <div className="tool-header">
                    <h2 id="box-title">{editingId ? "Edit Link" : (viewState==='result' ? "Link Ready" : "Shorten URL")}</h2>
                  </div>
                  <div className="tool-body">
                    {/* FORM */}
                    {!editingId && viewState === 'form' && (
                      <form onSubmit={handleShorten}>
                        <div className="input-group input-group-lg">
                          <input type="url" className="form-control" placeholder="https://..." value={longUrl} onChange={e=>setLongUrl(e.target.value)} required />
                          <span className="input-group-btn">
                            <button className="btn btn-primary" type="submit">SHORTEN</button>
                          </span>
                        </div>
                      </form>
                    )}
                    {/* LOADING */}
                    {!editingId && viewState === 'loading' && <div className="text-center"><h2>{progress}%</h2></div>}
                    {/* RESULT */}
                    {!editingId && viewState === 'result' && (
                      <div>
                        <div className="input-group input-group-lg">
                          <input type="text" className="form-control" value={shortUrl} readOnly />
                          <span className="input-group-btn">
                            <button className="btn btn-success" onClick={()=>handleCopy(shortUrl)}>{copyBtnText}</button>
                          </span>
                        </div>
                        <div className="text-center" style={{marginTop:15}}>
                          <a style={{cursor:'pointer', textDecoration:'underline'}} onClick={()=>{setViewState('form'); setLongUrl('');}}>Buat lagi</a>
                        </div>
                        {/* SOSMED BUTTONS */}
                        <div className="text-center" style={{marginTop:20}}>
                           <a href={`https://api.whatsapp.com/send?text=${shortUrl}`} target="_blank" className="btn btn-success btn-circle" style={{margin:5}}>WA</a>
                           <a href={`https://www.facebook.com/sharer/sharer.php?u=${shortUrl}`} target="_blank" className="btn btn-primary btn-circle" style={{margin:5}}>FB</a>
                        </div>
                      </div>
                    )}
                    {/* EDIT */}
                    {editingId && (
                      <div>
                        <input className="form-control" value={editUrlVal} onChange={e=>setEditUrlVal(e.target.value)} style={{marginBottom:10}} />
                        <button className="btn btn-success btn-block" onClick={async ()=>{
                           await fetch('/api/links', { method:'PATCH', body:JSON.stringify({id:editingId, newUrl:editUrlVal}) });
                           setEditingId(null); fetchLinks(); showToast("Updated", "success");
                        }}>SIMPAN</button>
                        <button className="btn btn-default btn-block" onClick={()=>setEditingId(null)}>BATAL</button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center" style={{marginTop:30}}>
                  <button className="btn btn-default" onClick={()=>setShowList(!showList)}>
                    <span className="glyphicon glyphicon-list"></span> MY LIST
                  </button>
                </div>

                {/* LIST TABLE */}
                {showList && (
                  <div className="list-box" style={{marginTop:20, background:'#fff', padding:15, borderRadius:5}}>
                    <table className="table table-striped">
                      <thead><tr><th>Link</th><th>Klik</th><th className="text-right">Aksi</th></tr></thead>
                      <tbody>
                        {currentItems.map(link => (
                          <tr key={link.id}>
                            <td>
                              <b>{link.id}</b><br/>
                              <small style={{color:'#999'}}>{link.url.substring(0,30)}...</small>
                            </td>
                            <td>{link.clicks}</td>
                            <td className="text-right">
                              <button className="btn btn-xs btn-default" onClick={()=>{setEditingId(link.id); setEditUrlVal(link.url); window.scrollTo(0,0);}}>Edit</button>
                              <button className="btn btn-xs btn-danger" onClick={()=>handleDelete(link.id)} style={{marginLeft:5}}>X</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {/* PAGINATION */}
                    <div className="text-center">
                      <button className="btn btn-sm btn-default" disabled={currentPage===1} onClick={()=>setCurrentPage(currentPage-1)}>Prev</button>
                      <span style={{margin:'0 10px'}}>{currentPage} / {totalPages||1}</span>
                      <button className="btn btn-sm btn-default" disabled={currentPage>=totalPages} onClick={()=>setCurrentPage(currentPage+1)}>Next</button>
                    </div>
                  </div>
                )}

                <div className="text-center" style={{marginTop:20}}>
                  <button className="btn btn-default" onClick={()=>setShowSettings(!showSettings)}>Settings</button>
                </div>

                {/* SETTINGS */}
                {showSettings && (
                  <div className="settings-panel" style={{marginTop:20, background:'#fff', padding:20, borderRadius:5}}>
                    <div className="checkbox">
                      <label>
                        <input type="checkbox" checked={settings.offer_active} onChange={e=>setSettings({...settings, offer_active:e.target.checked})} /> 
                        <b>AKTIFKAN REDIRECT OFFER</b>
                      </label>
                    </div>
                    <div className="form-group">
                      <label>Nama Situs</label>
                      <input className="form-control" value={settings.site_name} onChange={e=>setSettings({...settings, site_name:e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Offer URL</label>
                      <input className="form-control" value={settings.offer_url} onChange={e=>setSettings({...settings, offer_url:e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Histats ID</label>
                      <input className="form-control" value={settings.histats_id} onChange={e=>setSettings({...settings, histats_id:e.target.value})} />
                    </div>
                    <button className="btn btn-success btn-block" style={{background: saveBtnColor || '#5cb85c'}} onClick={handleSaveSettings}>{btnSaveText}</button>
                  </div>
                )}

              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
