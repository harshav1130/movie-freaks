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
      <h2 style={{ textTransform: 'capitalize' }}>{title}</h2>
      <div className="slider-wrapper">
        <div className="grid-container" ref={rowRef}>
          
          {loading ? (
              // Skeleton Loading
              [...Array(6)].map((_, i) => <div key={i} className="skeleton-card"></div>)
          ) : (
              data.map((item, index) => (
                <div key={index} className="card" style={{ position: 'relative' }}>
                  
                  {/* Remove Button (Visible for MyList & History) */}
                  {(type === 'MyList' || type === 'History') && (
                      <button 
                        className="remove-btn"
                        onClick={(e) => {
                            e.stopPropagation(); 
                            onRemove(item);
                        }}
                        title="Remove from list"
                      >
                        <FaTimesCircle />
                      </button>
                  )}

                  <div onClick={() => onCardClick(item, type)}>
                      <div className="card-image">
                        {/* Handle missing images safely */}
                        <img 
                            src={item.image || "https://via.placeholder.com/300x450?text=No+Image"} 
                            alt={item.title} 
                            loading="lazy" // Performance boost
                        />
                      </div>
                      <div className="card-info">
                        <h3>{item.title}</h3>
                        <div className="meta" style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'#aaa' }}>
                            {/* Show Rating & Year */}
                            <span>⭐ {item.rating || 'N/A'}</span>
                            <span>{item.year || ''}</span>
                        </div>
                      </div>
                  </div>

                </div>
              ))
          )}
          
        </div>
        
        {/* Navigation Arrows (Hidden on mobile via CSS) */}
        <button className="slide-button left" onClick={() => scroll(-1)}><FaChevronLeft /></button>
        <button className="slide-button right" onClick={() => scroll(1)}><FaChevronRight /></button>
      </div>
    </section>
  );
};

export default ContentRow;