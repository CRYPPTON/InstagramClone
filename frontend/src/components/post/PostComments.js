import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Input from '../common/Input';
import Button from '../common/Button';

const COMMENT_LENGTH_LIMIT = 100;

// Sub-component for rendering a single comment with truncation logic
const Comment = ({ comment, authUser, onEdit, onDelete, isEditing, editedContent, onContentChange, onSave, onCancelEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const canManage = authUser && authUser.id === comment.user_id;

  const isLongComment = comment.content.length > COMMENT_LENGTH_LIMIT;
  
  const displayedContent = isExpanded ? comment.content : `${comment.content.substring(0, COMMENT_LENGTH_LIMIT)}${isLongComment ? '...' : ''}`;

  if (isEditing) {
    return (
      <div>
        <Input
          type="textarea"
          value={editedContent}
          onChange={onContentChange}
          placeholder="Edit your comment..."
        />
        <Button onClick={() => onSave(comment.id)} style={{ marginRight: '5px' }}>Save</Button>
        <Button onClick={onCancelEdit}>Cancel</Button>
      </div>
    );
  }
  
  return (
    <div style={{ marginBottom: '5px', wordBreak: 'break-word' }}>
      <Link to={`/profile/${comment.username}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}>
        {comment.username}
      </Link>
      <span> {displayedContent}</span>
      {isLongComment && !isExpanded && (
        <button onClick={() => setIsExpanded(true)} style={{ all: 'unset', color: 'grey', cursor: 'pointer', marginLeft: '5px', fontWeight: 'bold' }}>
          more
        </button>
      )}
      {canManage && (
        <span style={{ marginLeft: '10px' }}>
          <Button onClick={() => onEdit(comment)} size="small">Edit</Button>
          <Button onClick={() => onDelete(comment.id)} size="small" variant="danger" style={{ marginLeft: '5px' }}>Delete</Button>
        </span>
      )}
    </div>
  );
};


const PostComments = ({ postId, ownerId }) => {
  const { user: authUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentContent, setEditedCommentContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(2);

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

  const showAllComments = () => {
    setVisibleCommentsCount(comments.length);
  };
  
  const visibleComments = comments.slice(0, visibleCommentsCount);
  const hasMoreComments = comments.length > visibleCommentsCount;

  if (loading) {
    return <div style={{padding: '10px'}}>Loading comments...</div>;
  }

  return (
    <div style={{ padding: '10px' }}>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {comments.length === 0 ? (
        <p>No comments yet.</p>
      ) : (
        <>
          {visibleComments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              authUser={authUser}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              isEditing={editingCommentId === comment.id}
              editedContent={editedCommentContent}
              onContentChange={(e) => setEditedCommentContent(e.target.value)}
              onSave={handleUpdateComment}
              onCancelEdit={() => setEditingCommentId(null)}
            />
          ))}
          {hasMoreComments && (
            <button onClick={showAllComments} style={{ all: 'unset', color: 'grey', cursor: 'pointer', marginTop: '10px' }}>
              View all {comments.length} comments
            </button>
          )}
        </>
      )}

      {authUser && (
        <form onSubmit={handleAddComment} style={{ marginTop: '20px', borderTop: '1px solid #efefef', paddingTop: '10px' }}>
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
