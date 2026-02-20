const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const auth = require('../middleware/auth');
const axios = require('axios');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Internal: Get counts for a post (excluding blocked users)
router.get('/counts/:postId', async (req, res) => {
  try {
    const postRes = await axios.get(`${process.env.POST_SERVICE_URL}/internal/posts/${req.params.postId}`);
    const ownerId = postRes.data.user_id;

    const blockedRes = await axios.get(`${process.env.AUTH_SERVICE_URL}/internal/blocked-ids/${ownerId}`);
    const blockedIds = blockedRes.data || [];

    const likeCount = await pool.query(
      'SELECT COUNT(*) FROM likes WHERE post_id = $1 AND NOT (user_id = ANY($2::int[]))',
      [req.params.postId, blockedIds]
    );
    const commentCount = await pool.query(
      'SELECT COUNT(*) FROM comments WHERE post_id = $1 AND NOT (user_id = ANY($2::int[]))',
      [req.params.postId, blockedIds]
    );
    res.json({
      likeCount: parseInt(likeCount.rows[0].count),
      commentCount: parseInt(commentCount.rows[0].count)
    });
  } catch (err) {
    res.status(500).send('Error');
  }
});

// NEW: Bulk counts for timeline optimization (excluding blocked users)
router.post('/bulk-counts', async (req, res) => {
    const { postIds } = req.body;
    try {
        // 1. Get owners for these posts
        const postRes = await axios.post(`${process.env.POST_SERVICE_URL}/internal/bulk-posts`, { postIds });
        const postOwners = postRes.data; // { postId: { id, user_id } }
        const ownerIds = [...new Set(Object.values(postOwners).map(p => p.user_id))];

        // 2. Get blocked users for these owners
        const blockRes = await axios.post(`${process.env.AUTH_SERVICE_URL}/internal/bulk-blocked-ids`, { userIds: ownerIds });
        const blockMap = blockRes.data; // { ownerId: [blockedIds] }

        // 3. Get all likes and comments for these posts
        const likesRes = await pool.query(
            'SELECT post_id, user_id FROM likes WHERE post_id = ANY($1::int[])',
            [postIds]
        );
        const commentsRes = await pool.query(
            'SELECT post_id, user_id FROM comments WHERE post_id = ANY($1::int[])',
            [postIds]
        );

        const counts = {};
        postIds.forEach(id => { counts[id] = { likeCount: 0, commentCount: 0 }; });

        // Filter and count
        likesRes.rows.forEach(r => {
            const ownerId = postOwners[r.post_id]?.user_id;
            const blockedIds = blockMap[ownerId] || [];
            if (!blockedIds.includes(r.user_id)) {
                counts[r.post_id].likeCount++;
            }
        });

        commentsRes.rows.forEach(r => {
            const ownerId = postOwners[r.post_id]?.user_id;
            const blockedIds = blockMap[ownerId] || [];
            if (!blockedIds.includes(r.user_id)) {
                counts[r.post_id].commentCount++;
            }
        });

        res.json(counts);
    } catch (err) {
        console.error('Bulk counts error:', err.message);
        res.status(500).send('Error');
    }
});

// Internal: Cleanup after post deletion
router.delete('/cleanup/:postId', async (req, res) => {
    try {
        await pool.query('DELETE FROM likes WHERE post_id = $1', [req.params.postId]);
        await pool.query('DELETE FROM comments WHERE post_id = $1', [req.params.postId]);
        res.json({ msg: 'Cleanup done' });
    } catch (err) {
        res.status(500).send('Error');
    }
});

// Like Post
router.post('/posts/:id/like', auth, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  try {
    const postRes = await axios.get(`${process.env.POST_SERVICE_URL}/internal/posts/${postId}`);
    const postOwnerId = postRes.data.user_id;

    const accessRes = await axios.get(`${process.env.AUTH_SERVICE_URL}/internal/check-access`, {
      params: { viewerId: userId, targetId: postOwnerId }
    });
    if (!accessRes.data.canView) return res.status(403).json({ msg: 'Access denied' });

    const existing = await pool.query('SELECT 1 FROM likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
    if (existing.rows.length > 0) return res.status(400).json({ msg: 'Already liked' });

    await pool.query('INSERT INTO likes (post_id, user_id) VALUES ($1, $2)', [postId, userId]);
    res.json({ msg: 'Liked' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Unlike Post
router.delete('/posts/:id/like', auth, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  try {
    await pool.query('DELETE FROM likes WHERE post_id = $1 AND user_id = $2 RETURNING *', [postId, userId]);
    res.json({ msg: 'Unliked' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Check Like Status
router.get('/posts/:id/like', auth, async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id;
    try {
        const result = await pool.query('SELECT 1 FROM likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
        res.json({ liked: result.rows.length > 0 });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Get Comments (excluding blocked users)
router.get('/posts/:id/comments', async (req, res) => {
    try {
        const postId = req.params.id;

        // Get post owner and their blocked users
        const postRes = await axios.get(`${process.env.POST_SERVICE_URL}/internal/posts/${postId}`);
        const ownerId = postRes.data.user_id;

        const blockedRes = await axios.get(`${process.env.AUTH_SERVICE_URL}/internal/blocked-ids/${ownerId}`);
        const blockedIds = blockedRes.data || [];

        const comments = await pool.query(
            `SELECT id, user_id, content, created_at FROM comments 
             WHERE post_id = $1 AND NOT (user_id = ANY($2::int[]))
             ORDER BY created_at DESC`, 
            [postId, blockedIds]
        );
        const enriched = await Promise.all(comments.rows.map(async (c) => {
            const userRes = await axios.get(`${process.env.AUTH_SERVICE_URL}/internal/user-info/${c.user_id}`);
            return { ...c, username: userRes.data.username };
        }));
        res.json(enriched);
    } catch (err) {
        console.error('Comments error:', err.message);
        res.status(500).send('Server error');
    }
});

// Add Comment
router.post('/posts/:id/comment', auth, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  const { content } = req.body;
  try {
    const postRes = await axios.get(`${process.env.POST_SERVICE_URL}/internal/posts/${postId}`);
    const postOwnerId = postRes.data.user_id;

    const accessRes = await axios.get(`${process.env.AUTH_SERVICE_URL}/internal/check-access`, {
      params: { viewerId: userId, targetId: postOwnerId }
    });
    if (!accessRes.data.canView) return res.status(403).json({ msg: 'Access denied' });

    const result = await pool.query(
      'INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [postId, userId, content]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Update Comment
router.put('/posts/:postId/comments/:commentId', auth, async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;
  const { content } = req.body;
  try {
    const comment = await pool.query('SELECT user_id FROM comments WHERE id = $1', [commentId]);
    if (comment.rows.length === 0) return res.status(404).json({ msg: 'Comment not found' });
    if (comment.rows[0].user_id !== userId) return res.status(403).json({ msg: 'Unauthorized' });

    const result = await pool.query(
      'UPDATE comments SET content = $1 WHERE id = $2 RETURNING *',
      [content, commentId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Delete Comment
router.delete('/posts/:postId/comments/:commentId', auth, async (req, res) => {
  const { commentId, postId } = req.params;
  const userId = req.user.id;
  try {
    const comment = await pool.query('SELECT user_id FROM comments WHERE id = $1', [commentId]);
    if (comment.rows.length === 0) return res.status(404).json({ msg: 'Comment not found' });

    // Allow comment owner OR post owner to delete
    const postRes = await axios.get(`${process.env.POST_SERVICE_URL}/internal/posts/${postId}`);
    const postOwnerId = postRes.data.user_id;

    if (comment.rows[0].user_id !== userId && postOwnerId !== userId) {
        return res.status(403).json({ msg: 'Unauthorized' });
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);
    res.json({ msg: 'Comment deleted' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
