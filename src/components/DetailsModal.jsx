import React, { useState, useEffect } from 'react';
import { FaPlay, FaPlus, FaTimes, FaArrowLeft } from 'react-icons/fa';

// 👇 ACCEPT NEW PROPS HERE: onAddToList, onPlay
const DetailsModal = ({ item, onClose, onAddToList, onPlay }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);

  // Initialize logic
  useEffect(() => {
    if (item) {
      if (item.category === 'movie') {
        setCurrentVideo(item.videoUrl);
      } else if (item.episodes && item.episodes.length > 0) {
        setCurrentVideo(item.episodes[0].url); // Default to Ep 1
      }
    }
  }, [item]);

  if (!item) return null;

  const handlePlayClick = (url) => {
    // 👇 1. SAVE TO HISTORY (DATABASE)
    if (onPlay) onPlay(); 
    
    // 2. START VIDEO
    if (url) setCurrentVideo(url);
    setIsPlaying(true);
  };

  const handleAddToList = () => {
      // 👇 SAVE TO WATCHLIST (DATABASE)
      if (onAddToList) {
          onAddToList();
          alert("Added to your Watchlist!");
      }
  };

  // --- VIEW 1: THE VIDEO PLAYER ---
  if (isPlaying) {
    return (
      <div className="modal" style={{ display: 'block', background: '#000' }}>
        {/* Back Button for Player */}
        <button 
            onClick={() => setIsPlaying(false)}
            style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 3000, background: 'transparent', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer' }}
        >
            <FaArrowLeft />
        </button>

        <video 
            width="100%" 
            height="100%" 
            controls 
            autoPlay
            style={{ width: '100vw', height: '100vh', objectFit: 'contain' }}
        >
            <source src={currentVideo} type="video/mp4" />
            Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // --- VIEW 2: THE NETFLIX DETAILS MODAL ---
  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content" style={{ maxWidth: '850px', padding: 0, overflow: 'hidden', backgroundColor: '#181818' }}>
        
        <span className="close-app" onClick={onClose} style={{ top: '15px', right: '20px', zIndex: 10 }}>&times;</span>
        
        {/* HERO BANNER */}
        <div className="movie-details-banner" style={{ 
            backgroundImage: `url(${item.image})`, 
            height: '500px', 
            position: 'relative',
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            backgroundRepeat: 'no-repeat'
        }}>
            {/* Gradient Overlay */}
            <div style={{ 
                position: 'absolute', bottom: 0, left: 0, width: '100%', height: '150px', 
                background: 'linear-gradient(to top, #181818, transparent)' 
            }}></div>

            <div style={{ position: 'absolute', bottom: '40px', left: '40px' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '15px', textShadow: '2px 2px 4px #000' }}>{item.title}</h1>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    {/* PLAY BUTTON */}
                    <button 
                        className="btn" 
                        style={{ backgroundColor: '#fff', color: '#000', padding: '10px 30px', fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}
                        onClick={() => handlePlayClick(currentVideo)}
                    >
                        <FaPlay /> Play
                    </button>

                    {/* MY LIST BUTTON */}
                    <button 
                        className="btn" 
                        style={{ backgroundColor: 'rgba(109, 109, 110, 0.7)', color: '#fff', padding: '10px 30px', fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}
                        onClick={handleAddToList} 
                    >
                        <FaPlus /> My List
                    </button>
                </div>
            </div>
        </div>
        
        {/* INFO SECTION */}
        <div className="movie-details-info" style={{ padding: '40px', display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
            
            {/* Left Side: Description */}
            <div style={{ flex: 2, minWidth: '300px' }}>
                <div style={{ marginBottom: '20px', color: '#46d369', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {item.rating * 10}% Match <span style={{ color: '#aaa', marginLeft: '10px', fontWeight: 'normal' }}>2023</span>
                </div>
                <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#fff' }}>{item.description}</p>
            </div>

            {/* Right Side: Meta */}
            <div style={{ flex: 1, color: '#777', fontSize: '0.9rem' }}>
                <p><span style={{ color: '#777' }}>Cast:</span> Example Actor, Example Actress</p>
                <p><span style={{ color: '#777' }}>Genres:</span> {item.category === 'movie' ? 'Sci-Fi, Action' : 'Drama, Thriller'}</p>
            </div>
        </div>

        {/* EPISODES SECTION (Only for Series/Anime) */}
        {item.episodes && item.episodes.length > 0 && (
            <div style={{ padding: '0 40px 40px 40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #404040', paddingBottom: '10px', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Episodes</h3>
                    <span style={{ fontSize: '1rem', color: '#aaa' }}>Season 1</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {item.episodes.map((ep, index) => (
                        <div 
                            key={index} 
                            onClick={() => handlePlayClick(ep.url)}
                            style={{ 
                                display: 'flex', alignItems: 'center', padding: '15px', 
                                backgroundColor: '#333', borderRadius: '5px', cursor: 'pointer', transition: '0.2s' 
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#444'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#333'}
                        >
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#aaa', marginRight: '20px' }}>{index + 1}</span>
                            
                            {/* Thumbnail Placeholder */}
                            <div style={{ width: '120px', height: '70px', background: '#000', marginRight: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                                <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} alt="ep" />
                                <FaPlay style={{ position: 'absolute', color: '#fff' }} />
                            </div>

                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '5px' }}>{ep.title}</h4>
                                <p style={{ fontSize: '0.9rem', color: '#aaa' }}>{ep.description || "Episode description placeholder."}</p>
                            </div>
                            <span style={{ color: '#fff', fontSize: '0.9rem' }}>{ep.duration}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default DetailsModal;