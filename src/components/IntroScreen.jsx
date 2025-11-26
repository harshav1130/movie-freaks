import React, { useEffect, useState } from 'react';
import '../App.css'; // Ensure CSS is imported

const IntroScreen = ({ onComplete }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Wait for animation, then fade out
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(onComplete, 1000); // Wait for CSS transition
    }, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!onComplete) return null;

  return (
    <div className={`intro-screen ${fading ? 'fade-out' : ''}`}>
      <div className="intro-logo">
        <span className="movie-text">MOVIE</span>
        <span className="netflix-like-n"></span>
        <span className="freaks-text">FREAKS</span>
      </div>
      <p className="intro-tagline">
        Unlimited movies, TV shows, and more.<br />
        Watch anywhere. Cancel anytime.
      </p>
    </div>
  );
};

export default IntroScreen;