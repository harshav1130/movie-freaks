import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaPlus, FaSearch, FaUpload, FaImage, FaArrowLeft, FaTrash, FaStar, FaChartBar, FaTimes } from 'react-icons/fa';
import { API_URL } from '../config';
import { toast } from 'react-toastify';

const GENRES = ["Action", "Sci-Fi", "Drama", "Comedy", "Horror", "Thriller", "Romance", "Animation", "Fantasy", "Adventure"];

// CLOUDINARY KEYS
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
  const [uploadProgress, setUploadProgress] = useState("");
  const [resetKey, setResetKey] = useState(Date.now());

  // Forms
  const [addFormData, setAddFormData] = useState({ title: '', description: '', rating: '', category: 'movie', year: '', cast: '', featured: false });
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [files, setFiles] = useState({ image: null, video: null, trailer: null });
  
  // Edit & Banner
  const [editingItem, setEditingItem] = useState(null);
  const [bannerForm, setBannerForm] = useState({ title: '', description: '', tag: 'Featured', videoUrl: '' });
  const [bannerFiles, setBannerFiles] = useState({ image: null, video: null });
  const [editingBanner, setEditingBanner] = useState(null);
  
  // Episode Form
  const [episodeForm, setEpisodeForm] = useState({ seasonName: 'Season 1', title: '', duration: '' });
  const [seasonPosterForm, setSeasonPosterForm] = useState({ seasonName: 'Season 1' });

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

  const fetchCarousel = async () => { try { const res = await fetch(`${API_URL}/api/carousel`); setCarouselList(await res.json()); } catch (e) {} };
  const fetchAnalytics = async () => { try { const res = await fetch(`${API_URL}/api/admin/analytics`); setAnalytics(await res.json()); } catch(e) {} };

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
        toast.error(`Upload Failed: ${error.message}`); throw error;
      }
  };

  // --- HANDLERS ---

  // 👇 NEW: DELETE EPISODE HANDLER ADDED HERE
  const handleDeleteEpisode = async (seasonName, episodeTitle) => {
      if (!confirm(`Delete "${episodeTitle}" from ${seasonName}?`)) return;
      try {
          const res = await fetch(`${API_URL}/api/admin/episode/delete`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  contentId: editingItem.id,
                  seasonName: seasonName,
                  episodeTitle: episodeTitle
              })
          });
          if (res.ok) {
              const data = await res.json();
              toast.info("Episode Deleted");
              setEditingItem({ ...editingItem, seasons: data.seasons }); // Update UI immediately
              fetchAll();
          } else { alert("Failed to delete episode."); }
      } catch (e) { console.error(e); alert("Error deleting episode."); }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault(); setUploading(true); setUploadProgress("Processing...");
    try {
        setUploadProgress("Uploading Files...");
        const imageUrl = files.image ? await uploadToCloudinary(files.image, 'image') : "";
        const videoUrl = files.video ? await uploadToCloudinary(files.video, 'video') : "";
        const trailerUrl = files.trailer ? await uploadToCloudinary(files.trailer, 'video') : videoUrl;
        const payload = { ...addFormData, genres: JSON.stringify(selectedGenres), image: imageUrl, videoUrl: videoUrl, trailerUrl: trailerUrl };
        const res = await fetch(`${API_URL}/api/admin/add-direct`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) { toast.success("✅ Content Uploaded Successfully!"); setAddFormData({ title: '', description: '', rating: '', category: 'movie', year: '', cast: '', featured: false }); setSelectedGenres([]); setFiles({ image: null, video: null, trailer: null }); setResetKey(Date.now()); fetchAll(); setActiveTab('manage'); } else alert("Backend failed.");
    } catch (err) { alert("Error"); } finally { setUploading(false); setUploadProgress(""); }
  };

  const handleBannerSubmit = async (e) => {
      e.preventDefault(); setUploading(true); setUploadProgress("Uploading...");
      try {
        let img = editingBanner?.image||"", vid=editingBanner?.videoUrl||"";
        if(bannerFiles.image) img = await uploadToCloudinary(bannerFiles.image, 'image');
        if(bannerFiles.video) vid = await uploadToCloudinary(bannerFiles.video, 'video');
        const payload = { ...bannerForm, image:img, videoUrl:vid };
        let url = `${API_URL}/api/admin/carousel/add-direct`, method = 'POST';
        if(editingBanner){ url = `${API_URL}/api/admin/carousel/update-direct/${editingBanner.id}`; method='PUT'; }
        const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
        if(res.ok) { toast.success(editingBanner ? "✅ Banner Updated!" : "✅ Banner Added!"); setBannerForm({ title: '', description: '', tag: 'Featured', videoUrl: '' }); setBannerFiles({ image: null, video: null }); setEditingBanner(null); setResetKey(Date.now()); fetchCarousel(); } else alert("Failed");
      } catch(e) { alert("Error"); } setUploading(false);
  };

  const handleGenreToggle = (g) => { selectedGenres.includes(g) ? setSelectedGenres(selectedGenres.filter(i=>i!==g)) : setSelectedGenres([...selectedGenres, g]); };
  const handleDelete = async (id) => { if(confirm("Delete?")) { await fetch(`${API_URL}/api/admin/delete/${id}`, {method:'DELETE'}); fetchAll(); } };
  const handleDeleteBanner = async (id) => { if(confirm("Delete?")) { await fetch(`${API_URL}/api/admin/carousel/delete/${id}`, {method:'DELETE'}); fetchCarousel(); } };
  const startEditBanner = (item) => { setEditingBanner(item); setBannerForm({ title: item.title||"", description: item.description||"", tag: item.tag||"", videoUrl: item.videoUrl||"" }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const cancelEditBanner = () => { setEditingBanner(null); setBannerForm({ title: '', description: '', tag: 'Featured', videoUrl: '' }); setResetKey(Date.now()); };
  
  const handleUpdateDetails = async (e) => {
    e.preventDefault(); 
    setUploading(true);
    
    try {
        let imageUrl = editingItem.image; // Default to existing image
        
        const fileInput = document.getElementById('editImageInput');
        if (fileInput?.files[0]) {
            // Upload new image if selected
            imageUrl = await uploadToCloudinary(fileInput.files[0], 'image');
        }

        const payload = {
            title: editingItem.title,
            description: editingItem.description,
            year: editingItem.year,
            cast: editingItem.cast,
            image: imageUrl // Send the new (or old) URL
        };

        const res = await fetch(`${API_URL}/api/admin/update-direct/${editingItem.id}`, { 
            method: 'PUT', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(payload) 
        });

        if (res.ok) {
            toast.success("Details Updated!");
            setResetKey(Date.now()); // Clear inputs
            fetchAll(); 
        } else {
            alert("Update Failed.");
        }
    } catch (e) { console.error(e); alert("Error updating details"); }
    
    setUploading(false);
};
  const handleAddEpisode = async (e) => { 
      e.preventDefault(); setUploading(true); setUploadProgress("Uploading Episode...");
      try {
          const fileInput = document.getElementById('episodeVideoInput');
          if (!fileInput.files[0]) { alert("Select Video"); setUploading(false); return; }
          const vidUrl = await uploadToCloudinary(fileInput.files[0], 'video');
          const payload = { contentId: editingItem.id, seasonName: episodeForm.seasonName, title: episodeForm.title, duration: episodeForm.duration, videoUrl: vidUrl };
          const res = await fetch(`${API_URL}/api/admin/add-episode-direct`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
          if(res.ok) { 
              const updatedData = await res.json(); 
              toast.success("✅ Episode Added!"); 
              setEditingItem({ ...editingItem, seasons: updatedData.seasons }); // Refresh list
              setResetKey(Date.now()); 
              fetchAll(); 
          }
      } catch(e){ alert(e.message); } 
      setUploading(false); 
  };
  
  const handleUpdateSeasonPoster = async (e) => {
    e.preventDefault(); 
    setUploading(true);
    
    try {
        const fileInput = document.getElementById('seasonPosterInput');
        if (!fileInput.files[0]) { 
            alert("Please select an image"); 
            setUploading(false); 
            return; 
        }

        // 1. Upload to Cloudinary
        const imageUrl = await uploadToCloudinary(fileInput.files[0], 'image');

        // 2. Send URL to Backend
        const payload = {
            contentId: editingItem.id,
            seasonName: seasonPosterForm.seasonName,
            image: imageUrl
        };

        const res = await fetch(`${API_URL}/api/admin/update-season-poster-direct`, { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(payload) 
        });

        if(res.ok) { 
            toast.success("✅ Season Poster Updated!"); 
            setResetKey(Date.now());
            
            // Refresh the specific item to show new poster
            // (Or fetchAll to be safe)
            fetchAll(); 
        } else {
            alert("Failed to update poster.");
        }
    } catch (e) { console.error(e); alert("Error updating poster"); }
    
    setUploading(false);
}
  const filteredList = contentList.filter(i => i.title?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#121212', color: '#e0e0e0', overflowY: 'auto', zIndex: 9999 }}>
        
        <div style={{ height: '70px', background: '#1f1f1f', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', position: 'sticky', top: 0, zIndex: 100 }}>
            <button onClick={() => navigate('/')} style={{ background: 'transparent', border: '1px solid #555', color: '#fff', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><FaArrowLeft /> Back to Website</button>
            <h2 style={{ margin: 0, color: '#fff' }}>Admin Dashboard</h2>
            <div style={{ width: '100px' }}></div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '40px' }}>
                <button onClick={() => {setActiveTab('manage'); setEditingItem(null)}} className="btn" style={activeTab === 'manage' ? activeTabStyle : inactiveTabStyle}><FaEdit /> Manage</button>
                <button onClick={() => setActiveTab('add')} className="btn" style={activeTab === 'add' ? activeTabStyle : inactiveTabStyle}><FaPlus /> Add New</button>
                <button onClick={() => setActiveTab('banners')} className="btn" style={activeTab === 'banners' ? activeTabStyle : inactiveTabStyle}><FaStar /> Banners</button>
                <button onClick={() => setActiveTab('analytics')} className="btn" style={activeTab === 'analytics' ? activeTabStyle : inactiveTabStyle}><FaChartBar /> Analytics</button>
            </div>

            {activeTab === 'manage' && !editingItem && (
                <div>
                    <div className="search-bar" style={{ maxWidth: '600px', margin: '0 auto 30px auto', background: '#1f1f1f' }}><input type="text" placeholder="Search..." onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', background: 'transparent', border:'none', color:'#fff', padding:'10px' }} /><FaSearch style={{ marginRight: '15px', color: '#777' }} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
                        {filteredList.map(item => (
                            <div key={item.id} style={{ background: '#1f1f1f', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333', position: 'relative' }}>
                                <img src={item.image} alt="" style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
                                <div style={{ padding: '12px' }}>
                                    <h4 style={{ margin: '0 0 5px 0', fontSize: '0.95rem' }}>{item.title}</h4>
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                                        <span style={{ fontSize: '0.75rem', background: '#333', padding: '3px 8px', borderRadius: '4px', color: '#aaa' }}>{item.category?.toUpperCase()}</span>
                                        <button onClick={() => handleDelete(item.id)} style={{background:'transparent', border:'none', color:'#e50914', cursor:'pointer', fontSize:'1.1rem'}} title="Delete Content"><FaTrash/></button>
                                    </div>
                                    <button onClick={() => setEditingItem(item)} style={{ width: '100%', padding: '8px', background: '#444', border: '1px solid #555', color: '#fff', cursor: 'pointer', borderRadius: '4px' }}>Edit / Manage</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'add' && (
                <div style={formContainerStyle}>
                    <h2 style={{ marginBottom: '20px', textAlign: 'center', borderBottom: '1px solid #333', paddingBottom: '15px' }}>Upload Content</h2>
                    <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {/* ... (Existing Inputs) ... */}
                        <div style={{display:'flex', gap:'10px'}}><div style={{flex:1}}><label>Category</label><select value={addFormData.category} onChange={(e) => setAddFormData({...addFormData, category: e.target.value})} style={inputStyle}><option value="movie">Movie</option><option value="series">Web Series</option><option value="anime">Anime</option></select></div><div style={{flex:1}}><label>Rating</label><input type="number" step="0.1" min="0" max="10" value={addFormData.rating} onChange={(e) => setAddFormData({...addFormData, rating: e.target.value})} required style={inputStyle} /></div></div>
                        <input type="text" placeholder="Title" value={addFormData.title} onChange={(e) => setAddFormData({...addFormData, title: e.target.value})} required style={inputStyle} />
                        <div style={{display:'flex', gap:'10px'}}><div style={{flex:1}}><label>Year</label><input type="text" placeholder="e.g. 2024" value={addFormData.year} onChange={(e) => setAddFormData({...addFormData, year: e.target.value})} style={inputStyle} /></div><div style={{flex:2}}><label>Cast</label><input type="text" placeholder="Names..." value={addFormData.cast} onChange={(e) => setAddFormData({...addFormData, cast: e.target.value})} style={inputStyle} /></div></div>
                        <textarea placeholder="Description" value={addFormData.description} onChange={(e) => setAddFormData({...addFormData, description: e.target.value})} required rows="3" style={inputStyle} />
                        <label style={{color:'#aaa'}}>Genres</label><div style={{display:'flex', flexWrap:'wrap', gap:'8px'}}>{GENRES.map(g=><span key={g} onClick={()=>handleGenreToggle(g)} style={{padding:'5px', border:'1px solid #555', borderRadius:'10px', cursor:'pointer', background:selectedGenres.includes(g)?'#e50914':'transparent'}}>{g}</span>)}</div>
                        <div style={{display:'flex', alignItems:'center', gap:'10px', background:'#333', padding:'10px', borderRadius:'4px'}}><input type="checkbox" checked={addFormData.featured} onChange={(e) => setAddFormData({...addFormData, featured: e.target.checked})} /><label>Add to Hero Carousel (Featured)</label></div>
                        <div style={fileBoxStyle}><label>Poster Image</label><input key={resetKey} type="file" accept="image/*" onChange={(e) => setFiles({...files, image: e.target.files[0]})} required style={{color:'#fff'}} /></div>
                        <div style={fileBoxStyle}><label>Trailer (Optional)</label><input key={resetKey} type="file" accept="video/*" onChange={(e) => setFiles({...files, trailer: e.target.files[0]})} style={{color:'#fff'}} /></div>
                        {addFormData.category === 'movie' && <div style={fileBoxStyle}><label>Full Movie File</label><input key={resetKey} type="file" accept="video/*" onChange={(e) => setFiles({...files, video: e.target.files[0]})} required style={{color:'#fff'}} /></div>}
                        <button type="submit" className="btn btn-red" disabled={uploading} style={{ marginTop: '10px', padding: '15px', opacity: uploading ? 0.7 : 1 }}>{uploading ? uploadProgress : "Upload Content"}</button>
                    </form>
                </div>
            )}

            {activeTab === 'banners' && (
                <div style={formContainerStyle}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                        <h3>{editingBanner ? "Edit Banner" : "Add Hero Banner"}</h3>
                        {editingBanner && <button onClick={cancelEditBanner} style={{background:'transparent', border:'none', color:'#aaa', cursor:'pointer'}}><FaTimes /> Cancel</button>}
                    </div>
                    <form onSubmit={handleBannerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop:'15px' }}>
                        <input type="text" placeholder="Title" value={bannerForm.title} onChange={e=>setBannerForm({...bannerForm, title:e.target.value})} style={inputStyle} required />
                        <input type="text" placeholder="Tag" value={bannerForm.tag} onChange={e=>setBannerForm({...bannerForm, tag:e.target.value})} style={inputStyle} />
                        <textarea placeholder="Description" value={bannerForm.description} onChange={e=>setBannerForm({...bannerForm, description:e.target.value})} style={inputStyle} required />
                        <div style={fileBoxStyle}><label>Wallpaper</label><input key={resetKey} type="file" accept="image/*" onChange={e=>setBannerImageFile(e.target.files[0])} style={{color:'#fff'}} required={!editingBanner} /></div>
                        <div style={fileBoxStyle}><label>Video</label><input key={resetKey} type="file" accept="video/*" onChange={e=>setBannerVideoFile(e.target.files[0])} style={{color:'#fff'}} required={!editingBanner} /></div>
                        <button type="submit" className="btn btn-red" disabled={uploading}>{uploading ? uploadProgress : "Save Banner"}</button>
                    </form>
                    <div style={{marginTop:'30px'}}>{carouselList.map(item => (<div key={item.id} style={{borderBottom:'1px solid #333', padding:'10px', display:'flex', justifyContent:'space-between'}}><p>{item.title}</p><button onClick={()=>handleDeleteBanner(item.id)} style={{color:'red', background:'transparent', border:'none', cursor:'pointer'}}><FaTrash/></button></div>))}</div>
                </div>
            )}

            {activeTab === 'analytics' && (<div style={{ maxWidth: '800px', margin: '0 auto' }}> <h2 style={{textAlign:'center'}}>Top 5 Most Watched</h2> {analytics.map((item, index) => ( <div key={item.id} style={{display:'flex', alignItems:'center', background:'#222', padding:'15px', borderRadius:'8px', borderBottom:`4px solid ${index===0?'#e50914':'#333'}`, marginTop:'10px'}}> <span style={{fontSize:'1.5rem', fontWeight:'bold', width:'40px', color:'#777'}}>#{index+1}</span> <img src={item.image} style={{width:'50px', height:'75px', objectFit:'cover', borderRadius:'4px', marginRight:'20px'}} alt=""/> <div style={{flex:1}}><h3 style={{margin:0}}>{item.title}</h3><p style={{color:'#aaa', fontSize:'0.9rem', margin:'0'}}>{item.category?.toUpperCase()}</p></div> <div><span style={{fontSize:'1.5rem', fontWeight:'bold', color:'#fff'}}>{item.views || 0}</span></div> </div> ))} </div> )}

            {editingItem && (
                <div>
                    <button onClick={() => setEditingItem(null)} style={{ marginBottom: '20px', background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><FaArrowLeft /> Back to List</button>
                    <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, background: '#1f1f1f', padding: '30px', borderRadius: '10px', border: '1px solid #333' }}>
                            <h3 style={{marginBottom: '20px'}}>Edit Details</h3>
                            <form onSubmit={handleUpdateDetails} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <label>Title</label><input type="text" value={editingItem.title} onChange={(e) => setEditingItem({...editingItem, title: e.target.value})} style={inputStyle} />
                                <label>Description</label><textarea rows="5" value={editingItem.description} onChange={(e) => setEditingItem({...editingItem, description: e.target.value})} style={inputStyle} />
                                <label>Year</label><input type="text" value={editingItem.year || ''} onChange={(e) => setEditingItem({...editingItem, year: e.target.value})} style={inputStyle} />
                                <label>Cast</label><input type="text" value={editingItem.cast || ''} onChange={(e) => setEditingItem({...editingItem, cast: e.target.value})} style={inputStyle} />
                                <label>New Poster</label><input key={resetKey} type="file" id="editImageInput" style={inputStyle} />
                                <button type="submit" className="btn btn-red" disabled={uploading}>{uploading ? "Updating..." : "Save Changes"}</button>
                            </form>
                        </div>
                        
                        {editingItem.category !== 'movie' && (
                            <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                
                                {/* 👇 RESTORED THE "MANAGE EPISODES" LIST HERE */}
                                <div style={{ background: '#1f1f1f', padding: '30px', borderRadius: '10px', border: '1px solid #333', maxHeight:'400px', overflowY:'auto' }}>
                                    <h3>Manage Episodes</h3>
                                    {editingItem.seasons?.map(s => (
                                        <div key={s.name} style={{ marginBottom: '20px' }}>
                                            <h4 style={{borderBottom:'1px solid #444', paddingBottom:'5px', color:'#aaa'}}>{s.name}</h4>
                                            {s.episodes.length === 0 ? <p style={{fontSize:'0.8rem', color:'#555'}}>No episodes</p> : (
                                                <ul style={{listStyle:'none', padding:0}}>
                                                    {s.episodes.map(ep => (
                                                        <li key={ep.title} style={{display:'flex', justifyContent:'space-between', padding:'10px', background:'#2a2a2a', marginTop:'5px', borderRadius:'4px', alignItems:'center'}}>
                                                            <span>{ep.title} <small style={{color:'#777'}}>({ep.duration})</small></span>
                                                            <button onClick={() => handleDeleteEpisode(s.name, ep.title)} style={{background:'transparent', border:'none', color:'#e50914', cursor:'pointer'}} title="Delete Episode"><FaTrash /></button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div style={{ background: '#1f1f1f', padding: '30px', borderRadius: '10px', border: '1px solid #333' }}>
                                    <h3>Push New Episode</h3>
                                    <form onSubmit={handleAddEpisode} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                                        <div style={{display:'flex', gap:'10px'}}>
                                            <div style={{flex:1}}><label style={{color:'#aaa', fontSize:'0.9rem'}}>Season</label><input list="seasons-list" placeholder="Season Name" value={episodeForm.seasonName} onChange={e => setEpisodeForm({...episodeForm, seasonName: e.target.value})} style={{...inputStyle, width:'100%'}} /><datalist id="seasons-list">{editingItem.seasons?.map((s, i) => <option key={i} value={s.name} />)}<option value="Season 1" /><option value="Season 2" /></datalist></div>
                                            <div style={{flex:1}}><label style={{color:'#aaa', fontSize:'0.9rem'}}>Duration</label><input type="text" placeholder="e.g. 24m" value={episodeForm.duration} onChange={e => setEpisodeForm({...episodeForm, duration: e.target.value})} style={{...inputStyle, width:'100%'}} required /></div>
                                        </div>
                                        <input type="text" placeholder="Episode Title" value={episodeForm.title} onChange={e => setEpisodeForm({...episodeForm, title: e.target.value})} style={inputStyle} required />
                                        <div style={fileBoxStyle}><label style={{color:'#aaa', fontSize:'0.9rem'}}>Video File</label><input key={resetKey} type="file" id="episodeVideoInput" accept="video/*" style={{color:'#fff'}} required /></div>
                                        <button type="submit" className="btn btn-red" disabled={uploading} style={{marginTop:'10px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}>{uploading ? "Uploading..." : <><FaUpload /> Push Episode</>}</button>
                                    </form>
                                </div>
                                <div style={{ background: '#1f1f1f', padding: '30px', borderRadius: '10px', border: '1px solid #333' }}>
                                    <h3>Update Season Poster</h3>
                                    <form onSubmit={handleUpdateSeasonPoster} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                                        <select value={seasonPosterForm.seasonName} onChange={e => setSeasonPosterForm({...seasonPosterForm, seasonName: e.target.value})} style={inputStyle}>{editingItem.seasons?.map((s, i) => <option key={i} value={s.name}>{s.name}</option>)}</select>
                                        <div style={fileBoxStyle}><label style={{color:'#aaa', fontSize:'0.9rem'}}>Season Poster Image</label><input key={resetKey} type="file" id="seasonPosterInput" accept="image/*" style={{color:'#fff'}} required /></div>
                                        <button type="submit" className="btn btn-red" disabled={uploading}>{uploading ? "Uploading..." : <><FaImage /> Update Poster</>}</button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
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