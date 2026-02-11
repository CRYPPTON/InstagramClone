import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Input from '../common/Input';
import Button from '../common/Button';

const PostComments = ({ postId, ownerId }) => {
  const { user: authUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentContent, setEditedCommentContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const fetchedComments = await api.getPostComments(postId);
      setComments(fetchedComments);
    } catch (err) {
      setError(err.message || 'Failed to fetch comments.');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setError('');
    try {
      await api.addComment(postId, newComment);
      setNewComment('');
      fetchComments(); // Refresh comments
    } catch (err) {
      setError(err.message || 'Failed to add comment.');
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditedCommentContent(comment.content);
  };

  const handleUpdateComment = async (commentId) => {
    if (!editedCommentContent.trim()) return;
    setError('');
    try {
      await api.updateComment(postId, commentId, editedCommentContent);
      setEditingCommentId(null);
      setEditedCommentContent('');
      fetchComments(); // Refresh comments
    } catch (err) {
      setError(err.message || 'Failed to update comment.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      setError('');
      try {
        await api.deleteComment(postId, commentId);
        fetchComments(); // Refresh comments
      } catch (err) {
        setError(err.message || 'Failed to delete comment.');
      }
    }
  };

  if (loading) {
    return <div>Loading comments...</div>;
  }

  return (
    <div style={{ padding: '10px' }}>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {comments.length === 0 ? (
        <p>No comments yet.</p>
      ) : (
        comments.map((comment) => (
          <div key={comment.id} style={{ marginBottom: '10px' }}>
            <Link to={`/profile/${comment.username}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}>
              {comment.username}
            </Link>
            {editingCommentId === comment.id ? (
              <div>
                <Input
                  type="textarea"
                  value={editedCommentContent}
                  onChange={(e) => setEditedCommentContent(e.target.value)}
                  placeholder="Edit your comment..."
                />
                <Button onClick={() => handleUpdateComment(comment.id)} style={{ marginRight: '5px' }}>Save</Button>
                <Button onClick={() => setEditingCommentId(null)}>Cancel</Button>
              </div>
            ) : (
              <span> {comment.content}</span>
            )}
            {authUser && authUser.id === comment.user_id && !editingCommentId && (
              <span style={{ marginLeft: '10px' }}>
                <Button onClick={() => handleEditComment(comment)} size="small">Edit</Button>
                <Button onClick={() => handleDeleteComment(comment.id)} size="small" variant="danger" style={{ marginLeft: '5px' }}>Delete</Button>
              </span>
            )}
          </div>
        ))
      )}

      {authUser && (
        <form onSubmit={handleAddComment} style={{ marginTop: '20px' }}>
          <Input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
          />
          <Button type="submit" style={{ marginTop: '5px' }}>Post Comment</Button>
        </form>
      )}
    </div>
  );
};

export default PostComments;
