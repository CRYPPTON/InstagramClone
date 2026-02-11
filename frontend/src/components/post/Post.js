import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PostHeader from './PostHeader';
import PostActions from './PostActions';
import PostComments from './PostComments';
import Carousel from '../common/Carousel'; // Import Carousel
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import Button from '../common/Button'; // Import Button for edit/delete actions
import api from '../../services/api'; // Import api

const Post = ({ post, onPostDeleted, onPostUpdated }) => {
  const { user: authUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState(post.caption);
  const [currentMedia, setCurrentMedia] = useState(post.media);
  const [error, setError] = useState('');

  const isOwner = authUser && authUser.id === post.user_id;

  const handleDeletePost = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await api.deletePost(post.post_id);
        if (onPostDeleted) onPostDeleted(post.post_id);
      } catch (err) {
        setError(err.message || 'Failed to delete post.');
      }
    }
  };

  const handleUpdateCaption = async () => {
    try {
      await api.updatePost(post.post_id, editedCaption);
      setIsEditing(false);
      if (onPostUpdated) onPostUpdated(post.post_id, editedCaption, post.like_count);
    } catch (err) {
      setError(err.message || 'Failed to update caption.');
    }
  };

  const handleLikeUpdate = (newLikeCount) => {
    if (onPostUpdated) {
      onPostUpdated(post.post_id, post.caption, newLikeCount);
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    if (window.confirm('Are you sure you want to delete this media item?')) {
      try {
        await api.deleteMedia(post.post_id, mediaId);
        setCurrentMedia(currentMedia.filter(media => media.id !== mediaId));
        // Optionally, if no media left, delete the post or show a message
        if (currentMedia.length === 1) { // If only one item left and it was deleted
          if (onPostDeleted) onPostDeleted(post.post_id);
        }
      } catch (err) {
        setError(err.message || 'Failed to delete media item.');
      }
    }
  };


  return (
    <div style={{ border: '1px solid #dbdbdb', borderRadius: '3px', marginBottom: '20px', backgroundColor: 'white' }}>
      <Link to={`/profile/${post.username}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <PostHeader username={post.username} avatar={post.profile_picture_url} />
      </Link>

      {isOwner && (
        <div style={{ padding: '10px', textAlign: 'right' }}>
          <Button onClick={() => setIsEditing(!isEditing)} style={{ marginRight: '10px' }}>
            {isEditing ? 'Cancel Edit' : 'Edit Post'}
          </Button>
          <Button onClick={handleDeletePost} variant="danger">Delete Post</Button>
        </div>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <Carousel media={currentMedia} onDeleteMedia={isOwner && currentMedia.length > 1 ? handleDeleteMedia : null} />

      <PostActions postId={post.post_id} initialLikeCount={post.like_count} onLikeUpdate={handleLikeUpdate} />
      
      <div style={{ padding: '0 10px' }}>
        <p><strong>{post.like_count} likes</strong></p>
        {isEditing ? (
          <div>
            <textarea
              value={editedCaption}
              onChange={(e) => setEditedCaption(e.target.value)}
              placeholder="Edit caption..."
              rows="3"
              style={{
                border: '1px solid #dbdbdb',
                borderRadius: '3px',
                padding: '9px',
                backgroundColor: '#fafafa',
                width: '100%',
                marginBottom: '10px'
              }}
            ></textarea>
            <Button onClick={handleUpdateCaption}>Save Caption</Button>
          </div>
        ) : (
          <p><strong>{post.username}</strong> {post.caption}</p>
        )}
      </div>
      <PostComments postId={post.post_id} ownerId={post.user_id} />
    </div>
  );
};

export default Post;
