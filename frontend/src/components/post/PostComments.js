import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Form, Button, InputGroup } from 'react-bootstrap';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const COMMENT_LENGTH_LIMIT = 100;

// Sub-component for rendering a single comment with truncation logic
const Comment = ({ comment, authUser, onEdit, onDelete, isEditing, editedContent, onContentChange, onSave, onCancelEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const canManage = authUser && authUser.id === comment.user_id;

  const isLongComment = comment.content.length > COMMENT_LENGTH_LIMIT;
  
  const displayedContent = isExpanded ? comment.content : `${comment.content.substring(0, COMMENT_LENGTH_LIMIT)}${isLongComment ? '...' : ''}`;

  if (isEditing) {
    return (
      <div className="mb-2">
        <Form.Control
          as="textarea"
          value={editedContent}
          onChange={onContentChange}
          placeholder="Edit your comment..."
          rows={2}
        />
        <Button variant="primary" size="sm" className="mt-1" onClick={() => onSave(comment.id)}>Save</Button>
        <Button variant="secondary" size="sm" className="mt-1 ms-1" onClick={onCancelEdit}>Cancel</Button>
      </div>
    );
  }
  
  return (
    <div className="mb-1">
      <Link to={`/profile/${comment.username}`} className="fw-bold text-dark text-decoration-none">
        {comment.username}
      </Link>
      <span className="ms-1">{displayedContent}</span>
      {isLongComment && !isExpanded && (
        <button onClick={() => setIsExpanded(true)} className="btn btn-link btn-sm p-0 ms-1 text-muted">
          more
        </button>
      )}
      {canManage && (
        <span className="ms-2">
          <Button variant="light" size="sm" onClick={() => onEdit(comment)}>Edit</Button>
          <Button variant="danger" size="sm" className="ms-1" onClick={() => onDelete(comment.id)}>Delete</Button>
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
    return <div className="p-2">Loading comments...</div>;
  }

  return (
    <div className="p-2">
      {error && <p className="text-danger">{error}</p>}
      
      {comments.length === 0 ? (
        <p className="text-muted">No comments yet.</p>
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
            <button onClick={showAllComments} className="btn btn-link btn-sm p-0 text-muted">
              View all {comments.length} comments
            </button>
          )}
        </>
      )}

      {authUser && (
        <Form onSubmit={handleAddComment} className="mt-3 border-top pt-2">
          <InputGroup>
            <Form.Control
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button variant="outline-primary" type="submit">
              Post
            </Button>
          </InputGroup>
        </Form>
      )}
    </div>
  );
};

export default PostComments;
