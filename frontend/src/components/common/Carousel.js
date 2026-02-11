import React, { useState } from 'react';
import { getImageUrl } from '../../services/api';

const Carousel = ({ media, onDeleteMedia = null }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!media || media.length === 0) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>No media to display</div>;
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % media.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + media.length) % media.length);
  };

  const currentMedia = media[currentIndex];
  const mediaUrl = getImageUrl(currentMedia.media_url);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
      {currentMedia.media_type === 'image' ? (
        <img src={mediaUrl} alt="post media" style={{ width: '100%', display: 'block' }} />
      ) : (
        <video controls src={mediaUrl} style={{ width: '100%', display: 'block' }} />
      )}

      {media.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            style={{
              position: 'absolute',
              top: '50%',
              left: '10px',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0,0,0,0.5)',
              color: 'white',
              border: 'none',
              padding: '10px',
              cursor: 'pointer',
              zIndex: 1,
            }}
          >
            &#10094;
          </button>
          <button
            onClick={goToNext}
            style={{
              position: 'absolute',
              top: '50%',
              right: '10px',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0,0,0,0.5)',
              color: 'white',
              border: 'none',
              padding: '10px',
              cursor: 'pointer',
              zIndex: 1,
            }}
          >
            &#10095;
          </button>
        </>
      )}

      {onDeleteMedia && (
        <button
          onClick={() => onDeleteMedia(currentMedia.id)}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: 'rgba(255,0,0,0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            cursor: 'pointer',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2em',
          }}
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default Carousel;