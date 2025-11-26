import React, { useState, useEffect } from 'react';
import { FaPlay, FaInfoCircle, FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { API_URL } from '../config';

const HeroCarousel = ({ onPlay, onDetails }) => {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch Slides
  useEffect(() => {
    fetch(`${API_URL}/api/carousel`)
      .then(res => res.json())
      .then(data => {
          if (Array.isArray(data) && data.length > 0) {
              setSlides(data);
          } else {
              setSlides([]);
          }
          setLoading(false);
      })
      .catch(err => {
          console.error("Carousel Error:", err);
          setLoading(false);
      });
  }, []);

  // Auto-Slide Logic
  useEffect(() => {
    if (isPaused || slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const nextSlide = () => setCurrent((current + 1) % slides.length);
  const prevSlide = () => setCurrent(current === 0 ? slides.length - 1 : current - 1);

  // --- LOADING STATE (Improved Skeleton) ---
  if (loading) {
      return (
        <section className="hero" style={{ background: '#141414', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #1f1f1f 25%, #2a2a2a 50%, #1f1f1f 75%)', backgroundSize: '200% 100%', animation: 'pulse 1.5s infinite' }}></div>
        </section>
      );
  }

  // --- EMPTY STATE ---
  if (slides.length === 0) return null;

  return (
    <section 
        className="hero" 
        id="home"
        onMouseEnter={() => setIsPaused(true)} 
        onMouseLeave={() => setIsPaused(false)} 
    >
      <div className="carousel">
        {slides.map((slide, index) => (
          <div 
            key={slide.id || index} 
            className={`slide ${index === current ? 'active' : ''}`}
            style={{ 
                backgroundImage: `url(${slide.image})`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center top', 
                backgroundRepeat: 'no-repeat' 
            }} 
          >
             {/* Ken Burns Layer */}
             <div className={index === current ? "ken-burns" : ""} style={{
                 position: 'absolute', top:0, left:0, width:'100%', height:'100%',
                 backgroundImage: `url(${slide.image})`,
                 backgroundSize: 'cover',
                 backgroundPosition: 'center top',
                 zIndex: 0
             }}></div>

            <div className="hero-gradient"></div>

            <div className="hero-content-app" style={{ zIndex: 10 }}>
              <span className={`tag ${index === current ? 'animate-text' : ''}`}>{slide.tag || 'Featured'}</span>
              
              <h1 className={index === current ? 'animate-text' : ''} style={{ fontSize: '3.5rem', textShadow: '2px 2px 4px black', lineHeight: 1.1 }}>
                  {slide.title}
              </h1>
              
              <p className={index === current ? 'animate-text-delay' : ''} style={{ maxWidth: '600px', textShadow: '1px 1px 2px black' }}>
                  {slide.description}
              </p>
              
              <div className={`actions ${index === current ? 'animate-text-delay' : ''}`}>
                <button 
                    className="btn btn-primary" 
                    onClick={() => onPlay(slide)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <FaPlay /> Play
                </button>
                
                <button 
                    className="btn btn-secondary" 
                    onClick={() => onDetails(slide)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(109, 109, 110, 0.7)' }}
                >
                    <FaInfoCircle /> More Info
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Manual Navigation Arrows */}
      <div className="carousel-arrow left" onClick={prevSlide} style={{ position: 'absolute', top: '50%', left: '20px', zIndex: 20, cursor: 'pointer', fontSize: '2rem', color: 'white', opacity: 0.7 }}>
          <FaChevronLeft />
      </div>
      <div className="carousel-arrow right" onClick={nextSlide} style={{ position: 'absolute', top: '50%', right: '20px', zIndex: 20, cursor: 'pointer', fontSize: '2rem', color: 'white', opacity: 0.7 }}>
          <FaChevronRight />
      </div>

      <div className="carousel-dots">
        {slides.map((_, index) => (
          <span 
            key={index} 
            className={`dot ${index === current ? 'active' : ''}`}
            onClick={() => setCurrent(index)}
          ></span>
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;