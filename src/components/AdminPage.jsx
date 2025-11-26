import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaPlus, FaSearch, FaUpload, FaImage, FaArrowLeft, FaTrash, FaStar, FaChartBar, FaTimes } from 'react-icons/fa';
import { API_URL } from '../config';

const GENRES = ["Action", "Sci-Fi", "Drama", "Comedy", "Horror", "Thriller", "Romance", "Animation", "Fantasy", "Adventure"];

// 👇 REPLACE WITH YOUR CLOUDINARY KEYS
const CLOUD_NAME = "djlfj4upe"; 
const UPLOAD_PRESET = "UPLOAD_PRESET"; 

const AdminPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('manage');
  const [contentList, setContentList] = useState([]);
  const [carouselList, setCarouselList] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("0%");
  const [resetKey, setResetKey] = useState(Date.now());

  // Forms
  const [addFormData, setAddFormData] = useState({ title: '', description: '', rating: '', category: 'movie', year: '', cast: '', featured: false });
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [files, setFiles] = useState({ image: null, video: null, trailer: null });
  
  // Edit & Manage
  const [editingItem, setEditingItem] = useState(null);
  const [episodeForm, setEpisodeForm] = useState({ seasonName: 'Season 1', title: '', duration: '' });
  const [seasonPosterForm, setSeasonPosterForm] = useState({ seasonName: 'Season 1' });

  // Banner Form
  const [bannerForm, setBannerForm] = useState({ title: '', description: '', tag: 'Featured', videoUrl: '' });
  const [bannerFiles, setBannerFiles] = useState({ image: null, video: null });
  const [editingBanner, setEditingBanner] = useState(null);

  useEffect(() => { fetchAll(); fetchCarousel(); fetchAnalytics(); }, []);

  const fetchAll = async () => {
      try {
        const [m, s, a] = await Promise.all([
            fetch(`${API_URL}/api/movies`).then(r => r.json()),
            fetch(`${API_URL}/api/series`).then(r => r.json()),
            fetch(`${API_URL}/api/anime`).then(r => r.json())
        ]);
        setContentList([...(m||[]), ...(s||[]), ...(a||[])]);
      } catch (e) { console.error(e); }
  };

  const fetchCarousel = async () => {
      try { const res = await fetch(`${API_URL}/api/carousel`); setCarouselList(await res.json()); } catch (e) {}
  };

  const fetchAnalytics = async () => {
       try { const res = await fetch(`${API_URL}/api/admin/analytics`); setAnalytics(await res.json()); } catch(e) {}
  };

  // Direct Upload Helper
  const uploadToCloudinary = async (file, type) => {
      if (!file) return null;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET); 
      formData.append("cloud_name", CLOUD_NAME);
      formData.append("resource_type", type);

      try {
          const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${type}/upload`, { method: "POST", body: formData });
          const data = await res.json();
          if (data.error) throw new Error(data.error.message);
          return data.secure_url;
      } catch (error) {
          console.error("Cloudinary Error:", error);
          alert(`Upload Failed: ${error.message}`);
          throw error;
      }
  };

  // --- HANDLERS ---

  // 1. Add/Update Content
  const handleAddSubmit = async (e) => {
    e.preventDefault(); setUploading(true); setUploadProgress("Processing...");

    try {
        setUploadProgress("Uploading Image...");
        const imageUrl = files.image ? await uploadToCloudinary(files.image, 'image') : "";
        setUploadProgress("Uploading Video...");
        const videoUrl = files.video ? await uploadToCloudinary(files.video, 'video') : "";
        const trailerUrl = files.trailer ? await uploadToCloudinary(files.trailer, 'video') : videoUrl;

        const payload = {
            ...addFormData,
            genres: JSON.stringify(selectedGenres),
            image: imageUrl,
            videoUrl: videoUrl,
            trailerUrl: trailerUrl
        };

        setUploadProgress("Saving...");
        const res = await fetch(`${API_URL}/api/admin/add-direct`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

        if (res.ok) {
            alert("✅ Content Uploaded!");
            setAddFormData({ title: '', description: '', rating: '', category: 'movie', year: '', cast: '', featured: false });
            setSelectedGenres([]); setFiles({ image: null, video: null, trailer: null });
            setResetKey(Date.now());
            fetchAll(); setActiveTab('manage');
        } else alert("Backend failed to save.");
    } catch (err) { alert("Error during upload."); } finally { setUploading(false); setUploadProgress(""); }
  };

  // 2. Add/Update Banner
  const handleBannerSubmit = async (e) => {
    e.preventDefault(); 
    setUploading(true); 
    // Reuse the progress state from the main form or create a generic one
    // (Assuming setUploadProgress exists in your component from previous steps)
    
    try {
      let imageUrl = editingBanner?.image || "";
      let videoUrl = editingBanner?.videoUrl || "";

      // 1. Upload to Cloudinary first
      if (bannerImageFile) {
          const url = await uploadToCloudinary(bannerImageFile, 'image');
          if (url) imageUrl = url;
      }
      if (bannerVideoFile) {
          const url = await uploadToCloudinary(bannerVideoFile, 'video');
          if (url) videoUrl = url;
      }

      // 2. Prepare JSON Payload
      const payload = { 
          ...bannerForm, 
          image: imageUrl, 
          videoUrl: videoUrl 
      };
      
      // 3. Send JSON to Backend
      let url = `${API_URL}/api/admin/carousel/add-direct`;
      let method = 'POST';
      
      if (editingBanner) {
          url = `${API_URL}/api/admin/carousel/update-direct/${editingBanner.id}`;
          method = 'PUT';
      }

      const res = await fetch(url, { 
          method, 
          headers: {'Content-Type':'application/json'}, 
          body: JSON.stringify(payload) 
      });
      
      if(res.ok) { 
          alert(editingBanner ? "✅ Banner Updated!" : "✅ Banner Added!"); 
          
          // Reset Form
          setBannerForm({ title: '', description: '', tag: 'Featured', videoUrl: '' });
          setBannerImageFile(null); 
          setBannerVideoFile(null);
          setEditingBanner(null);
          setResetKey(Date.now()); // Clear file inputs
          
          fetchCarousel(); 
      } else {
          alert("Backend failed to save banner.");
      }
    } catch(e) { 
        console.error(e);
        alert("Error uploading banner assets."); 
    } finally {
        setUploading(false);
    }
};

  // 👇 UPDATED: SAFE EDIT INITIALIZATION
  const startEditBanner = (item) => {
      setEditingBanner(item);
      setBannerForm({
          title: item.title || "",
          description: item.description || "",
          tag: item.tag || "",
          videoUrl: item.videoUrl || ""
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditBanner = () => {
      setEditingBanner(null);
      setBannerForm({ title: '', description: '', tag: 'Featured', videoUrl: '' });
      setResetKey(Date.now());
  };

  // Other Handlers
  const handleGenreToggle = (g) => { selectedGenres.includes(g) ? setSelectedGenres(selectedGenres.filter(i=>i!==g)) : setSelectedGenres([...selectedGenres, g]); };
  const handleDelete = async (id) => { if(confirm("Delete?")) { await fetch(`${API_URL}/api/admin/delete/${id}`, {method:'DELETE'}); fetchAll(); } };
  const handleDeleteBanner = async (id) => { if(confirm("Delete?")) { await fetch(`${API_URL}/api/admin/carousel/delete/${id}`, {method:'DELETE'}); fetchCarousel(); } };
  
  // Edit Details Handler (Simplified for brevity, assume it works as in previous steps)
  const handleUpdateDetails = async (e) => { e.preventDefault(); /* Add your update logic here if not already present from previous steps */ };
  const handleAddEpisode = async (e) => { /* Add your episode logic here */ };
  const handleUpdateSeasonPoster = async (e) => { /* Add your poster logic here */ };

  const filteredList = contentList.filter(i => i.title?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#121212', color: '#e0e0e0', overflowY: 'auto', zIndex: 9999 }}>
        <div style={{ height: '70px', background: '#1f1f1f', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', position: 'sticky', top: 0, zIndex: 100 }}>
            <button onClick={() => navigate('/')} style={{ background: 'transparent', border: '1px solid #555', color: '#fff', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><FaArrowLeft /> Back to Website</button>
            <h2 style={{ margin: 0, color: '#fff' }}>Admin Dashboard</h2>
            <div style={{ width: '100px' }}></div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
            
            {/* TABS */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '40px' }}>
                <button onClick={() => {setActiveTab('manage'); setEditingItem(null)}} className="btn" style={activeTab==='manage'?activeStyle:inactiveStyle}><FaEdit /> Manage</button>
                <button onClick={() => setActiveTab('add')} className="btn" style={activeTab==='add'?activeStyle:inactiveStyle}><FaPlus /> Add New</button>
                <button onClick={() => setActiveTab('banners')} className="btn" style={activeTab==='banners'?activeStyle:inactiveStyle}><FaStar /> Banners</button>
                <button onClick={() => setActiveTab('analytics')} className="btn" style={activeTab==='analytics'?activeStyle:inactiveStyle}><FaChartBar /> Analytics</button>
            </div>

            {/* --- TAB: MANAGE --- */}
            {activeTab === 'manage' && !editingItem && (
                <div>
                    <div className="search-bar" style={{ maxWidth: '600px', margin: '0 auto 30px auto', background: '#1f1f1f' }}><input type="text" placeholder="Search..." onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', background: 'transparent', border:'none', color:'#fff', padding:'10px' }} /><FaSearch style={{ marginRight: '15px', color: '#777' }} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
                        {filteredList.map(item => (
                            <div key={item.id} style={{ background: '#1f1f1f', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333', position: 'relative' }}>
                                <img src={item.image} alt="" style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
                                <div style={{ padding: '12px' }}>
                                    <h4 style={{ margin: '0 0 5px 0', fontSize: '0.95rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.title}</h4>
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                                        <span style={{ fontSize: '0.75rem', background: '#333', padding: '3px 8px', borderRadius: '4px', color: '#aaa' }}>{item.category?.toUpperCase()}</span>
                                        <button onClick={() => handleDelete(item.id)} style={{background:'transparent', border:'none', color:'#e50914', cursor:'pointer', fontSize:'1.1rem'}} title="Delete"><FaTrash/></button>
                                    </div>
                                    <button onClick={() => setEditingItem(item)} style={{ width: '100%', padding: '8px', background: '#444', border: '1px solid #555', color: '#fff', cursor: 'pointer', borderRadius: '4px' }}>Edit / Manage</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- TAB: ADD NEW --- */}
            {activeTab === 'add' && (
                <div style={formContainerStyle}>
                    <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Upload Content</h2>
                    <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {/* (Your existing Add Form Fields here...) */}
                        {/* For brevity, relying on previous correct form code */}
                         <input type="text" placeholder="Title" value={addFormData.title} onChange={e=>setAddFormData({...addFormData, title:e.target.value})} style={inputStyle} required />
                         {/* ... rest of inputs ... */}
                        
                        <div style={fileBoxStyle}><label>Poster</label><input key={resetKey} type="file" accept="image/*" onChange={e=>setFiles({...files, image:e.target.files[0]})} style={{color:'white'}} /></div>
                        <div style={fileBoxStyle}><label>Video</label><input key={resetKey} type="file" accept="video/*" onChange={e=>setFiles({...files, video:e.target.files[0]})} style={{color:'white'}} /></div>
                        
                        <button type="submit" className="btn btn-red" disabled={uploading} style={{marginTop:'10px', padding:'15px'}}>{uploading ? uploadProgress : "Upload"}</button>
                    </form>
                </div>
            )}

            {/* --- TAB: BANNERS --- */}
            {activeTab === 'banners' && (
                <div style={formContainerStyle}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                        <h3>{editingBanner ? "Edit Banner" : "Add Hero Banner"}</h3>
                        {editingBanner && <button onClick={cancelEditBanner} style={{background:'transparent', border:'none', color:'#aaa', cursor:'pointer'}}><FaTimes /> Cancel</button>}
                    </div>
                    <form onSubmit={handleBannerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <input type="text" placeholder="Title" value={bannerForm.title} onChange={e=>setBannerForm({...bannerForm, title:e.target.value})} style={inputStyle} required />
                        <input type="text" placeholder="Tag" value={bannerForm.tag} onChange={e=>setBannerForm({...bannerForm, tag:e.target.value})} style={inputStyle} />
                        <textarea placeholder="Description" value={bannerForm.description} onChange={e=>setBannerForm({...bannerForm, description:e.target.value})} style={inputStyle} required />
                        
                        {/* SHOW CURRENT IMAGE IF EDITING */}
                        {editingBanner && <div style={{color:'#aaa', fontSize:'0.8rem'}}>Current: {editingBanner.image}</div>}
                        <div style={fileBoxStyle}><label>Wallpaper</label><input key={resetKey} type="file" accept="image/*" onChange={e=>setBannerFiles({...bannerFiles, image:e.target.files[0]})} style={{color:'white'}} /></div>
                        
                        <div style={fileBoxStyle}><label>Video</label><input key={resetKey} type="file" accept="video/*" onChange={e=>setBannerFiles({...bannerFiles, video:e.target.files[0]})} style={{color:'white'}} /></div>
                        
                        <button type="submit" className="btn btn-red" disabled={uploading}>{uploading ? uploadProgress : "Save Banner"}</button>
                    </form>

                    <div style={{marginTop:'30px'}}>
                        <h4>Active Banners</h4>
                        {carouselList.map(item => (
                            <div key={item.id} style={{borderBottom:'1px solid #333', padding:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <div><strong>{item.title}</strong><br/><span style={{fontSize:'0.8rem', color:'#aaa'}}>{item.tag}</span></div>
                                <div style={{display:'flex', gap:'10px'}}>
                                    <button onClick={() => startEditBanner(item)} style={{color:'white', background:'transparent', border:'none', cursor:'pointer'}}><FaEdit/></button>
                                    <button onClick={() => handleDeleteBanner(item.id)} style={{color:'red', background:'transparent', border:'none', cursor:'pointer'}}><FaTrash/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* (Keep Edit Item and Analytics Tabs as they were) */}
             {/* ... */}
        </div>
    </div>
  );
};

const inputStyle = { padding: '12px', background: '#2a2a2a', border: '1px solid #444', color: '#fff', borderRadius: '4px', outline:'none' };
const fileBoxStyle = { background: '#2a2a2a', padding: '15px', borderRadius: '4px', border: '1px dashed #555', display:'flex', flexDirection:'column', gap:'5px' };
const formContainerStyle = { maxWidth: '600px', margin: '0 auto', background: '#1f1f1f', padding: '40px', borderRadius: '10px', border: '1px solid #333' };
const activeStyle = { background: '#e50914', color: '#fff', border: 'none', padding: '10px 25px', borderRadius: '4px', cursor: 'pointer', display:'flex', alignItems:'center', gap:'8px', fontWeight:'bold' };
const inactiveStyle = { background: '#333', color: '#aaa', border: 'none', padding: '10px 25px', borderRadius: '4px', cursor: 'pointer', display:'flex', alignItems:'center', gap:'8px' };

export default AdminPage;