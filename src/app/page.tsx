'use client';

import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '@/data/supabase';

export default function Home() {
  // === STATE ===
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  // Data
  const [links, setLinks] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    site_name: 'ShortCuts',
    offer_url: '',
    offer_active: false,
    histats_id: ''
  });

  // Inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [longUrl, setLongUrl] = useState("");
  
  // Tabs State (0: None, 1: List, 2: Settings)
  const [activeTab, setActiveTab] = useState(0); 
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrlVal, setEditUrlVal] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // === INIT ===
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

  const showToast = (msg: string, type: 'success'|'error') => setToast({ msg, type });

  // === HANDLERS ===
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) showToast("Login Failed", "error");
  };

  const handleShorten = async (e: FormEvent) => {
    e.preventDefault();
    if (!longUrl) return;
    setLoading(true);
    try {
      const res = await fetch('/api/save-link', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ url: longUrl })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Link Created Successfully!", "success");
        setLongUrl("");
        fetchLinks();
        setActiveTab(1); // Auto switch to list
      } else {
        showToast(data.error, "error");
      }
    } catch { showToast("Network Error", "error"); }
    setLoading(false);
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
    showToast("Settings Saved!", "success");
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    await fetch('/api/links', { method: 'PATCH', body: JSON.stringify({ id: editingId, newUrl: editUrlVal }) });
    setEditingId(null);
    fetchLinks();
    showToast("Link Updated", "success");
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure?")) return;
    await fetch('/api/links', { method: 'DELETE', body: JSON.stringify({ id }) });
    setLinks(links.filter(l => l.id !== id));
    showToast("Link Deleted", "success");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to Clipboard", "success");
  };

  const getFavicon = (url: string) => {
    try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; }
    catch { return ""; }
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = links.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(links.length / ITEMS_PER_PAGE);

  // === RENDER ===
  return (
    <>
      {/* TOAST */}
      {toast && (
        <div className="toast-wrap">
          <div className="toast-box">
            <span className={`material-icons-round ${toast.type === 'success' ? 'text-success' : 'text-error'}`}>
              {toast.type === 'success' ? 'check_circle' : 'error'}
            </span>
            {toast.msg}
          </div>
        </div>
      )}

      {/* LOGIN POPUP */}
      {!session && (
        <div className="login-backdrop">
          <div className="login-modal">
            <div style={{marginBottom:20}}>
              <span className="material-icons-round" style={{fontSize:40, color:'#3b82f6'}}>lock</span>
            </div>
            <h2 style={{color:'#fff', margin:'0 0 20px 0'}}>Admin Access</h2>
            <form onSubmit={handleLogin}>
              <div style={{marginBottom:15}}>
                <input className="input-dark" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
              </div>
              <div style={{marginBottom:25}}>
                <input className="input-dark" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
              </div>
              <button className="btn btn-primary" style={{width:'100%'}} disabled={loading}>
                {loading ? 'Authenticating...' : 'LOGIN'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MAIN APP */}
      {session && (
        <>
          {/* NAVBAR */}
          <nav className="navbar-glass">
            <div className="nav-container">
              <a href="#" className="brand-logo">
                {/* SVG LOGO */}
                <svg className="brand-svg" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/>
                </svg>
                {settings.site_name}
              </a>
              <button onClick={async () => { await supabase.auth.signOut(); setLinks([]); }} className="btn btn-outline" style={{padding:'5px 15px', fontSize:'12px'}}>
                LOGOUT
              </button>
            </div>
          </nav>

          <div style={{maxWidth:'800px', margin:'0 auto', padding:'0 20px'}}>
            
            {/* CARD 1: SHORTENER */}
            <div className="card-dark">
              <div style={{textAlign:'center', marginBottom:20}}>
                <h2 style={{margin:0, fontWeight:700, color:'#fff'}}>Create Short Link</h2>
                <p style={{color:'#666', margin:'5px 0 0 0'}}>Paste your long URL below</p>
              </div>
              
              {!editingId ? (
                <form onSubmit={handleShorten} style={{display:'flex', gap:10}}>
                  <input className="input-dark" placeholder="https://example.com/very-long-url..." value={longUrl} onChange={e=>setLongUrl(e.target.value)} />
                  <button className="btn btn-primary" style={{minWidth:120}} disabled={loading}>
                    <span className="material-icons-round">bolt</span>
                    SHORTEN
                  </button>
                </form>
              ) : (
                <div style={{display:'flex', gap:10}}>
                  <input className="input-dark" value={editUrlVal} onChange={e=>setEditUrlVal(e.target.value)} />
                  <button className="btn btn-primary" onClick={handleSaveEdit}>SAVE</button>
                  <button className="btn btn-outline" onClick={()=>setEditingId(null)}>CANCEL</button>
                </div>
              )}
            </div>

            {/* TABS BUTTONS */}
            <div className="tab-container">
              <div className={`tab-btn ${activeTab === 1 ? 'active' : ''}`} onClick={()=>setActiveTab(activeTab === 1 ? 0 : 1)}>
                <span className="material-icons-round">list</span> My Links
              </div>
              <div className={`tab-btn ${activeTab === 2 ? 'active' : ''}`} onClick={()=>setActiveTab(activeTab === 2 ? 0 : 2)}>
                <span className="material-icons-round">settings</span> Settings
              </div>
            </div>

            {/* TAB 1: LIST */}
            {activeTab === 1 && (
              <div className="card-dark">
                <div style={{marginBottom:15, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <h3 style={{margin:0}}>All Links</h3>
                  <span style={{background:'#333', padding:'2px 8px', borderRadius:4, fontSize:12}}>{links.length} Total</span>
                </div>
                
                <div className="table-responsive">
                  <table className="table-dark">
                    <thead>
                      <tr>
                        <th style={{width:50}}>Icon</th>
                        <th>Short Link</th>
                        <th>Original</th>
                        <th>Clicks</th>
                        <th style={{textAlign:'right'}}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map(link => (
                        <tr key={link.id}>
                          <td><img src={getFavicon(link.url)} className="favicon" onError={(e:any)=>e.target.style.display='none'} /></td>
                          <td>
                            <a href={`https://tollsfakelink.vercel.app/${link.id}`} target="_blank" className="link-main">{link.id}</a>
                          </td>
                          <td><span className="link-sub">{link.url}</span></td>
                          <td><span style={{background:'#222', padding:'2px 6px', borderRadius:4, fontSize:12}}>{link.clicks}</span></td>
                          <td style={{textAlign:'right'}}>
                            <button className="action-btn" onClick={()=>copyToClipboard(`https://tollsfakelink.vercel.app/${link.id}`)}>
                              <span className="material-icons-round" style={{fontSize:18}}>content_copy</span>
                            </button>
                            <button className="action-btn" onClick={()=>{setEditingId(link.id); setEditUrlVal(link.url); window.scrollTo(0,0);}}>
                              <span className="material-icons-round" style={{fontSize:18}}>edit</span>
                            </button>
                            <button className="action-btn delete" onClick={()=>handleDelete(link.id)}>
                              <span className="material-icons-round" style={{fontSize:18}}>delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}
                <div style={{display:'flex', justifyContent:'center', gap:15, marginTop:20, alignItems:'center'}}>
                  <button className="btn btn-outline" disabled={currentPage===1} onClick={()=>setCurrentPage(currentPage-1)}>Prev</button>
                  <span style={{fontSize:14, color:'#666'}}>Page {currentPage} of {totalPages||1}</span>
                  <button className="btn btn-outline" disabled={currentPage>=totalPages} onClick={()=>setCurrentPage(currentPage+1)}>Next</button>
                </div>
              </div>
            )}

            {/* TAB 2: SETTINGS */}
            {activeTab === 2 && (
              <div className="card-dark">
                <h3 style={{marginTop:0, marginBottom:20}}>Configuration</h3>
                
                {/* CUSTOM SWITCH */}
                <div className="switch-wrapper" onClick={()=>setSettings({...settings, offer_active: !settings.offer_active})}>
                  <div>
                    <div style={{fontWeight:600, color:'#fff'}}>Redirect Offer</div>
                    <div style={{fontSize:12, color:'#666'}}>Enable redirect for human visitors</div>
                  </div>
                  <div className={`switch-box ${settings.offer_active ? 'on' : ''}`}>
                    <div className="switch-circle"></div>
                  </div>
                </div>

                <div style={{marginBottom:15}}>
                  <label style={{display:'block', marginBottom:8, fontSize:13, color:'#888'}}>Site Name</label>
                  <input className="input-dark" value={settings.site_name} onChange={e=>setSettings({...settings, site_name: e.target.value})} />
                </div>

                <div style={{marginBottom:15}}>
                  <label style={{display:'block', marginBottom:8, fontSize:13, color:'#888'}}>Offer URL (Target)</label>
                  <input className="input-dark" value={settings.offer_url} onChange={e=>setSettings({...settings, offer_url: e.target.value})} />
                </div>

                <div style={{marginBottom:25}}>
                  <label style={{display:'block', marginBottom:8, fontSize:13, color:'#888'}}>Histats ID</label>
                  <input className="input-dark" type="number" value={settings.histats_id} onChange={e=>setSettings({...settings, histats_id: e.target.value})} />
                </div>

                <button className="btn btn-primary" style={{width:'100%'}} onClick={saveSettings} disabled={loading}>
                  {loading ? 'SAVING...' : 'SAVE SETTINGS'}
                </button>
              </div>
            )}

          </div>
          
          <div style={{textAlign:'center', padding:30, color:'#444', fontSize:12}}>
            &copy; 2026 {settings.site_name}. Pro Version.
          </div>
        </>
      )}
    </>
  );
}
