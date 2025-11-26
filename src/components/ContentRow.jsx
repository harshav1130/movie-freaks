import React, { useRef } from 'react';
import { FaChevronLeft, FaChevronRight, FaTimesCircle } from 'react-icons/fa';

const ContentRow = ({ title, data, onCardClick, type, onRemove, loading, id }) => {
  const rowRef = useRef(null);

  const scroll = (direction) => {
    if (rowRef.current) {
      const { clientWidth, scrollLeft } = rowRef.current;
      const scrollTo = scrollLeft + direction * (clientWidth * 0.8);
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className="content-grid" id={id}>
      <h2>{title}</h2>
      <div className="slider-wrapper">
        <div className="grid-container" ref={rowRef}>
          
          {loading ? (
              [...Array(6)].map((_, i) => <div key={i} className="skeleton-card"></div>)
          ) : (
              data.map((item, index) => (
                <div key={index} className="card" style={{ position: 'relative' }}>
                  
                  {/* 👇 UPDATED LOGIC: Show X button for 'MyList' OR 'History' */}
                  {(type === 'MyList' || type === 'History') && (
                      <button 
                        className="remove-btn"
                        onClick={(e) => {
                            e.stopPropagation(); 
                            onRemove(item);
                        }}
                        title="Remove"
                      >
                        <FaTimesCircle />
                      </button>
                  )}

                  <div onClick={() => onCardClick(item, type)}>
                      <div className="card-image">
                        <img src={item.image} alt={item.title} />
                      </div>
                      <div className="card-info">
                        <h3>{item.title}</h3>
                        <p className="meta">⭐ {item.rating || 4.5} | {type}</p>
                      </div>
                  </div>

                </div>
              ))
          )}
          
        </div>
        <button className="slide-button left" onClick={() => scroll(-1)}><FaChevronLeft /></button>
        <button className="slide-button right" onClick={() => scroll(1)}><FaChevronRight /></button>
      </div>
    </section>
  );
};

export default ContentRow;