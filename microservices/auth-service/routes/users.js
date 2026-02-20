const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `profile-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

// Search Users
router.get('/search', auth, async (req, res) => {
  const { query } = req.query;
  const userId = req.user.id;
  try {
    const users = await pool.query(
      `SELECT id, username, full_name, profile_picture_url, is_private FROM users
       WHERE (username ILIKE $1 OR full_name ILIKE $1) AND id != $2
       AND NOT EXISTS (SELECT 1 FROM blocks WHERE (blocker_id = $2 AND blocked_id = users.id) OR (blocker_id = users.id AND blocked_id = $2))
       ORDER BY username ASC`,
      [`%${query}%`, userId]
    );
    res.json(users.rows);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Profile logic
router.get('/:username', optionalAuth, async (req, res) => {
  const { username } = req.params;
  const viewerId = req.user ? req.user.id : null;
  try {
    const userResult = await pool.query('SELECT id, username, full_name, bio, profile_picture_url, is_private FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) return res.status(404).json({ msg: 'User not found' });
    const targetUser = userResult.rows[0];

    // Block check
    if (viewerId) {
      const isBlocked = await pool.query('SELECT * FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)', [viewerId, targetUser.id]);
      if (isBlocked.rows.length > 0) return res.status(404).json({ msg: 'User not found' });
    }

    const followersResult = await pool.query('SELECT COUNT(*) FROM followers WHERE followee_id = $1 AND status = $2', [targetUser.id, 'accepted']);
    const followingResult = await pool.query('SELECT COUNT(*) FROM followers WHERE follower_id = $1 AND status = $2', [targetUser.id, 'accepted']);

    // Check if viewer can see posts
    let canViewPosts = !targetUser.is_private;
    if (viewerId) {
        const isOwner = viewerId === targetUser.id;
        const isFollowingRes = await pool.query('SELECT 1 FROM followers WHERE follower_id = $1 AND followee_id = $2 AND status = $3', [viewerId, targetUser.id, 'accepted']);
        if (isOwner || isFollowingRes.rows.length > 0) canViewPosts = true;
    }

    let posts = [];
    if (canViewPosts) {
        try {
            const postsRes = await axios.get(`${process.env.POST_SERVICE_URL}/internal/user/${targetUser.id}`);
            posts = postsRes.data;
        } catch (e) {
            console.error("Error fetching posts from Post Service:", e.message);
        }
    }

    res.json({
      ...targetUser,
      posts: posts,
      followerCount: parseInt(followersResult.rows[0].count),
      followingCount: parseInt(followingResult.rows[0].count)
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Update Profile
router.put('/:id', auth, upload.single('profile_picture'), async (req, res) => {
  const { full_name, bio } = req.body;
  const is_private = req.body.is_private === 'true';
  const userId = parseInt(req.params.id);
  const profile_picture = req.file;

  if (req.user.id !== userId) return res.status(403).json({ msg: 'Forbidden' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query('SELECT is_private, profile_picture_url FROM users WHERE id = $1', [userId]);
    const was_private = current.rows[0].is_private;

    let query = 'UPDATE users SET full_name = $1, bio = $2, is_private = $3';
    let params = [full_name, bio, is_private];

    if (profile_picture) {
      const url = `/uploads/${profile_picture.filename}`;
      query += ', profile_picture_url = $4 WHERE id = $5 RETURNING *';
      params.push(url, userId);
    } else {
      query += ' WHERE id = $4 RETURNING *';
      params.push(userId);
    }

    const result = await client.query(query, params);
    
    // Auto-accept if changed to public
    if (was_private && !is_private) {
      await client.query("UPDATE followers SET status = 'accepted' WHERE followee_id = $1 AND status = 'pending'", [userId]);
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).send('Server error');
  } finally {
    client.release();
  }
});

// Follow User
router.post('/:id/follow', auth, async (req, res) => {
  const followerId = req.user.id;
  const followeeId = parseInt(req.params.id);
  if (followerId === followeeId) return res.status(400).json({ msg: 'You cannot follow yourself' });

  try {
    const blockCheck = await pool.query('SELECT * FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)', [followerId, followeeId]);
    if (blockCheck.rows.length > 0) return res.status(403).json({ msg: 'Action forbidden due to a block.' });

    const followee = await pool.query('SELECT id, is_private FROM users WHERE id = $1', [followeeId]);
    if (followee.rows.length === 0) return res.status(404).json({ msg: 'User not found' });

    const existingFollow = await pool.query('SELECT * FROM followers WHERE follower_id = $1 AND followee_id = $2', [followerId, followeeId]);
    if (existingFollow.rows.length > 0) return res.status(400).json({ msg: 'Already following or pending' });

    const status = followee.rows[0].is_private ? 'pending' : 'accepted';
    await pool.query('INSERT INTO followers (follower_id, followee_id, status) VALUES ($1, $2, $3)', [followerId, followeeId, status]);
    res.json({ msg: `Follow request ${status}` });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Unfollow User
router.post('/:id/unfollow', auth, async (req, res) => {
  const followerId = req.user.id;
  const followeeId = parseInt(req.params.id);
  try {
    const result = await pool.query('DELETE FROM followers WHERE follower_id = $1 AND followee_id = $2 RETURNING *', [followerId, followeeId]);
    if (result.rows.length === 0) return res.status(400).json({ msg: 'Not following' });
    res.json({ msg: 'User unfollowed' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Accept Follow Request
router.put('/:userId/followers/:followerId/accept', auth, async (req, res) => {
  if (req.user.id !== parseInt(req.params.userId)) return res.status(403).json({ msg: 'Unauthorized' });
  try {
    const result = await pool.query("UPDATE followers SET status = 'accepted' WHERE followee_id = $1 AND follower_id = $2 AND status = 'pending' RETURNING *", [req.params.userId, req.params.followerId]);
    if (result.rows.length === 0) return res.status(404).json({ msg: 'Request not found' });
    res.json({ msg: 'Follow request accepted' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Reject Follow Request
router.put('/:userId/followers/:followerId/reject', auth, async (req, res) => {
  if (req.user.id !== parseInt(req.params.userId)) return res.status(403).json({ msg: 'Unauthorized' });
  try {
    const result = await pool.query("DELETE FROM followers WHERE followee_id = $1 AND follower_id = $2 AND status = 'pending' RETURNING *", [req.params.userId, req.params.followerId]);
    if (result.rows.length === 0) return res.status(404).json({ msg: 'Request not found' });
    res.json({ msg: 'Follow request rejected' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Block User
router.post('/:id/block', auth, async (req, res) => {
  const blockerId = req.user.id;
  const blockedId = parseInt(req.params.id);
  if (blockerId === blockedId) return res.status(400).json({ msg: 'Cannot block self' });
  try {
    await pool.query('BEGIN');
    const user = await pool.query('SELECT id FROM users WHERE id = $1', [blockedId]);
    if (user.rows.length === 0) throw new Error('User not found');
    await pool.query('INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2)', [blockerId, blockedId]);
    await pool.query('DELETE FROM followers WHERE (follower_id = $1 AND followee_id = $2) OR (follower_id = $2 AND followee_id = $1)', [blockerId, blockedId]);
    await pool.query('COMMIT');
    res.json({ msg: 'User blocked' });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).send('Server error');
  }
});

// Unblock User
router.delete('/:id/unblock', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2 RETURNING *', [req.user.id, req.params.id]);
    if (result.rows.length === 0) return res.status(400).json({ msg: 'Not blocked' });
    res.json({ msg: 'User unblocked' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get Follow Requests
router.get('/:userId/follow-requests', auth, async (req, res) => {
  if (req.user.id !== parseInt(req.params.userId)) return res.status(403).json({ msg: 'Unauthorized' });
  try {
    const requests = await pool.query(
      `SELECT f.follower_id, u.username, u.full_name, u.profile_picture_url
       FROM followers f JOIN users u ON f.follower_id = u.id
       WHERE f.followee_id = $1 AND f.status = 'pending'`,
      [req.params.userId]
    );
    res.json(requests.rows);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get Followers
router.get('/:userId/followers', auth, async (req, res) => {
  try {
    const followers = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.profile_picture_url
       FROM followers f JOIN users u ON f.follower_id = u.id
       WHERE f.followee_id = $1 AND f.status = 'accepted'`,
      [req.params.userId]
    );
    res.json(followers.rows);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get Following
router.get('/:userId/following', auth, async (req, res) => {
  try {
    const following = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.profile_picture_url
       FROM followers f JOIN users u ON f.followee_id = u.id
       WHERE f.follower_id = $1 AND f.status = 'accepted'`,
      [req.params.userId]
    );
    res.json(following.rows);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Check follow status between two users
router.get('/:followeeId/followers/:followerId/status', auth, async (req, res) => {
  const { followeeId, followerId } = req.params;
  const authUserId = req.user.id;

  // Ensure the request is made by one of the users involved in the check
  if (authUserId !== parseInt(followeeId) && authUserId !== parseInt(followerId)) {
    return res.status(403).json({ msg: 'Forbidden: You can only check follow status for relevant users' });
  }

  try {
    // Check for blocking relationship
    const isBlocked = await pool.query(
      'SELECT * FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)',
      [followerId, followeeId]
    );
    if (isBlocked.rows.length > 0) {
      return res.status(403).json({ msg: 'Cannot check follow status due to blocking relationship' });
    }

    const followStatus = await pool.query(
      'SELECT status FROM followers WHERE follower_id = $1 AND followee_id = $2',
      [followerId, followeeId]
    );

    if (followStatus.rows.length > 0) {
      res.json({ status: followStatus.rows[0].status });
    } else {
      res.json({ status: 'none' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Check blocking status between two users
router.get('/:blockerId/blocks/:blockedId/status', auth, async (req, res) => {
  const { blockerId, blockedId } = req.params;
  const authUserId = req.user.id;

  // Ensure the request is made by one of the users involved in the check
  if (authUserId !== parseInt(blockerId) && authUserId !== parseInt(blockedId)) {
    return res.status(403).json({ msg: 'Forbidden: You can only check blocking status for relevant users' });
  }

  try {
    const blockStatus = await pool.query(
      'SELECT * FROM blocks WHERE blocker_id = $1 AND blocked_id = $2',
      [blockerId, blockedId]
    );

    if (blockStatus.rows.length > 0) {
      res.json({ isBlocked: true });
    } else {
      res.json({ isBlocked: false });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get Blocked Users
router.get('/:userId/blocked', auth, async (req, res) => {
  if (req.user.id !== parseInt(req.params.userId)) return res.status(403).json({ msg: 'Unauthorized' });
  try {
    const blocked = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.profile_picture_url
       FROM blocks b JOIN users u ON b.blocked_id = u.id
       WHERE b.blocker_id = $1`,
      [req.params.userId]
    );
    res.json(blocked.rows);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Remove Follower
router.delete('/:userId/followers/:followerId', auth, async (req, res) => {
  if (req.user.id !== parseInt(req.params.userId)) return res.status(403).json({ msg: 'Unauthorized' });
  try {
    const result = await pool.query("DELETE FROM followers WHERE followee_id = $1 AND follower_id = $2 AND status = 'accepted' RETURNING *", [req.params.userId, req.params.followerId]);
    if (result.rows.length === 0) return res.status(400).json({ msg: 'Follower not found' });
    res.json({ msg: 'Follower removed' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
