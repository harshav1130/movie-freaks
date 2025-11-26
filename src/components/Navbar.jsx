import React, { useState } from 'react';
import { FaSearch, FaBars, FaTimes, FaUserCircle, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom'; // 👈 IMPORT useNavigate

const Navbar = ({ user, onLogout, onOpenSettings, searchData, onResultClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  
  // --- SEARCH STATE ---
  const [query, setQuery] = useState('');
  const [recommendations, setRecommendations] = useState([]);

  const navigate = useNavigate();

  // Scroll Helper (Smooth scroll without reload)
  const scrollToSection = (id) => {
      const section = document.getElementById(id);
      if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
          setProfileDropdown(false); // Close dropdown
          setMenuOpen(false); // Close mobile menu
      }
  };

  const handleSearch = (e) => {
    const searchText = e.target.value;
    setQuery(searchText);

    if (searchText.length > 0) {
        const filteredData = searchData.filter((item) => 
            item.title.toLowerCase().includes(searchText.toLowerCase())
        );
        setRecommendations(filteredData.slice(0, 5)); 
    } else {
        setRecommendations([]); 
    }
  };

  return (
    <header className={`navbar ${window.scrollY > 50 ? 'scrolled' : ''}`} id="mainNavbar">
      <div className="logo-app" onClick={() => navigate('/')} style={{cursor:'pointer'}}>Movie <span className="white-text">Freaks</span></div>
      
      <nav className={menuOpen ? 'open' : ''}>
        <ul>
          <li><span onClick={() => scrollToSection('home')} style={{cursor:'pointer', color:'white'}}>Home</span></li>
          <li><span onClick={() => scrollToSection('movies')} style={{cursor:'pointer', color:'white'}}>Movies</span></li>
          <li><span onClick={() => scrollToSection('series')} style={{cursor:'pointer', color:'white'}}>Web Series</span></li>
          <li><span onClick={() => scrollToSection('anime')} style={{cursor:'pointer', color:'white'}}>Anime</span></li>
          <li><span onClick={() => scrollToSection('mylist')} style={{cursor:'pointer', color:'white'}}>My List</span></li>

          {/* ADMIN PANEL LINK */}
          {user?.role === 'admin' && (
            <li>
                <Link to="/admin" style={{ color: 'var(--mf-red)', fontWeight: 'bold', textDecoration: 'none' }}>
                    Admin Panel
                </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* --- SEARCH BAR --- */}
      <div className="search-container" style={{ position: 'relative' }}>
          <div className="search-bar">
            <input 
                type="text" 
                placeholder="Search titles..." 
                value={query}
                onChange={handleSearch} 
            />
            <button><FaSearch /></button>
          </div>

          {/* DROPDOWN RESULTS */}
          {recommendations.length > 0 && (
              <div className="search-results-list">
                  {recommendations.map((item) => (
                      <div 
                        key={item.id} 
                        className="search-item"
                        onClick={() => {
                            onResultClick(item); 
                            setQuery('');       
                            setRecommendations([]); 
                        }}
                      >
                          <img src={item.image} alt={item.title} />
                          <span>{item.title}</span>
                      </div>
                  ))}
              </div>
          )}
      </div>
      
      {/* PROFILE SECTION */}
      <div id="auth-buttons-app" style={{ position: 'relative' }}>
        <div 
            className="profile-icon-container" 
            onClick={() => setProfileDropdown(!profileDropdown)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
            <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{user.username || "User"}</span>
            <FaUserCircle size={32} color="#fff" />
        </div>

       {profileDropdown && (
            <div className="profile-dropdown">
                <div onClick={() => scrollToSection('mylist')}>My List</div>
                <div onClick={() => scrollToSection('history')}>History</div>
                <hr style={{ borderColor: '#333', margin: '5px 0' }} />
                <div onClick={onOpenSettings}><FaCog /> Settings</div>
                <div onClick={onLogout} style={{ borderTop: '1px solid #333' }}><FaSignOutAlt /> Logout</div>
            </div>
        )}
      </div>
      
      <div className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <FaTimes /> : <FaBars />}
      </div>
    </header>
  );
};

export default Navbar;