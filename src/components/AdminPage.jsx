import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaPlus, FaSearch, FaUpload, FaImage, FaArrowLeft, FaTrash, FaStar, FaChartBar } from 'react-icons/fa';
import { API_URL } from '../config';

const GENRES = ["Action", "Sci-Fi", "Drama", "Comedy", "Horror", "Thriller", "Romance", "Animation", "Fantasy", "Adventure"];

// 👇 REPLACE WITH YOUR CLOUDINARY DETAILS
const CLOUD_NAME = "your_cloud_name"; // Get from Cloudinary Dashboard
const UPLOAD_PRESET = "your_unsigned_preset"; // Get from Settings -> Upload -> Upload presets

const AdminPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('manage');
  const [contentList, setContentList] = useState([]);
  const [carouselList, setCarouselList] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Forms & State
  const [addFormData, setAddFormData] = useState({ title: '', description: '', rating: '', category: 'movie', year: '', cast: '', featured: false });
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [files, setFiles] = useState({ image: null, video: null, trailer: null });
  const [editingItem, setEditingItem] = useState(null);

  // ... (Keep fetchAll, fetchCarousel, fetchAnalytics, handleGenreToggle, handleDelete exactly as before) ...
  useEffect(() => { fetchAll(); fetchCarousel(); fetchAnalytics(); }, []);

  const fetchAll = async () => { /* ... your existing fetchAll code ... */ };
  const fetchCarousel = async () => { /* ... your existing fetchCarousel code ... */ };
  const fetchAnalytics = async () => { /* ... your existing fetchAnalytics code ... */ };
  const handleGenreToggle = (g) => { /* ... your existing code ... */ };
  const handleDelete = async (id) => { /* ... your existing code ... */ };

  // 👇 NEW: HELPER FUNCTION TO UPLOAD TO CLOUDINARY DIRECTLY
  const uploadToCloudinary = async (file, resourceType = 'image') => {
    if (!file) return null;
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET); // Unsigned preset
    data.append("cloud_name", CLOUD_NAME);

    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
            method: "POST",
            body: data
        });
        const json = await res.json();
        return json.secure_url; // Returns the web link (e.g., https://res.cloudinary...)
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        throw error;
    }
  };

  // 👇 UPDATED: SUBMIT HANDLER
  const handleAddSubmit = async (e) => {
    e.preventDefault(); 
    setUploading(true);

    try {
        // 1. Upload Files Directly to Cloudinary (Frontend -> Cloud)
        // This bypasses Render/Vercel limits entirely
        let imageUrl = "";
        let videoUrl = "";
        let trailerUrl = "";

        if (files.image) imageUrl = await uploadToCloudinary(files.image, 'image');
        if (files.video) videoUrl = await uploadToCloudinary(files.video, 'video');
        if (files.trailer) trailerUrl = await uploadToCloudinary(files.trailer, 'video');

        // 2. Prepare Data for Backend
        // Now we send TEXT LINKS, not heavy files
        const payload = {
            ...addFormData,
            genres: JSON.stringify(selectedGenres),
            image: imageUrl,
            videoUrl: videoUrl,
            trailerUrl: trailerUrl || videoUrl
        };

        // 3. Send JSON to Backend (Fast & Lightweight)
        const res = await fetch(`${API_URL}/api/admin/add-direct`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, // Sending JSON now
            body: JSON.stringify(payload) 
        });

        if (res.ok) {
            alert("✅ Content Uploaded Successfully!");
            setAddFormData({ title: '', description: '', rating: '', category: 'movie', year: '', cast: '', featured: false });
            setSelectedGenres([]); 
            setFiles({ image: null, video: null, trailer: null });
            document.querySelectorAll('input[type="file"]').forEach(i => i.value = '');
            fetchAll(); 
            setActiveTab('manage');
        } else {
            alert("Backend Failed to save data.");
        }
    } catch (err) { 
        console.error(err);
        alert("Upload Error: Check internet or Cloudinary settings.");
    } finally { 
        setUploading(false); 
    }
  };

  // ... (Keep the rest of your JSX exactly the same) ...
  // ... Just ensure you update the input `onChange` to set the `files` state correctly ...

  return (
      // ... (Your existing JSX return statement) ...
      // Ensure your file inputs look like this:
      // <input type="file" onChange={(e) => setFiles({...files, video: e.target.files[0]})} />
      <div style={{/*...*/}}>
          {/* ... */}
      </div>
  );
};
// ... (Styles export) ...
export default AdminPage;