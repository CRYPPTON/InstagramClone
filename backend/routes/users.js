const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const auth = require('../middleware/auth'); // Import auth middleware
const jwt = require('jsonwebtoken'); // Import jwt
const multer = require('multer'); // Import multer
const path = require('path'); // Import path module
const fs = require('fs'); // Import fs for file system operations

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://enterwait_user:enterwait_dev_2024@localhost:5432/instagram_clone_db',
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Error: Images only!')); // Pass an Error object
    }
  },
});

// @route   GET /api/users/search
// @desc    Search for users by username or full name
// @access  Private
router.get('/search', auth, async (req, res) => {
  const { query } = req.query;
  const userId = req.user.id;

  if (!query) {
    return res.status(400).json({ msg: 'Search query is required' });
  }

  try {
    const users = await pool.query(
      `SELECT id, username, full_name, profile_picture_url, is_private
       FROM users
       WHERE (username ILIKE $1 OR full_name ILIKE $1)
         AND id != $2 -- Exclude self
         AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker_id = $2 AND blocked_id = users.id) -- Not blocked by searcher
         AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker_id = users.id AND blocked_id = $2) -- Searcher not blocked by them
       ORDER BY username ASC`,
      [`%${query}%`, userId]
    );

    res.json(users.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/users/:username
// @desc    Get user profile
// @access  Public (but posts may be restricted for private profiles)
router.get('/:username', async (req, res) => {
  const { username } = req.params;
  let viewerId = null;

  // Manually check for token, similar to auth middleware but doesn't restrict access if no token
  const token = req.header('x-auth-token');
  if (token) {
    try {
      const decoded = jwt.verify(token, 'secret'); // 'secret' should be an environment variable
      viewerId = decoded.user.id;
    } catch (err) {
      // Token is invalid, treat as unauthenticated
      viewerId = null;
    }
  }

  try {
    const userResult = await pool.query('SELECT id, username, full_name, bio, profile_picture_url, is_private FROM users WHERE username = $1', [username]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const targetUser = userResult.rows[0];
    let posts = [];
    let followerCount = 0;
    let followingCount = 0;

    // Fetch follower count
    const followersResult = await pool.query(
      'SELECT COUNT(*) FROM followers WHERE followee_id = $1 AND status = $2',
      [targetUser.id, 'accepted']
    );
    followerCount = parseInt(followersResult.rows[0].count);

    // Fetch following count
    const followingResult = await pool.query(
      'SELECT COUNT(*) FROM followers WHERE follower_id = $1 AND status = $2',
      [targetUser.id, 'accepted']
    );
    followingCount = parseInt(followingResult.rows[0].count);

    // Check if the profile is private and if the viewer is authorized to see posts
    if (targetUser.is_private) {
      const postQuery = `
        SELECT p.id AS post_id, p.user_id, p.caption, p.created_at, (SELECT COUNT(*) FROM likes WHERE post_id = p.id)::int AS like_count
        FROM posts p WHERE p.user_id = $1 ORDER BY p.created_at DESC
      `;
      // If the viewer is the owner of the profile, or if the viewer is following
      if (viewerId && (viewerId === targetUser.id)) {
        // Owner can see all their posts and their media
        const userPosts = (await pool.query(postQuery, [targetUser.id])).rows;
        posts = await Promise.all(userPosts.map(async (post) => {
          const media = await pool.query('SELECT id, media_url, media_type FROM media WHERE post_id = $1 ORDER BY order_index ASC', [post.post_id]);
          return { ...post, media: media.rows };
        }));
      } else if (viewerId) {
        // Check if viewer is following the target user
        const isFollowing = await pool.query(
          'SELECT * FROM followers WHERE follower_id = $1 AND followee_id = $2 AND status = $3',
          [viewerId, targetUser.id, 'accepted']
        );
        if (isFollowing.rows.length > 0) {
          const userPosts = (await pool.query(postQuery, [targetUser.id])).rows;
          posts = await Promise.all(userPosts.map(async (post) => {
            const media = await pool.query('SELECT id, media_url, media_type FROM media WHERE post_id = $1 ORDER BY order_index ASC', [post.post_id]);
            return { ...post, media: media.rows };
          }));
        }
      }
      // If not authenticated or not following, posts array remains empty
    } else {
      // Public profile, everyone can see posts and their media
      const postQuery = `
        SELECT p.id AS post_id, p.user_id, p.caption, p.created_at, (SELECT COUNT(*) FROM likes WHERE post_id = p.id)::int AS like_count
        FROM posts p WHERE p.user_id = $1 ORDER BY p.created_at DESC
      `;
      const userPosts = (await pool.query(postQuery, [targetUser.id])).rows;
      posts = await Promise.all(userPosts.map(async (post) => {
        const media = await pool.query('SELECT id, media_url, media_type FROM media WHERE post_id = $1 ORDER BY order_index ASC', [post.post_id]);
        return { ...post, media: media.rows };
      }));
    }

    const userProfile = {
      ...targetUser,
      posts: posts,
      followerCount: followerCount,
      followingCount: followingCount,
    };

    res.json(userProfile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/users/:followeeId/followers/:followerId/status
// @desc    Check follow status between two users
// @access  Private
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

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private
router.put('/:id', auth, upload.single('profile_picture'), async (req, res) => {
  const { full_name, bio } = req.body;
  const is_private = req.body.is_private === 'true'; // Define is_private here
  const is_private_string = is_private ? 'TRUE' : 'FALSE'; // Convert boolean to string for SQL
  const userId = parseInt(req.params.id); // Ensure userId is an integer
  if (isNaN(userId)) {
    return res.status(400).json({ msg: 'Invalid User ID' });
  }
  const profile_picture = req.file; // Multer adds file info to req.file

  // Check if authenticated user is updating their own profile
  if (req.user.id !== parseInt(userId)) {
    // If a file was uploaded but user is not authorized, delete the file
    if (profile_picture) {
      fs.unlink(profile_picture.path, (err) => {
        if (err) console.error('Error deleting unauthorized profile picture:', err);
      });
    }
    return res.status(403).json({ msg: 'Forbidden: You can only update your own profile' });
  }

  let profile_picture_url = null;
  if (profile_picture) {
    profile_picture_url = `/uploads/${profile_picture.filename}`;
  }

  try {
    // Before updating, get the current profile_picture_url to delete old file if a new one is uploaded
    const currentUserResult = await pool.query('SELECT profile_picture_url FROM users WHERE id = $1', [userId]);
    const currentProfilePictureUrl = currentUserResult.rows[0]?.profile_picture_url;

    let query = 'UPDATE users SET full_name = $1, bio = $2, is_private = $3 WHERE id = $4 RETURNING id, username, full_name, bio, profile_picture_url, is_private';
    let queryParams = [full_name, bio, is_private_string, userId];

    if (profile_picture_url) {
      query = 'UPDATE users SET full_name = $1, bio = $2, is_private = $3, profile_picture_url = $4 WHERE id = $5 RETURNING id, username, full_name, bio, profile_picture_url, is_private';
      queryParams = [full_name, bio, is_private_string, profile_picture_url, userId];
    }

    const updatedUser = await pool.query(query, queryParams);

    if (updatedUser.rows.length === 0) {
      // If a file was uploaded but user not found, delete the file
      if (profile_picture) {
        fs.unlink(profile_picture.path, (err) => {
          if (err) console.error('Error deleting profile picture for non-existent user:', err);
        });
      }
      return res.status(404).json({ msg: 'User not found' });
    }

    // If a new profile picture was uploaded and an old one existed, delete the old file
    if (profile_picture && currentProfilePictureUrl && currentProfilePictureUrl.startsWith('/uploads/')) {
      const oldFilePath = path.join(__dirname, '..', currentProfilePictureUrl);
      fs.unlink(oldFilePath, (err) => {
        if (err) console.error('Error deleting old profile picture:', err);
      });
    }

    res.json(updatedUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/users/:id/follow
// @desc    Follow a user
// @access  Private
router.post('/:id/follow', auth, async (req, res) => {
  const followerId = req.user.id;
  const followeeId = parseInt(req.params.id);

  if (followerId === followeeId) {
    return res.status(400).json({ msg: 'You cannot follow yourself' });
  }

  try {
    // Check if followee exists
    const followeeExists = await pool.query('SELECT id, is_private FROM users WHERE id = $1', [followeeId]);
    if (followeeExists.rows.length === 0) {
      return res.status(404).json({ msg: 'User to follow not found' });
    }

    const isPrivate = followeeExists.rows[0].is_private;

    // Check if already following or pending
    const existingFollow = await pool.query(
      'SELECT * FROM followers WHERE follower_id = $1 AND followee_id = $2',
      [followerId, followeeId]
    );

    if (existingFollow.rows.length > 0) {
      return res.status(400).json({ msg: 'Already following or pending approval' });
    }

    let status = 'accepted';
    if (isPrivate) {
      status = 'pending';
    }

    await pool.query(
      'INSERT INTO followers (follower_id, followee_id, status) VALUES ($1, $2, $3)',
      [followerId, followeeId, status]
    );

    res.json({ msg: `Follow request ${status}` });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/users/:id/unfollow
// @desc    Unfollow a user
// @access  Private
router.post('/:id/unfollow', auth, async (req, res) => {
  const followerId = req.user.id;
  const followeeId = parseInt(req.params.id);

  try {
    const unfollowResult = await pool.query(
      'DELETE FROM followers WHERE follower_id = $1 AND followee_id = $2 RETURNING *',
      [followerId, followeeId]
    );

    if (unfollowResult.rows.length === 0) {
      return res.status(400).json({ msg: 'Not following this user' });
    }

    res.json({ msg: 'User unfollowed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/users/:userId/followers/:followerId/accept
// @desc    Accept a follow request
// @access  Private
router.put('/:userId/followers/:followerId/accept', auth, async (req, res) => {
  const { userId, followerId } = req.params;

  // Ensure authenticated user is the owner of the profile
  if (req.user.id !== parseInt(userId)) {
    return res.status(403).json({ msg: 'Forbidden: You can only manage your own follow requests' });
  }

  try {
    const result = await pool.query(
      'UPDATE followers SET status = $1 WHERE followee_id = $2 AND follower_id = $3 AND status = $4 RETURNING *',
      ['accepted', userId, followerId, 'pending']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Pending follow request not found' });
    }

    res.json({ msg: 'Follow request accepted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/users/:userId/followers/:followerId/reject
// @desc    Reject a follow request
// @access  Private
router.put('/:userId/followers/:followerId/reject', auth, async (req, res) => {
  const { userId, followerId } = req.params;

  // Ensure authenticated user is the owner of the profile
  if (req.user.id !== parseInt(userId)) {
    return res.status(403).json({ msg: 'Forbidden: You can only manage your own follow requests' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM followers WHERE followee_id = $1 AND follower_id = $2 AND status = $3 RETURNING *',
      [userId, followerId, 'pending']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Pending follow request not found' });
    }

    res.json({ msg: 'Follow request rejected' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/users/:id/block
// @desc    Block a user
// @access  Private
router.post('/:id/block', auth, async (req, res) => {
  const blockerId = req.user.id;
  const blockedId = parseInt(req.params.id);

  if (blockerId === blockedId) {
    return res.status(400).json({ msg: 'You cannot block yourself' });
  }

  try {
    // Check if blocked user exists
    const blockedUserExists = await pool.query('SELECT id FROM users WHERE id = $1', [blockedId]);
    if (blockedUserExists.rows.length === 0) {
      return res.status(404).json({ msg: 'User to block not found' });
    }

    // Check if already blocked
    const alreadyBlocked = await pool.query(
      'SELECT * FROM blocks WHERE blocker_id = $1 AND blocked_id = $2',
      [blockerId, blockedId]
    );

    if (alreadyBlocked.rows.length > 0) {
      return res.status(400).json({ msg: 'User already blocked' });
    }

    await pool.query(
      'INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2)',
      [blockerId, blockedId]
    );

    // If blocker was following blocked user, unfollow them
    await pool.query(
      'DELETE FROM followers WHERE follower_id = $1 AND followee_id = $2',
      [blockerId, blockedId]
    );

    res.json({ msg: 'User blocked successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/users/:id/unblock
// @desc    Unblock a user
// @access  Private
router.delete('/:id/unblock', auth, async (req, res) => {
  const blockerId = req.user.id;
  const blockedId = parseInt(req.params.id);

  try {
    const unblockResult = await pool.query(
      'DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2 RETURNING *',
      [blockerId, blockedId]
    );

    if (unblockResult.rows.length === 0) {
      return res.status(400).json({ msg: 'User is not blocked' });
    }

    res.json({ msg: 'User unblocked successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/users/:userId/follow-requests
// @desc    Get pending follow requests for the user
// @access  Private (only accessible by the user whose ID is in the URL)
router.get('/:userId/follow-requests', auth, async (req, res) => {
  const { userId } = req.params;
  const authUserId = req.user.id;

  if (authUserId !== parseInt(userId)) {
    return res.status(403).json({ msg: 'Forbidden: You can only view your own follow requests' });
  }

  try {
    const pendingRequests = await pool.query(
      `SELECT f.follower_id, u.username, u.full_name, u.profile_picture_url
       FROM followers f
       JOIN users u ON f.follower_id = u.id
       WHERE f.followee_id = $1 AND f.status = 'pending'`,
      [userId]
    );

    res.json(pendingRequests.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/users/:blockerId/blocks/:blockedId/status
// @desc    Check blocking status between two users
// @access  Private
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

// @route   GET /api/users/:userId/followers
// @desc    Get followers of a user
// @access  Private
router.get('/:userId/followers', auth, async (req, res) => {
  const { userId } = req.params;

  try {
    const followers = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.profile_picture_url
       FROM followers f
       JOIN users u ON f.follower_id = u.id
       WHERE f.followee_id = $1 AND f.status = 'accepted'`,
      [userId]
    );

    res.json(followers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/users/:userId/following
// @desc    Get users a user is following
// @access  Private
router.get('/:userId/following', auth, async (req, res) => {
  const { userId } = req.params;

  try {
    const following = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.profile_picture_url
       FROM followers f
       JOIN users u ON f.followee_id = u.id
       WHERE f.follower_id = $1 AND f.status = 'accepted'`,
      [userId]
    );

    res.json(following.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/users/:userId/blocked
// @desc    Get blocked users for a user
// @access  Private
router.get('/:userId/blocked', auth, async (req, res) => {
  const { userId } = req.params;
  const authUserId = req.user.id;

  if (authUserId !== parseInt(userId)) {
    return res.status(403).json({ msg: 'Forbidden: You can only view your own blocked list' });
  }

  try {
    const blockedUsers = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.profile_picture_url
       FROM blocks b
       JOIN users u ON b.blocked_id = u.id
       WHERE b.blocker_id = $1`,
      [userId]
    );

    res.json(blockedUsers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/users/:userId/followers/:followerId
// @desc    Remove a follower from the user's profile
// @access  Private
router.delete('/:userId/followers/:followerId', auth, async (req, res) => {
  const { userId, followerId } = req.params;
  const authUserId = req.user.id;

  // Ensure authenticated user is the owner of the profile
  if (authUserId !== parseInt(userId)) {
    return res.status(403).json({ msg: 'Forbidden: You can only remove followers from your own profile' });
  }

  try {
    const removeResult = await pool.query(
      'DELETE FROM followers WHERE followee_id = $1 AND follower_id = $2 AND status = $3 RETURNING *',
      [parseInt(userId, 10), parseInt(followerId, 10), 'accepted']
    );

    if (removeResult.rows.length === 0) {
      return res.status(400).json({ msg: 'Follower not found or not an accepted follower' });
    }

    res.json({ msg: 'Follower removed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;