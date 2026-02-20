const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Check access: can viewerId see targetId's content?
router.get('/check-access', async (req, res) => {
  const { viewerId, targetId } = req.query;
  try {
    const user = await pool.query('SELECT is_private FROM users WHERE id = $1', [targetId]);
    if (user.rows.length === 0) return res.status(404).json({ msg: 'User not found' });

    const isBlocked = await pool.query(
      'SELECT 1 FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)',
      [viewerId, targetId]
    );
    if (isBlocked.rows.length > 0) return res.json({ canView: false, isBlocked: true });

    if (!user.rows[0].is_private || viewerId == targetId) return res.json({ canView: true });

    const isFollowing = await pool.query(
      "SELECT 1 FROM followers WHERE follower_id = $1 AND followee_id = $2 AND status = 'accepted'",
      [viewerId, targetId]
    );
    res.json({ canView: isFollowing.rows.length > 0 });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get following list for timeline
router.get('/following-ids/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT followee_id FROM followers WHERE follower_id = $1 AND status = 'accepted'",
      [req.params.userId]
    );
    res.json(result.rows.map(r => r.followee_id));
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get user info for enrichment
router.get('/user-info/:id', async (req, res) => {
  try {
    const user = await pool.query('SELECT id, username, full_name, profile_picture_url FROM users WHERE id = $1', [req.params.id]);
    res.json(user.rows[0] || {});
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// NEW: Bulk user info for timeline optimization
router.post('/users-info', async (req, res) => {
    const { userIds } = req.body;
    try {
        const result = await pool.query(
            'SELECT id, username, full_name, profile_picture_url FROM users WHERE id = ANY($1::int[])',
            [userIds]
        );
        const userMap = {};
        result.rows.forEach(u => { userMap[u.id] = u; });
        res.json(userMap);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// NEW: Get IDs of users in a block relationship with a specific user (bidirectional)
router.get('/blocked-ids/:userId', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT blocked_id as id FROM blocks WHERE blocker_id = $1 UNION SELECT blocker_id as id FROM blocks WHERE blocked_id = $1',
            [req.params.userId]
        );
        res.json(result.rows.map(r => r.id));
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// NEW: Get IDs of users in a block relationship with multiple users (Bulk bidirectional)
router.post('/bulk-blocked-ids', async (req, res) => {
    const { userIds } = req.body;
    try {
        const result = await pool.query(
            `SELECT blocker_id, blocked_id FROM blocks WHERE blocker_id = ANY($1::int[]) 
             UNION 
             SELECT blocked_id as blocker_id, blocker_id as blocked_id FROM blocks WHERE blocked_id = ANY($1::int[])`,
            [userIds]
        );
        const blockMap = {};
        userIds.forEach(id => { blockMap[id] = []; });
        result.rows.forEach(r => { blockMap[r.blocker_id].push(r.blocked_id); });
        res.json(blockMap);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;
