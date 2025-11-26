import React, { useState, useEffect } from 'react';
import { FaPlay, FaInfoCircle, FaChevronRight, FaChevronLeft } from 'react-icons/fa';

const HeroCarousel = ({ onPlay, onDetails }) => {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // 👇 FETCH SLIDES FROM DB
  useEffect(() => {
    fetch('http://localhost:3001/api/carousel')
      .then(res => res.json())
      .then(data => {
          if (data.length > 0) setSlides(data);
      })
      .catch(err => console.error("Carousel Error:", err));
  }, []);

  useEffect(() => {
    if (isPaused || slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  if (slides.length === 0) return null; // Don't render if empty

  return (
    <section className="hero" id="home" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
      <div className="carousel">
        {slides.map((slide, index) => (
          <div key={slide.id} className={`slide ${index === current ? 'active' : ''}`} style={{ backgroundImage: `url(${slide.image})`, backgroundSize: 'cover', backgroundPosition: 'center top', backgroundRepeat: 'no-repeat' }}>
             <div className="hero-gradient"></div>
             <div className="hero-content-app" style={{ zIndex: 10 }}>
               <span className={`tag ${index === current ? 'animate-text' : ''}`}>{slide.tag || 'Featured'}</span>
               <h1 className={index === current ? 'animate-text' : ''} style={{ fontSize: '3.5rem', textShadow: '2px 2px 4px black' }}>{slide.title}</h1>
               <p className={index === current ? 'animate-text-delay' : ''} style={{ maxWidth: '600px', textShadow: '1px 1px 2px black' }}>{slide.description}</p>
               <div className={`actions ${index === current ? 'animate-text-delay' : ''}`}>
                 <button className="btn btn-primary" onClick={() => onPlay(slide)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaPlay /> Play</button>
                 <button className="btn btn-secondary" onClick={() => onDetails(slide)} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(109, 109, 110, 0.7)' }}><FaInfoCircle /> More Info</button>
               </div>
             </div>
          </div>
        ))}
      </div>
      {/* Dots/Arrows logic same as before... */}
    </section>
  );
};

export default HeroCarousel;