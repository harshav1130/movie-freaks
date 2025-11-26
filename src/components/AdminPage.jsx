import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaPlus, FaSearch, FaUpload, FaImage, FaArrowLeft, FaTrash, FaStar, FaChartBar } from 'react-icons/fa';
import { API_URL } from '../config';

const GENRES = ["Action", "Sci-Fi", "Drama", "Comedy", "Horror", "Thriller", "Romance", "Animation", "Fantasy", "Adventure"];

// 👇 REPLACE WITH YOUR CLOUDINARY KEYS
const CLOUD_NAME = "djlfj4upe"; // Your Cloud Name
const UPLOAD_PRESET = "UPLOAD_PRESET"; // 👈 PASTE PRESET NAME HERE (from Step 1)

const AdminPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('manage');
  const [contentList, setContentList] = useState([]);
  const [carouselList, setCarouselList] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("0%");

  // Forms
  const [addFormData, setAddFormData] = useState({ title: '', description: '', rating: '', category: 'movie', year: '', cast: '', featured: false });
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [files, setFiles] = useState({ image: null, video: null, trailer: null });
  
  // Edit & Banner
  const [editingItem, setEditingItem] = useState(null);
  const [bannerForm, setBannerForm] = useState({ title: '', description: '', tag: 'Featured', videoUrl: '' });
  const [bannerFiles, setBannerFiles] = useState({ image: null, video: null });
  const [editingBanner, setEditingBanner] = useState(null);
  
  // Reset Key
  const [resetKey, setResetKey] = useState(Date.now());

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

  // 👇 DIRECT UPLOAD FUNCTION (The Magic Fix)
  const uploadToCloudinary = async (file, type) => {
      if (!file) return null;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET); // Must be Unsigned
      formData.append("cloud_name", CLOUD_NAME);
      formData.append("resource_type", type); // 'image' or 'video'

      try {
          const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${type}/upload`, {
              method: "POST",
              body: formData
          });
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

  const handleAddSubmit = async (e) => {
    e.preventDefault(); 
    setUploading(true);
    setUploadProgress("Starting...");

    try {
        // 1. Upload Files to Cloud (Browser -> Cloudinary)
        setUploadProgress("Uploading Image...");
        const imageUrl = files.image ? await uploadToCloudinary(files.image, 'image') : "";
        
        setUploadProgress("Uploading Video (This may take time)...");
        const videoUrl = files.video ? await uploadToCloudinary(files.video, 'video') : "";
        const trailerUrl = files.trailer ? await uploadToCloudinary(files.trailer, 'video') : videoUrl;

        // 2. Prepare Data for Backend (Strings only)
        const payload = {
            ...addFormData,
            genres: JSON.stringify(selectedGenres),
            image: imageUrl,
            videoUrl: videoUrl,
            trailerUrl: trailerUrl
        };

        // 3. Send Text to Backend (Instant)
        setUploadProgress("Saving...");
        const res = await fetch(`${API_URL}/api/admin/add-direct`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });

        if (res.ok) {
            alert("✅ Content Uploaded Successfully!");
            setAddFormData({ title: '', description: '', rating: '', category: 'movie', year: '', cast: '', featured: false });
            setSelectedGenres([]); setFiles({ image: null, video: null, trailer: null });
            setResetKey(Date.now());
            fetchAll(); setActiveTab('manage');
        } else {
            alert("Backend failed to save.");
        }
    } catch (err) { alert("Error during upload process."); } 
    finally { setUploading(false); setUploadProgress(""); }
  };

  // Handle Banner Upload
  const handleBannerSubmit = async (e) => {
      e.preventDefault(); setUploading(true); setUploadProgress("Uploading Banner...");
      
      try {
        let imageUrl = editingBanner?.image || "";
        let videoUrl = editingBanner?.videoUrl || "";

        if (bannerFiles.image) imageUrl = await uploadToCloudinary(bannerFiles.image, 'image');
        if (bannerFiles.video) videoUrl = await uploadToCloudinary(bannerFiles.video, 'video');

        const payload = { ...bannerForm, image: imageUrl, videoUrl };
        
        let url = `${API_URL}/api/admin/carousel/add-direct`;
        let method = 'POST';
        if (editingBanner) {
            url = `${API_URL}/api/admin/carousel/update-direct/${editingBanner.id}`;
            method = 'PUT';
        }

        const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
        
        if(res.ok) { 
            alert("Banner Saved!"); 
            setBannerForm({ title: '', description: '', tag: 'Featured', videoUrl: '' });
            setBannerFiles({ image: null, video: null });
            setEditingBanner(null);
            setResetKey(Date.now());
            fetchCarousel(); 
        } else alert("Failed");
      } catch(e) { alert("Error"); }
      setUploading(false);
  };

  // Helper handlers
  const handleGenreToggle = (g) => { selectedGenres.includes(g) ? setSelectedGenres(selectedGenres.filter(i=>i!==g)) : setSelectedGenres([...selectedGenres, g]); };
  const handleDelete = async (id) => { if(confirm("Delete?")) { await fetch(`${API_URL}/api/admin/delete/${id}`, {method:'DELETE'}); fetchAll(); } };
  const handleDeleteBanner = async (id) => { if(confirm("Delete?")) { await fetch(`${API_URL}/api/admin/carousel/delete/${id}`, {method:'DELETE'}); fetchCarousel(); } };
  
  // Render...
  const filteredList = contentList.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#121212', color: '#e0e0e0', overflowY: 'auto', zIndex: 9999 }}>
        <div style={{ height: '70px', background: '#1f1f1f', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', position: 'sticky', top: 0, zIndex: 100 }}>
            <button onClick={() => navigate('/')} style={{ background: 'transparent', border: '1px solid #555', color: '#fff', padding: '8px 16px', borderRadius: '5px' }}><FaArrowLeft /> Back</button>
            <h2 style={{ margin: 0, color: '#fff' }}>Admin Dashboard</h2>
            <div style={{ width: '100px' }}></div>
        </div>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '40px' }}>
                <button onClick={() => {setActiveTab('manage'); setEditingItem(null)}} className="btn" style={activeTab==='manage'?activeTabStyle:inactiveTabStyle}><FaEdit /> Manage</button>
                <button onClick={() => setActiveTab('add')} className="btn" style={activeTab==='add'?activeTabStyle:inactiveTabStyle}><FaPlus /> Add New</button>
                <button onClick={() => setActiveTab('banners')} className="btn" style={activeTab==='banners'?activeTabStyle:inactiveTabStyle}><FaStar /> Banners</button>
                <button onClick={() => setActiveTab('analytics')} className="btn" style={activeTab==='analytics'?activeTabStyle:inactiveTabStyle}><FaChartBar /> Analytics</button>
            </div>

            {/* ADD NEW FORM */}
            {activeTab === 'add' && (
                <div style={formContainerStyle}>
                    <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Upload Content</h2>
                    <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {/* Inputs (Same as before) */}
                        <select value={addFormData.category} onChange={e=>setAddFormData({...addFormData, category:e.target.value})} style={inputStyle}><option value="movie">Movie</option><option value="series">Web Series</option><option value="anime">Anime</option></select>
                        <input type="text" placeholder="Title" value={addFormData.title} onChange={e=>setAddFormData({...addFormData, title:e.target.value})} style={inputStyle} required />
                        <textarea placeholder="Description" value={addFormData.description} onChange={e=>setAddFormData({...addFormData, description:e.target.value})} style={inputStyle} />
                        <input type="number" placeholder="Rating (0-10)" value={addFormData.rating} onChange={e=>setAddFormData({...addFormData, rating:e.target.value})} style={inputStyle} />
                        <input type="text" placeholder="Year" value={addFormData.year} onChange={e=>setAddFormData({...addFormData, year:e.target.value})} style={inputStyle} />
                        <input type="text" placeholder="Cast" value={addFormData.cast} onChange={e=>setAddFormData({...addFormData, cast:e.target.value})} style={inputStyle} />
                        
                        <div style={{display:'flex', flexWrap:'wrap', gap:'5px'}}>{GENRES.map(g=><span key={g} onClick={()=>handleGenreToggle(g)} style={{padding:'5px', border:'1px solid #555', borderRadius:'10px', cursor:'pointer', background:selectedGenres.includes(g)?'#e50914':'transparent'}}>{g}</span>)}</div>
                        
                        <div style={fileBoxStyle}><label>Poster</label><input key={resetKey} type="file" accept="image/*" onChange={e=>setFiles({...files, image:e.target.files[0]})} style={{color:'white'}} /></div>
                        <div style={fileBoxStyle}><label>Trailer (Optional)</label><input key={resetKey} type="file" accept="video/*" onChange={e=>setFiles({...files, trailer:e.target.files[0]})} style={{color:'white'}} /></div>
                        {addFormData.category === 'movie' && <div style={fileBoxStyle}><label>Movie File</label><input key={resetKey} type="file" accept="video/*" onChange={e=>setFiles({...files, video:e.target.files[0]})} style={{color:'white'}} /></div>}

                        <button type="submit" className="btn btn-red" disabled={uploading} style={{marginTop:'10px', padding:'15px'}}>
                            {uploading ? uploadProgress : "Upload Content"}
                        </button>
                    </form>
                </div>
            )}

            {/* BANNERS TAB (UPDATED for Direct Upload) */}
            {activeTab === 'banners' && (
                <div style={formContainerStyle}>
                    <h3>Add Hero Banner</h3>
                    <form onSubmit={handleBannerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <input type="text" placeholder="Title" value={bannerForm.title} onChange={e=>setBannerForm({...bannerForm, title:e.target.value})} style={inputStyle} />
                        <textarea placeholder="Description" value={bannerForm.description} onChange={e=>setBannerForm({...bannerForm, description:e.target.value})} style={inputStyle} />
                        <div style={fileBoxStyle}><label>Banner Image</label><input key={resetKey} type="file" accept="image/*" onChange={e=>setBannerFiles({...bannerFiles, image:e.target.files[0]})} style={{color:'white'}} /></div>
                        <div style={fileBoxStyle}><label>Video/Trailer</label><input key={resetKey} type="file" accept="video/*" onChange={e=>setBannerFiles({...bannerFiles, video:e.target.files[0]})} style={{color:'white'}} /></div>
                        <button type="submit" className="btn btn-red" disabled={uploading}>{uploading ? uploadProgress : "Add Banner"}</button>
                    </form>
                    {/* Existing Banners List */}
                    <div style={{marginTop:'30px'}}>{carouselList.map(item => (<div key={item.id} style={{borderBottom:'1px solid #333', padding:'10px', display:'flex', justifyContent:'space-between'}}><p>{item.title}</p><button onClick={()=>handleDeleteBanner(item.id)} style={{color:'red'}}>Delete</button></div>))}</div>
                </div>
            )}

            {/* MANAGE & ANALYTICS TABS (Keep same simple list logic as before) */}
            {activeTab === 'manage' && <div style={{color:'#aaa', textAlign:'center'}}>Use "Add New" to upload. Edit items here (Coming Soon).</div>}
        </div>
    </div>
  );
};

const inputStyle = { padding: '12px', background: '#2a2a2a', border: '1px solid #444', color: '#fff', borderRadius: '4px', outline:'none' };
const fileBoxStyle = { background: '#2a2a2a', padding: '15px', borderRadius: '4px', border: '1px dashed #555', display:'flex', flexDirection:'column', gap:'5px' };
const formContainerStyle = { maxWidth: '600px', margin: '0 auto', background: '#1f1f1f', padding: '40px', borderRadius: '10px', border: '1px solid #333' };
const activeTabStyle = { background: '#e50914', color: '#fff', border: 'none', padding: '10px 25px', borderRadius: '4px', cursor: 'pointer', display:'flex', alignItems:'center', gap:'8px', fontWeight:'bold' };
const inactiveTabStyle = { background: '#333', color: '#aaa', border: 'none', padding: '10px 25px', borderRadius: '4px', cursor: 'pointer', display:'flex', alignItems:'center', gap:'8px' };

export default AdminPage;