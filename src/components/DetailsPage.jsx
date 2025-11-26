import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaPlay, FaPlus, FaArrowLeft, FaTrash } from 'react-icons/fa';
import { API_URL } from '../config'; 

const DetailsPage = ({ onAddToList, onRemoveFromList, onPlay, myList }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const item = location.state?.item;
  const shouldAutoPlay = location.state?.autoPlay;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isInList, setIsInList] = useState(false);
  const [animateBtn, setAnimateBtn] = useState(false);
  const [selectedSeasonIndex, setSelectedSeasonIndex] = useState(0);
  const [episodesToDisplay, setEpisodesToDisplay] = useState([]);
  
  const fixUrl = (url) => {
      if (!url) return '';
      if (url.startsWith('http')) return url.replace('http://localhost:3001', API_URL);
      return url;
  };

  const [currentImage, setCurrentImage] = useState(fixUrl(item?.image));

  useEffect(() => {
    if (!item) {
        navigate('/');
    } else {
        if (myList) {
            const exists = myList.find(i => i.id === item.id);
            setIsInList(!!exists);
        }

        if (item.category === 'movie') {
            setCurrentVideo(fixUrl(item.videoUrl));
        } 
        else if (item.seasons && item.seasons.length > 0) {
            setEpisodesToDisplay(item.seasons[0].episodes || []);
            setCurrentImage(fixUrl(item.seasons[0].image || item.image));
            if (item.seasons[0].episodes.length > 0) {
                setCurrentVideo(fixUrl(item.seasons[0].episodes[0].url));
            }
        } 
        else if (item.episodes && item.episodes.length > 0) {
            setEpisodesToDisplay(item.episodes);
            setCurrentVideo(fixUrl(item.episodes[0].url));
        }

        if (shouldAutoPlay) setIsPlaying(true);
    }
  }, [item, navigate, shouldAutoPlay, myList]);

  const handleSeasonChange = (e) => {
      const index = parseInt(e.target.value);
      setSelectedSeasonIndex(index);
      if (item.seasons && item.seasons[index]) {
          setEpisodesToDisplay(item.seasons[index].episodes);
          setCurrentImage(fixUrl(item.seasons[index].image || item.image));
      }
  };

  if (!item) return null;

  const handlePlayClick = (url) => {
    if (onPlay) onPlay(item); 
    if (url) setCurrentVideo(fixUrl(url));
    setIsPlaying(true);
  };

  const handleListToggle = () => {
      setAnimateBtn(true);
      setTimeout(() => setAnimateBtn(false), 300);
      if (isInList) { onRemoveFromList(item); setIsInList(false); } 
      else { onAddToList(item); setIsInList(true); }
  };

  if (isPlaying) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'fixed', top: 0, left: 0, zIndex: 5000 }}>
        <button onClick={() => setIsPlaying(false)} style={{ position: 'absolute', top: '30px', left: '30px', zIndex: 5001, background: 'transparent', border: 'none', color: '#fff', fontSize: '2.5rem', cursor: 'pointer', filter: 'drop-shadow(0 0 5px #000)' }}><FaArrowLeft /></button>
        <video width="100%" height="100%" controls autoPlay style={{ objectFit: 'contain' }}>
            <source src={currentVideo} type="video/mp4" />
            Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  return (
    <div className="details-page" style={{ width: '100%', minHeight: '100vh', backgroundColor: '#141414', color: '#fff', position: 'relative', overflowX: 'hidden' }}>
      
      <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: '30px', left: '30px', zIndex: 100, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: '50px', height: '50px', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FaArrowLeft />
      </button>

      <div style={{ 
          height: '85vh', width: '100%', backgroundImage: `url(${currentImage})`, 
          backgroundColor: '#000', backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', position: 'relative' 
      }}>
          {/* CLEAN GRADIENT FADE (No Red) */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '400px', background: 'linear-gradient(to top, #141414 10%, transparent 100%)' }}></div>
          
          <div style={{ position: 'absolute', bottom: '100px', left: '5%', maxWidth: '700px', textShadow: '2px 2px 8px #000' }}>
              <h1 style={{ fontSize: '4rem', fontWeight: '800', marginBottom: '20px', lineHeight: 1.1, textShadow: '2px 2px 10px rgba(0,0,0,0.9)' }}>{item.title}</h1>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', fontSize: '1.1rem', color: '#46d369', fontWeight: 'bold' }}>
                <span>{item.rating * 10}% Match</span>
                <span style={{ color: '#fff', fontWeight: 'normal' }}>{item.year || '2024'}</span>
                <span style={{ border: '1px solid #fff', padding: '0 5px', color: '#fff', fontSize: '0.8rem' }}>HD</span>
              </div>

              <p style={{ fontSize: '1.2rem', lineHeight: '1.5', marginBottom: '30px', color: '#ddd', textShadow: '1px 1px 5px #000' }}>{item.description}</p>
              <p style={{ color: '#bbb', marginBottom: '20px', textShadow: '1px 1px 5px #000' }}><strong>Cast:</strong> {item.cast || 'Unavailable'}</p>

              <div style={{ display: 'flex', gap: '20px' }}>
                  <button onClick={() => handlePlayClick(currentVideo)} style={{ padding: '15px 40px', fontSize: '1.3rem', fontWeight: 'bold', borderRadius: '5px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff', color: '#000' }}><FaPlay /> Play</button>
                  <button onClick={handleListToggle} className={animateBtn ? 'btn-animate' : ''} style={{ padding: '15px 40px', fontSize: '1.3rem', fontWeight: 'bold', borderRadius: '5px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: isInList ? 'rgba(255, 0, 0, 0.8)' : 'rgba(109, 109, 110, 0.7)', color: '#fff', transition: 'background-color 0.3s ease' }}>{isInList ? <><FaTrash /> Remove</> : <><FaPlus /> My List</>}</button>
              </div>
          </div>
      </div>

      {episodesToDisplay.length > 0 && (
          <div style={{ padding: '0 5%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #404040', paddingBottom: '10px', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Episodes</h3>
                  {item.seasons && item.seasons.length > 0 && (
                      <div style={{ position: 'relative' }}>
                          <select value={selectedSeasonIndex} onChange={handleSeasonChange} style={{ background: '#222', color: '#fff', border: '1px solid #555', padding: '10px 15px', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer', outline: 'none' }}>
                              {item.seasons.map((s, idx) => <option key={idx} value={idx}>{s.name}</option>)}
                          </select>
                      </div>
                  )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '50px' }}>
                  {episodesToDisplay.map((ep, index) => (
                      <div key={index} onClick={() => handlePlayClick(ep.url)} style={{ display: 'flex', alignItems: 'center', padding: '20px', backgroundColor: '#222', borderRadius: '8px', cursor: 'pointer', border: '1px solid #333', transition: '0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#333'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#222'}>
                          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#888', width: '50px' }}>{index + 1}</span>
                          <div style={{ width: '150px', height: '85px', background: '#000', marginRight: '20px', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
                              <img src={fixUrl(item.image)} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} alt="thumb" />
                              <FaPlay style={{ position: 'absolute', top: '35%', left: '42%', color: '#fff' }} />
                          </div>
                          <div style={{ flex: 1 }}><h4 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>{ep.title}</h4><p style={{ color: '#aaa' }}>{ep.description || "Click to watch episode."}</p></div>
                          <span style={{ color: '#fff' }}>{ep.duration}</span>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

export default DetailsPage;