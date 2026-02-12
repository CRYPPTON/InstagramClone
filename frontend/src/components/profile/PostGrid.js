import React from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../../services/api';

const PostGrid = ({ posts }) => {
  if (!posts || posts.length === 0) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>No posts to display.</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }}>
      {posts.map(post => {
        const firstMedia = post.media && post.media[0];
        const postId = post.post_id || post.id; // Use whichever ID is available
        return (
          <Link key={postId} to={`/post/${postId}`}>
            {firstMedia && (
              <>
                {firstMedia.media_type === 'video' ? (
                  <video
                    src={getImageUrl(firstMedia.media_url)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    autoPlay
                    muted
                    loop
                  />
                ) : (
                  <img
                    src={getImageUrl(firstMedia.media_url)}
                    alt={post.caption}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default PostGrid;
