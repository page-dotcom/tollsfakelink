'use client';

import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '@/data/supabase';

const MY_PIN = "Yasue1998"; 

export default function Home() {
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

  // Tombol Feedback
  const [copyBtnText, setCopyBtnText] = useState("COPY");
  const [saveBtnText, setSaveBtnText] = useState("SIMPAN PENGATURAN");
  const [saveBtnColor, setSaveBtnColor] = useState("");

  // Edit Link
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrlVal, setEditUrlVal] = useState("");

  useEffect(() => {
    fetchSettings();
    fetchLinks();
    const last = localStorage.getItem('lastLink');
    if (last) {
      setShortUrl(last);
      setViewState('result');
    }
  }, []);

  async function fetchSettings() {
    const { data } = await supabase.from('settings').select('*').single();
    if (data) {
      setSettings(data);
      document.title = data.site_name; 
    }
  }

  async function fetchLinks() {
    try {
      const res = await fetch('/api/links', {
        headers: { 'Authorization': `Bearer ${MY_PIN}` }
      });
      const json = await res.json();
      if (json.success) setLinks(json.data);
    } catch (e) { console.error(e); }
  }

  const handleShorten = async (e: FormEvent) => {
    e.preventDefault();
    if (!longUrl) return;

    setViewState('loading');
    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setProgress(p);
      if (p >= 95) clearInterval(interval);
    }, 30);

    try {
      const res = await fetch('/api/save-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MY_PIN}`
        },
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
        } else {
          setViewState('form');
          alert("Gagal: " + data.error);
        }
      }, 500);
    } catch (err) {
      setViewState('form');
    }
  };

  const handleCopy = (text: string, isListBtn = false, id = "") => {
    navigator.clipboard.writeText(text);
    if (!isListBtn) {
      setCopyBtnText("COPIED!");
      setTimeout(() => setCopyBtnText("COPY"), 1500);
    } else {
      const btnIcon = document.getElementById(`icon-copy-${id}`);
      if(btnIcon) {
        btnIcon.className = "glyphicon glyphicon-ok"; 
        setTimeout(() => {
          btnIcon.className = "glyphicon glyphicon-copy"; 
        }, 1500);
      }
    }
  };

  const openEdit = (id: string, currentUrl: string) => {
    setEditingId(id);
    setEditUrlVal(currentUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await fetch('/api/links', {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${MY_PIN}` },
      body: JSON.stringify({ id: editingId, newUrl: editUrlVal })
    });
    setEditingId(null);
    fetchLinks();
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Hapus Permanen?")) return;
    await fetch('/api/links', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${MY_PIN}` },
      body: JSON.stringify({ id })
    });
    fetchLinks();
  };

  const handleSaveSettings = async () => {
    setSaveBtnText("MENYIMPAN...");
    const { error } = await supabase.from('settings').update({
      site_name: settings.site_name,
      offer_url: settings.offer_url,
      histats_id: settings.histats_id
    }).eq('id', 1);

    if (!error) {
      setSaveBtnColor("#27ae60"); 
      setSaveBtnText("BERHASIL DISIMPAN!");
      document.title = settings.site_name;
    } else {
      setSaveBtnText("GAGAL MENYIMPAN");
    }
    setTimeout(() => {
      setSaveBtnColor("");
      setSaveBtnText("SIMPAN PENGATURAN");
    }, 2000);
  };

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return "https://www.google.com/s2/favicons?domain=google.com"; 
    }
  };

  // --- STYLE INLINE UNTUK TOMBOL SHARE (BIAR PASTI MUNCUL) ---
  const iconStyle = {
    width: '40px', height: '40px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', textDecoration: 'none', transition: '0.2s'
  };

  return (
    <>
      <nav className="navbar navbar-custom navbar-fixed-top">
        <div className="container-fluid">
          <div className="navbar-header">
            <a className="navbar-brand" href="#" style={{display:'flex', alignItems:'center', gap:'10px'}}>
              <svg className="brand-icon-svg" style={{width:'32px', height:'32px', fill:'#3498db'}} viewBox="0 0 24 24">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-3.31-2.69-6-6-6c-3.31,0-6,2.69-6,6c0,2.22,1.21,4.15,3,5.19V19 c-2.97-1.35-5-4.42-5-8c0-4.97,4.03-9,9-9s9,4.03,9,9c0,1.86-0.55,3.61-1.5,5.1l-1.45-1.45C18.78,14.16,19.04,13.57,19.14,12.94z M9.64,12.56L7.52,14.68C7.36,14.54,7.18,14.4,7,14.25V17c1.32-0.84,2.2-2.31,2.2-4C9.2,12.89,9.36,12.75,9.64,12.56z M12,8 c2.21,0,4,1.79,4,4s-1.79,4-4,4s-4-1.79-4-4S9.79,8,12,8z"/>
                <circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>
                <path d="M9.41 16.59L12 14l2.59 2.59L16 15.17l-4-4-4 4z"/> 
                <path d="M17.88,11.36l1.3,1.3c0.11-0.78,0.11-1.59-0.03-2.39L17.88,11.36z"/>
              </svg>
              {settings.site_name}
            </a>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="row">
          <div className="col-md-8 col-md-offset-2 col-sm-10 col-sm-offset-1 col-xs-12">
            
            <div className="tool-box">
              <div className="tool-header">
                <h2 id="box-title" style={{fontWeight:700, margin:0, color:'#2c3e50'}}>
                  {editingId ? "Edit URL Tujuan" : (viewState === 'result' ? "Link Ready!" : "Shorten URL")}
                </h2>
                {viewState === 'form' && !editingId && (
                  <p className="simple-desc" style={{color:'#95a5a6', marginTop:'5px'}}>Paste long URL below</p>
                )}
              </div>

              <div className="tool-body" style={{marginTop:'30px'}}>
                
                {/* 1. FORM VIEW */}
                {viewState === 'form' && !editingId && (
                  <form onSubmit={handleShorten}>
                    <div className="input-group input-group-lg">
                      <input 
                        type="url" 
                        className="form-control input-lg-custom" 
                        placeholder="https://..." 
                        required 
                        value={longUrl}
                        onChange={(e) => setLongUrl(e.target.value)}
                      />
                      <span className="input-group-btn">
                        <button className="btn btn-lg-custom" type="submit">SHORTEN</button>
                      </span>
                    </div>
                  </form>
                )}

                {/* 2. LOADING VIEW */}
                {viewState === 'loading' && (
                  <div style={{textAlign:'center', padding:'20px'}}>
                    <h2 style={{margin:'10px 0', color:'#3498db', fontWeight:700}}>{progress}%</h2>
                    <small style={{color:'#bbb', letterSpacing:'1px'}}>PROCESSING LINK...</small>
                  </div>
                )}

                {/* 3. RESULT VIEW */}
                {viewState === 'result' && (
                  <div id="result-view">
                    <div className="input-group input-group-lg">
                      <input type="text" className="form-control input-lg-custom input-result" value={shortUrl} readOnly />
                      <span className="input-group-btn">
                        <button 
                          className="btn btn-lg-custom"
                          onClick={() => handleCopy(shortUrl)} 
                          type="button"
                          style={{ background: copyBtnText === 'COPIED!' ? '#27ae60' : '#3498db', minWidth:'100px' }}
                        >
                          {copyBtnText}
                        </button>
                      </span>
                    </div>
                    
                    <div style={{textAlign:'center', margin:'15px 0'}}>
                      <span 
                        style={{color:'#999', textDecoration:'underline', cursor:'pointer', fontSize:'13px'}}
                        onClick={() => { setViewState('form'); setLongUrl(""); localStorage.removeItem('lastLink'); }}
                      >
                        Shorten another link
                      </span>
                    </div>

                    {/* SHARE AREA (DIBUAT MANUAL STYLE-NYA BIAR PASTI MUNCUL) */}
                    <div id="result-actions" style={{display:'block', marginTop:'25px'}}>
                      <div style={{display:'flex', justifyContent:'center', gap:'15px'}}>
                        
                        {/* WhatsApp */}
                        <a href={`https://api.whatsapp.com/send?text=${shortUrl}`} target="_blank" style={{...iconStyle, background:'#25D366'}}>
                          <svg style={{width:'20px', height:'20px', fill:'#fff'}} viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </a>
                        
                        {/* Facebook */}
                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${shortUrl}`} target="_blank" style={{...iconStyle, background:'#1877F2'}}>
                          <svg style={{width:'20px', height:'20px', fill:'#fff'}} viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </a>
                        
                        {/* Twitter / X */}
                        <a href={`https://twitter.com/intent/tweet?url=${shortUrl}`} target="_blank" style={{...iconStyle, background:'#1DA1F2'}}>
                          <svg style={{width:'20px', height:'20px', fill:'#fff'}} viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                        </a>

                        {/* Telegram */}
                        <a href={`https://t.me/share/url?url=${shortUrl}`} target="_blank" style={{...iconStyle, background:'#0088cc'}}>
                          <svg style={{width:'20px', height:'20px', fill:'#fff'}} viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODAL EDIT */}
                {editingId && (
                  <div className="edit-view" style={{textAlign:'left', padding:'15px', background:'#f9f9f9', borderRadius:'8px', marginTop:'20px'}}>
                    <label style={{fontSize:'12px', color:'#999', display:'block', marginBottom:'5px'}}>EDIT TUJUAN URL:</label>
                    <div className="input-group">
                      <input 
                        type="text" 
                        className="form-control" 
                        value={editUrlVal} 
                        onChange={(e) => setEditUrlVal(e.target.value)} 
                        style={{height:'40px'}}
                      />
                      <span className="input-group-btn">
                        <button className="btn btn-success" type="button" onClick={saveEdit} style={{height:'40px'}}>SAVE</button>
                      </span>
                    </div>
                    <div style={{marginTop:'10px', textAlign:'right'}}>
                      <button className="btn btn-xs btn-default" onClick={() => setEditingId(null)}>CANCEL</button>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* BUTTON TOGGLE LIST */}
            <div className="text-center">
              <button 
                type="button" 
                className={`btn-toggle-list ${showList ? 'active' : ''}`} 
                onClick={() => setShowList(!showList)}
                style={{
                  background: '#34495e', color: '#fff', border: 'none',
                  padding: '10px 25px', borderRadius: '50px', fontWeight: 600
                }}
              >
                <span className="glyphicon glyphicon-list-alt" style={{marginRight:'5px'}}></span> 
                {showList ? 'HIDE LIST' : 'MY URL LIST'}
              </button>
            </div>

            {/* URL LIST AREA */}
            {showList && (
              <div className="list-box" style={{background:'#fff', borderRadius:'12px', padding:'20px', boxShadow:'0 5px 20px rgba(0,0,0,0.05)', marginTop:'20px'}}>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Short Link</th>
                        <th>Original URL</th>
                        <th>Clicks</th>
                        <th>Date</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {links.length === 0 ? (
                        <tr><td colSpan={6} className="text-center" style={{padding:'20px'}}>Belum ada link.</td></tr>
                      ) : (
                        links.map(link => (
                          <tr key={link.id}>
                            <td>
                              <img 
                                src={getFavicon(link.url)} 
                                alt="icon" 
                                style={{width:'35px', height:'35px', borderRadius:'8px', objectFit:'cover', background:'#eee'}}
                                onError={(e) => { e.currentTarget.style.display='none' }} 
                              />
                            </td>
                            <td>
                              <div style={{fontWeight:600}}>{link.id}</div>
                            </td>
                            <td>
                              <span style={{color:'#999', fontSize:'12px', maxWidth:'150px', display:'block', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{link.url}</span>
                            </td>
                            <td>
                              <span className="badge" style={{background:'#3498db'}}>{link.clicks || 0}</span>
                            </td>
                            <td style={{color:'#888', fontSize:'13px'}}>
                              {new Date(link.created_at).toLocaleDateString()}
                            </td>
                            <td className="text-right">
                              <button style={{border:'none', background:'none', color:'#bbb', padding:'5px'}} onClick={() => handleCopy(`https://tollsfakelink.vercel.app/${link.id}`, true, link.id)}>
                                <span id={`icon-copy-${link.id}`} className="glyphicon glyphicon-copy"></span>
                              </button>
                              <button style={{border:'none', background:'none', color:'#bbb', padding:'5px'}} onClick={() => openEdit(link.id, link.url)}>
                                <span className="glyphicon glyphicon-pencil"></span>
                              </button>
                              <button style={{border:'none', background:'none', color:'#bbb', padding:'5px'}} onClick={() => handleDelete(link.id)}>
                                <span className="glyphicon glyphicon-trash"></span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SETTINGS TOGGLE */}
            <div className="text-center" style={{marginTop: '30px', marginBottom: '20px'}}>
              <button 
                type="button" 
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  background: showSettings ? '#3498db' : '#fff', 
                  border: showSettings ? '1px solid #3498db' : '1px solid #ddd',
                  width: '40px', height: '40px', borderRadius: '50%',
                  color: showSettings ? '#fff' : '#555'
                }}
              >
                <span className="glyphicon glyphicon-cog"></span>
              </button>
              <div style={{fontSize:'12px', color:'#ccc', marginTop:'5px'}}>Settings</div>
            </div>

            {/* SETTINGS PANEL */}
            {showSettings && (
              <div style={{background:'#2c3e50', color:'#fff', padding:'30px', borderRadius:'12px', marginTop:'20px'}}>
                <h4 style={{marginTop:0}}><span className="glyphicon glyphicon-wrench"></span> Konfigurasi Situs</h4>
                <div style={{marginTop:'20px'}}>
                  <div className="form-group">
                    <label>Site Name</label>
                    <input type="text" className="form-control" value={settings.site_name} onChange={(e) => setSettings({...settings, site_name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>URL Offer</label>
                    <textarea className="form-control" rows={2} value={settings.offer_url} onChange={(e) => setSettings({...settings, offer_url: e.target.value})}></textarea>
                  </div>
                  <div className="form-group">
                    <label>Histats ID</label>
                    <input type="number" className="form-control" value={settings.histats_id} onChange={(e) => setSettings({...settings, histats_id: e.target.value})} />
                  </div>
                  <button type="button" className="btn btn-block" onClick={handleSaveSettings} style={{background: saveBtnColor || '#27ae60', color:'#fff', marginTop:'20px'}}>
                    {saveBtnText}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <div className="footer text-center" style={{padding:'20px', color:'#999', fontSize:'12px'}}>
         &copy; 2026 {settings.site_name}. All Rights Reserved.
      </div>
    </>
  );
}
