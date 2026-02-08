'use client';

// ==========================================
// BAGIAN 1: SISTEM & LOGIC (CONTROLLER)
// ==========================================
import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '@/data/supabase';

export default function Home() {
  // STATE AUTH & DATA
  const [session, setSession] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    site_name: 'ShortCuts',
    offer_url: '',
    offer_active: false,
    histats_id: ''
  });

  // STATE INPUT FORM
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  
  // STATE EDITING
  const [editingId, setEditingId] = useState<string | null>(null); // ID link yang lagi diedit
  const [editUrlVal, setEditUrlVal] = useState("");

  // STATE UI (TAMPILAN)
  const [viewState, setViewState] = useState<'form' | 'loading' | 'result'>('form');
  const [showList, setShowList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: string} | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // --- 1. INIT LOAD ---
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

  // Timer Toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // --- 2. FUNGSI DATA ---
  function loadData() {
    // Ambil Settings
    supabase.from('settings').select('*').single().then(({ data }) => {
      if (data) { setSettings(data); document.title = data.site_name; }
    });
    // Ambil Links
    fetchLinks();
  }

  async function fetchLinks() {
    const res = await fetch('/api/links');
    const json = await res.json();
    if (json.success) setLinks(json.data || []);
  }

  // --- 3. FUNGSI ACTION ---
  const showToast = (msg: string, type: 'success'|'error') => {
    setToast({ msg, type: type === 'success' ? 'toast-success' : 'toast-error' });
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) showToast("Login Gagal: " + error.message, "error");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLinks([]);
  };

  // SHORTEN BARU
  const handleShorten = async (e: FormEvent) => {
    e.preventDefault();
    if (!longUrl) return;

    setViewState('loading');
    
    try {
      const res = await fetch('/api/save-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: longUrl })
      });
      const data = await res.json();

      if (data.success) {
        setShortUrl(`https://tollsfakelink.vercel.app/${data.shortId}`);
        setViewState('result');
        setLongUrl("");
        fetchLinks();
        showToast("Link Berhasil Dibuat!", "success");
      } else {
        setViewState('form');
        showToast(data.error || "Gagal", "error");
      }
    } catch {
      setViewState('form');
      showToast("Error Koneksi", "error");
    }
  };

  // SIMPAN EDITAN
  const handleSaveEdit = async () => {
    if (!editingId) return;
    setLoading(true);
    await fetch('/api/links', { method: 'PATCH', body: JSON.stringify({ id: editingId, newUrl: editUrlVal }) });
    setEditingId(null); // Keluar mode edit
    setEditUrlVal("");
    setLoading(false);
    fetchLinks();
    showToast("Link Berhasil Diedit", "success");
  };

  // HAPUS
  const handleDelete = async (id: string) => {
    if(!confirm("Yakin hapus link ini?")) return;
    await fetch('/api/links', { method: 'DELETE', body: JSON.stringify({ id }) });
    setLinks(links.filter(l => l.id !== id));
    showToast("Terhapus", "success");
  };

  // SETTINGS
  const handleSaveSettings = async () => {
    setLoading(true);
    await supabase.from('settings').update({
      site_name: settings.site_name,
      offer_url: settings.offer_url,
      offer_active: settings.offer_active,
      histats_id: settings.histats_id
    }).eq('id', 1);
    setLoading(false);
    showToast("Pengaturan Disimpan!", "success");
  };

  // --- 4. HELPER ---
  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Disalin ke clipboard", "success");
  };

  const startEdit = (link: any) => {
    setEditingId(link.id);
    setEditUrlVal(link.url);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll ke atas biar keliatan formnya
  };

  // PAGINATION LOGIC
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = links.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(links.length / ITEMS_PER_PAGE);


  // ==========================================
  // BAGIAN 2: TAMPILAN (VIEW) - BOOTSTRAP 3
  // ==========================================
  return (
    <>
      {/* TOAST NOTIF */}
      {toast && <div className={`toast-msg ${toast.type}`}>{toast.msg}</div>}

      {/* LOGIN POPUP (BLUR BACKGROUND) */}
      {!session && (
        <div className="login-backdrop">
          <div className="login-card">
            <h3 className="text-center" style={{marginTop:0, fontWeight:'bold', marginBottom:20}}>LOGIN ADMIN</h3>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <input type="email" className="form-control input-lg" placeholder="Email Address" value={email} onChange={e=>setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <input type="password" className="form-control input-lg" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
              </div>
              <button className="btn btn-primary btn-block btn-lg" disabled={loading}>
                {loading ? 'MEMERIKSA...' : 'MASUK DASHBOARD'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DASHBOARD AREA */}
      {session && (
      <>
        {/* NAVBAR */}
        <nav className="navbar navbar-custom navbar-fixed-top">
          <div className="container">
            <div className="navbar-header" style={{width:'100%'}}>
              <button onClick={handleLogout} className="btn btn-danger btn-sm pull-right navbar-right-btn">LOGOUT</button>
              <a className="navbar-brand" href="#">{settings.site_name}</a>
            </div>
          </div>
        </nav>

        <div className="container">
          <div className="row">
            <div className="col-md-8 col-md-offset-2">
              
              {/* KOTAK UTAMA (CREATE / EDIT) */}
              <div className="main-box">
                <div className="box-header">
                  <h2>{editingId ? "Edit Link" : (viewState==='result' ? "Link Siap!" : "Shorten URL")}</h2>
                  {!editingId && viewState==='form' && <p className="text-muted">Masukkan URL panjang di bawah ini</p>}
                </div>

                <div className="box-body">
                  
                  {/* MODE EDIT LINK (MUNCUL JIKA KLIK TOMBOL EDIT DI TABEL) */}
                  {editingId ? (
                    <div>
                      <div className="form-group">
                        <label>Edit URL Asli:</label>
                        <input className="form-control input-lg" value={editUrlVal} onChange={e=>setEditUrlVal(e.target.value)} />
                      </div>
                      <div className="row">
                        <div className="col-xs-6">
                          <button className="btn btn-success btn-block btn-lg" onClick={handleSaveEdit} disabled={loading}>SIMPAN</button>
                        </div>
                        <div className="col-xs-6">
                          <button className="btn btn-default btn-block btn-lg" onClick={()=>setEditingId(null)}>BATAL</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* MODE NORMAL (CREATE) */
                    <>
                      {viewState === 'form' && (
                        <form onSubmit={handleShorten}>
                          <div className="input-group input-group-lg">
                            <input type="url" className="form-control input-lg-custom" placeholder="https://..." value={longUrl} onChange={e=>setLongUrl(e.target.value)} required />
                            <span className="input-group-btn">
                              <button className="btn btn-lg-custom" type="submit">SHORTEN</button>
                            </span>
                          </div>
                        </form>
                      )}

                      {viewState === 'loading' && (
                        <div className="text-center">
                          <h3>Memproses...</h3>
                        </div>
                      )}

                      {viewState === 'result' && (
                        <div className="text-center">
                          <div className="input-group input-group-lg">
                            <input type="text" className="form-control input-lg-custom" value={shortUrl} readOnly style={{background:'#fff'}} />
                            <span className="input-group-btn">
                              <button className="btn btn-lg-custom" style={{background:'#27ae60'}} onClick={()=>copyText(shortUrl)}>COPY</button>
                            </span>
                          </div>
                          <br/>
                          <a style={{cursor:'pointer', textDecoration:'underline'}} onClick={()=>{setViewState('form'); setLongUrl('');}}>Buat Link Lagi</a>
                        </div>
                      )}
                    </>
                  )}

                </div>
              </div>

              {/* TOMBOL TOGGLE LIST */}
              <div className="text-center">
                <button className="btn-pill" onClick={()=>setShowList(!showList)}>
                  <span className="glyphicon glyphicon-list"></span> {showList ? 'SEMBUNYIKAN LIST' : 'LIHAT DAFTAR LINK'}
                </button>
              </div>

              {/* TABEL LIST (MUNCUL JIKA SHOWLIST TRUE) */}
              {showList && (
                <div className="table-container">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th style={{width:50}}>Img</th>
                          <th>Short Link</th>
                          <th>Link Asli</th>
                          <th>Klik</th>
                          <th className="text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length === 0 ? (
                          <tr><td colSpan={5} className="text-center">Belum ada data link.</td></tr>
                        ) : currentItems.map(link => (
                          <tr key={link.id}>
                            <td>
                              <img src={`https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=32`} className="img-favicon" onError={(e:any)=>e.target.style.display='none'} />
                            </td>
                            <td>
                              <span className="link-title">{link.id}</span>
                            </td>
                            <td>
                              <span className="link-url">{link.url}</span>
                            </td>
                            <td><span className="badge">{link.clicks}</span></td>
                            <td className="text-right">
                              {/* TOMBOL COPY */}
                              <button className="btn-icon-action" title="Copy" onClick={()=>copyText(`https://tollsfakelink.vercel.app/${link.id}`)}>
                                <span className="glyphicon glyphicon-copy"></span>
                              </button>
                              
                              {/* TOMBOL EDIT (PENTING: INI MEMANGGIL FUNGSI EDIT DI ATAS) */}
                              <button className="btn-icon-action" title="Edit" onClick={()=>startEdit(link)}>
                                <span className="glyphicon glyphicon-pencil"></span>
                              </button>
                              
                              {/* TOMBOL DELETE */}
                              <button className="btn-icon-action btn-icon-del" title="Hapus" onClick={()=>handleDelete(link.id)}>
                                <span className="glyphicon glyphicon-trash"></span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* PAGINATION */}
                  <div className="text-center" style={{marginTop:20}}>
                    <button className="btn btn-default btn-sm" disabled={currentPage===1} onClick={()=>setCurrentPage(currentPage-1)}>Prev</button>
                    <span style={{margin:'0 15px', fontWeight:'bold'}}>{currentPage} / {totalPages||1}</span>
                    <button className="btn btn-default btn-sm" disabled={currentPage>=totalPages} onClick={()=>setCurrentPage(currentPage+1)}>Next</button>
                  </div>
                </div>
              )}

              {/* TOMBOL TOGGLE SETTINGS */}
              <div className="text-center" style={{marginTop:30}}>
                <button className="btn-icon-action" style={{width:50, height:50, fontSize:24}} onClick={()=>setShowSettings(!showSettings)}>
                  <span className="glyphicon glyphicon-cog"></span>
                </button>
                <div style={{fontSize:11, color:'#999', marginTop:5}}>PENGATURAN</div>
              </div>

              {/* SETTINGS AREA */}
              {showSettings && (
                <div className="settings-box">
                  <h4 style={{marginTop:0, marginBottom:20, fontWeight:'bold'}}>Konfigurasi Website</h4>
                  
                  {/* CHECKBOX ON/OFF */}
                  <div className="custom-checkbox" onClick={()=>setSettings({...settings, offer_active: !settings.offer_active})}>
                    <label style={{fontWeight:'bold', width:'100%', cursor:'pointer'}}>
                      <input type="checkbox" checked={settings.offer_active} readOnly />
                      AKTIFKAN REDIRECT OFFER?
                    </label>
                    <div style={{fontSize:12, color:'#777', marginTop:5}}>Jika dicentang, pengunjung manusia akan dialihkan ke Link Offer.</div>
                  </div>

                  <div className="form-group">
                    <label>Nama Situs</label>
                    <input className="form-control" value={settings.site_name} onChange={e=>setSettings({...settings, site_name:e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Link Offer (Tujuan Redirect)</label>
                    <textarea className="form-control" rows={2} value={settings.offer_url} onChange={e=>setSettings({...settings, offer_url:e.target.value})}></textarea>
                  </div>
                  <div className="form-group">
                    <label>Histats ID</label>
                    <input className="form-control" type="number" value={settings.histats_id} onChange={e=>setSettings({...settings, histats_id:e.target.value})} />
                  </div>
                  <button className="btn btn-primary btn-block btn-lg" onClick={handleSaveSettings} disabled={loading}>
                    {loading ? 'MENYIMPAN...' : 'SIMPAN PENGATURAN'}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>

        <div className="text-center" style={{padding:40, color:'#bbb'}}>
          &copy; 2026 {settings.site_name}. All Rights Reserved.
        </div>
      </>
      )}
    </>
  );
}
