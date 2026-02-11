import React from 'react';
import Post from '../post/Post'; // Import the Post component

const PostGrid = ({ posts, onPostDeleted, onPostUpdated }) => {
  if (!posts || posts.length === 0) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>No posts to display.</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }}>
      {posts.map(post => (
        <Post
          key={post.post_id}
          post={post}
          onPostDeleted={onPostDeleted}
          onPostUpdated={onPostUpdated}
        />
      ))}
    </div>
  );
};

export default PostGrid;
