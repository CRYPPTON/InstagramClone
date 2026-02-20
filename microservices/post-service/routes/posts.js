const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `media-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
}).array('media', 20);

// OPTIMIZED Timeline: Using bulk requests to avoid 504 Timeout
router.get('/timeline', auth, async (req, res) => {
  const userId = req.user.id;
  try {
    const authRes = await axios.get(`${process.env.AUTH_SERVICE_URL}/internal/following-ids/${userId}`);
    const followingIds = authRes.data || [];
    followingIds.push(userId);

    const result = await pool.query(
      `SELECT id, user_id, caption, created_at FROM posts 
       WHERE user_id = ANY($1::int[])
       ORDER BY created_at DESC LIMIT 50`,
      [followingIds]
    );

    if (result.rows.length === 0) return res.json([]);

    const postIds = result.rows.map(p => p.id);
    const userIds = [...new Set(result.rows.map(p => p.user_id))];

    // Bulk fetch user info and interaction counts
    const [usersRes, countsRes] = await Promise.all([
        axios.post(`${process.env.AUTH_SERVICE_URL}/internal/users-info`, { userIds }),
        axios.post(`${process.env.INTERACTION_SERVICE_URL}/internal/bulk-counts`, { postIds })
    ]);

    const userMap = usersRes.data;
    const countMap = countsRes.data;

    const posts = await Promise.all(result.rows.map(async (post) => {
        const media = await pool.query('SELECT * FROM media WHERE post_id = $1 ORDER BY order_index ASC', [post.id]);
        const user = userMap[post.user_id] || {};
        const stats = countMap[post.id] || { likeCount: 0, commentCount: 0 };

        return { 
          ...post, 
          post_id: post.id,
          media: media.rows, 
          username: user.username,
          full_name: user.full_name,
          profile_picture_url: user.profile_picture_url,
          like_count: stats.likeCount,
          comment_count: stats.commentCount
        };
    }));

    res.json(posts);
  } catch (err) {
    console.error('Timeline error:', err.message);
    res.status(500).send('Server error');
  }
});

// ... rest of routes (Get single, Create, Delete) ...
// (I will keep them but focus on timeline optimization for now)

router.get('/:id', optionalAuth, async (req, res) => {
  const postId = req.params.id;
  const viewerId = req.user ? req.user.id : null;
  try {
    const postRes = await pool.query('SELECT * FROM posts WHERE id = $1', [postId]);
    if (postRes.rows.length === 0) return res.status(404).json({ msg: 'Post not found' });
    const post = postRes.rows[0];

    const accessRes = await axios.get(`${process.env.AUTH_SERVICE_URL}/internal/check-access`, {
      params: { viewerId, targetId: post.user_id }
    });
    if (!accessRes.data.canView) return res.status(403).json({ msg: 'Private account' });

    const media = await pool.query('SELECT * FROM media WHERE post_id = $1 ORDER BY order_index ASC', [postId]);
    const userRes = await axios.get(`${process.env.AUTH_SERVICE_URL}/internal/user-info/${post.user_id}`);
    const interactRes = await axios.get(`${process.env.INTERACTION_SERVICE_URL}/internal/counts/${postId}`);

    res.json({
      ...post,
      post_id: post.id,
      media: media.rows,
      username: userRes.data.username,
      full_name: userRes.data.full_name,
      profile_picture_url: userRes.data.profile_picture_url,
      like_count: interactRes.data.likeCount,
      comment_count: interactRes.data.commentCount
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.post('/', auth, (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ msg: err });
    const { caption } = req.body;
    const userId = req.user.id;
    try {
      const newPost = await pool.query('INSERT INTO posts (user_id, caption) VALUES ($1, $2) RETURNING id', [userId, caption]);
      const postId = newPost.rows[0].id;
      const mediaPromises = req.files.map((file, index) => {
        const mediaUrl = `/uploads/${file.filename}`;
        const mediaType = file.mimetype.startsWith('image') ? 'image' : 'video';
        return pool.query('INSERT INTO media (post_id, media_url, media_type, order_index) VALUES ($1, $2, $3, $4)', [postId, mediaUrl, mediaType, index]);
      });
      await Promise.all(mediaPromises);
      res.json({ msg: 'Post created' });
    } catch (err) {
      res.status(500).send('Server error');
    }
  });
});

router.put('/:id', auth, async (req, res) => {
  const { caption } = req.body;
  const userId = req.user.id;
  try {
    const post = await pool.query('SELECT user_id FROM posts WHERE id = $1', [req.params.id]);
    if (post.rows.length === 0) return res.status(404).json({ msg: 'Post not found' });
    if (post.rows[0].user_id !== userId) return res.status(403).json({ msg: 'Unauthorized' });

    const result = await pool.query(
      'UPDATE posts SET caption = $1 WHERE id = $2 RETURNING *',
      [caption, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.delete('/:id', auth, async (req, res) => {
  const userId = req.user.id;
  try {
    const post = await pool.query('SELECT user_id FROM posts WHERE id = $1', [req.params.id]);
    if (post.rows.length === 0) return res.status(404).json({ msg: 'Post not found' });
    if (post.rows[0].user_id !== userId) return res.status(403).json({ msg: 'Unauthorized' });
    await pool.query('DELETE FROM media WHERE post_id = $1', [req.params.id]);
    await pool.query('DELETE FROM posts WHERE id = $1', [req.params.id]);
    await axios.delete(`${process.env.INTERACTION_SERVICE_URL}/internal/cleanup/${req.params.id}`);
    res.json({ msg: 'Post deleted' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Delete Comment (I kept this as a reference but it seems I'm at the end of the file)
router.delete('/:id/media/:mediaId', auth, async (req, res) => {
  const { id, mediaId } = req.params;
  const userId = req.user.id;
  try {
    const post = await pool.query('SELECT user_id FROM posts WHERE id = $1', [id]);
    if (post.rows.length === 0) return res.status(404).json({ msg: 'Post not found' });
    if (post.rows[0].user_id !== userId) return res.status(403).json({ msg: 'Unauthorized' });

    const media = await pool.query('SELECT media_url FROM media WHERE id = $1 AND post_id = $2', [mediaId, id]);
    if (media.rows.length === 0) return res.status(404).json({ msg: 'Media not found' });

    // Delete file
    const filePath = path.join(__dirname, media.rows[0].media_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await pool.query('DELETE FROM media WHERE id = $1', [mediaId]);
    res.json({ msg: 'Media deleted' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
