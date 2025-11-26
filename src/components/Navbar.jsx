import React, { useState } from 'react';
import { FaSearch, FaBars, FaTimes, FaUserCircle, FaCog, FaSignOutAlt } from 'react-icons/fa';

const Navbar = ({ user, onLogout, onOpenSettings, searchData, onResultClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);

  // --- SEARCH FUNCTIONALITY STATE ---
  const [query, setQuery] = useState('');
  const [recommendations, setRecommendations] = useState([]);

  // This function runs every time you type
  const handleSearch = (e) => {
    const searchText = e.target.value;
    setQuery(searchText);

    if (searchText.length > 0) {
        // Filter the data based on title
        const filteredData = searchData.filter((item) => 
            item.title.toLowerCase().includes(searchText.toLowerCase())
        );
        setRecommendations(filteredData.slice(0, 5)); // Show top 5 results
    } else {
        setRecommendations([]); // Clear if input is empty
    }
  };

  return (
    <header className={`navbar ${window.scrollY > 50 ? 'scrolled' : ''}`} id="mainNavbar">
      <div className="logo-app">Movie <span className="white-text">Freaks</span></div>
      
      <nav className={menuOpen ? 'open' : ''}>
        <ul>
          <li><a href="#home">Home</a></li>
          <li><a href="#movies">Movies</a></li>
          <li><a href="#series">Web Series</a></li>
          <li><a href="#anime">Animes</a></li>
          <li><a href="#mylist">My List</a></li>

          {user.role === 'admin' && (
             <li><a href="/admin" style={{ color: 'var(--mf-red)', fontWeight: 'bold' }}>Admin Panel</a></li>
          )}
        </ul>
      </nav>

      {/* --- SEARCH BAR WITH RECOMMENDATIONS --- */}
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

          {/* RECOMMENDATION LIST (Only shows if there are results) */}
          {recommendations.length > 0 && (
              <div className="search-results-list">
                  {recommendations.map((item) => (
                      <div 
                        key={item.id} 
                        className="search-item"
                        onClick={() => {
                            onResultClick(item); // Open the movie modal
                            setQuery('');        // Clear search
                            setRecommendations([]); // Close list
                        }}
                      >
                          <img src={item.image} alt={item.title} />
                          <span>{item.title}</span>
                      </div>
                  ))}
              </div>
          )}
      </div>
      
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
                <div onClick={() => { window.location.href='#mylist'; setProfileDropdown(false); }}>My List</div>
                <div onClick={() => { window.location.href='#history'; setProfileDropdown(false); }}>History</div>
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