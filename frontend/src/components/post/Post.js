import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from 'react-bootstrap';
import PostHeader from './PostHeader';
import PostActions from './PostActions';
import PostComments from './PostComments';
import Carousel from '../common/Carousel'; // Import Carousel
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import api from '../../services/api'; // Import api
import ConfirmationModal from '../common/ConfirmationModal';

const Post = ({ post, onPostDeleted, onPostUpdated }) => {
  const { user: authUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState(post.caption);
  const [currentMedia, setCurrentMedia] = useState(post.media);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);

  const isOwner = authUser && authUser.id === post.user_id;

  const handleDeletePost = () => {
    setConfirmationAction(() => async () => {
        try {
            await api.deletePost(post.post_id);
            if (onPostDeleted) onPostDeleted(post.post_id);
          } catch (err) {
            setError(err.message || 'Failed to delete post.');
          }
    });
    setShowConfirmation(true);
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

  const handleDeleteMedia = (mediaId) => {
    setConfirmationAction(() => async () => {
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
    });
    setShowConfirmation(true);
  };

  const confirmAction = () => {
    if (confirmationAction) {
      confirmationAction();
    }
    setShowConfirmation(false);
    setConfirmationAction(null);
  };

  const cancelAction = () => {
    setShowConfirmation(false);
    setConfirmationAction(null);
  };


  return (
    <Card className="mb-4">
      <Card.Header>
        <PostHeader username={post.username} avatar={post.profile_picture_url} />
        {isOwner && (
        <div className="mt-2 text-end">
          <Button variant="light" size="sm" onClick={() => setIsEditing(!isEditing)} className="me-2">
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
          <Button variant="danger" size="sm" onClick={handleDeletePost}>Delete</Button>
        </div>
      )}
      </Card.Header>
      <Carousel media={currentMedia} onDeleteMedia={isOwner && currentMedia.length > 1 ? handleDeleteMedia : null} />
      <Card.Body>
        <PostActions postId={post.post_id} initialLikeCount={post.like_count} onLikeUpdate={handleLikeUpdate} />
        <Card.Text>
          <strong>{post.like_count} likes</strong>
        </Card.Text>
        {isEditing ? (
          <div>
            <textarea
              className="form-control"
              value={editedCaption}
              onChange={(e) => setEditedCaption(e.target.value)}
              rows="2"
            ></textarea>
            <Button variant="primary" size="sm" className="mt-2" onClick={handleUpdateCaption}>Save</Button>
          </div>
        ) : (
          <p><strong><Link to={`/profile/${post.username}`}>{post.username}</Link></strong> {post.caption}</p>
        )}
        {error && <p className="text-danger mt-2">{error}</p>}
      </Card.Body>
      <Card.Footer>
        <PostComments postId={post.post_id} ownerId={post.user_id} />
      </Card.Footer>
      {showConfirmation && (
        <ConfirmationModal
          message="Are you sure you want to proceed?"
          onConfirm={confirmAction}
          onCancel={cancelAction}
        />
      )}
    </Card>
  );
};

export default Post;
