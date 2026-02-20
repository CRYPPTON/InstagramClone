const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Internal: Get posts for a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, user_id, caption, created_at FROM posts 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [req.params.userId]
        );

        const posts = await Promise.all(result.rows.map(async (post) => {
            const media = await pool.query('SELECT * FROM media WHERE post_id = $1 ORDER BY order_index ASC', [post.id]);
            const interactRes = await axios.get(`${process.env.INTERACTION_SERVICE_URL}/internal/counts/${post.id}`);
            
            return { 
                ...post, 
                post_id: post.id,
                media: media.rows,
                like_count: interactRes.data.likeCount
            };
        }));

        res.json(posts);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Internal: Get basic post info for other services
router.get('/posts/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, user_id FROM posts WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ msg: 'Post not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Internal: Get basic info for multiple posts
router.post('/bulk-posts', async (req, res) => {
    const { postIds } = req.body;
    try {
        const result = await pool.query('SELECT id, user_id FROM posts WHERE id = ANY($1::int[])', [postIds]);
        const postMap = {};
        result.rows.forEach(p => { postMap[p.id] = p; });
        res.json(postMap);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;
