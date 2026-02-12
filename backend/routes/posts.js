const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const auth = require('../middleware/auth'); // Import auth middleware
const multer = require('multer'); // Import multer
const path = require('path'); // Import path for file paths
const fs = require('fs'); // Import fs for file system operations

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://enterwait_user:enterwait_dev_2024@localhost:5432/instagram_clone_db',
});

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Store files in the 'uploads/' directory
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// Initialize upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB file size limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images and Videos Only!');
    }
  },
}).array('media', 20); // 'media' is the field name, 20 is max files


// @route   GET /api/posts/timeline
// @desc    Get posts for the authenticated user's timeline
// @access  Private
router.get('/timeline', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    const timelinePosts = await pool.query(
      `SELECT
         p.id AS post_id,
         p.caption,
         p.created_at AS post_created_at,
         u.id AS user_id,
         u.username,
         u.full_name,
         u.profile_picture_url,
         COUNT(DISTINCT l.id) AS like_count,
         COUNT(DISTINCT c.id) AS comment_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN likes l ON p.id = l.post_id
       LEFT JOIN comments c ON p.id = c.post_id
       WHERE
         (u.is_private = FALSE -- Public profiles
         OR (u.id IN (SELECT followee_id FROM followers WHERE follower_id = $1 AND status = 'accepted'))) -- Followed private profiles
         AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker_id = $1 AND blocked_id = u.id) -- Not blocked by user
         AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker_id = u.id AND blocked_id = $1) -- User not blocked by them
       GROUP BY p.id, u.id
       ORDER BY p.created_at DESC;`,
      [userId]
    );

    // Fetch media for each post
    const postsWithMedia = await Promise.all(timelinePosts.rows.map(async (post) => {
      const media = await pool.query('SELECT media_url, media_type, order_index FROM media WHERE post_id = $1 ORDER BY order_index ASC', [post.post_id]);
      return { ...post, media: media.rows };
    }));

    res.json(postsWithMedia);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/posts/:id
// @desc    Get a single post by ID
// @access  Public
router.get('/:id', async (req, res) => {
  const postId = parseInt(req.params.id);
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
    const postResult = await pool.query(
      `SELECT
         p.id AS post_id,
         p.caption,
         p.created_at AS post_created_at,
         u.id AS user_id,
         u.username,
         u.full_name,
         u.profile_picture_url,
         u.is_private,
         COUNT(DISTINCT l.id) AS like_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN likes l ON p.id = l.post_id
       WHERE p.id = $1
       GROUP BY p.id, u.id`,
      [postId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    const post = postResult.rows[0];

    // Check if the profile is private and if the viewer is authorized to see the post
    if (post.is_private) {
      if (!viewerId || (viewerId !== post.user_id && !(await isFollowing(viewerId, post.user_id)))) {
        return res.status(403).json({ msg: 'This account is private.' });
      }
    }

    // Fetch media for the post
    const media = await pool.query('SELECT media_url, media_type, order_index FROM media WHERE post_id = $1 ORDER BY order_index ASC', [post.post_id]);
    post.media = media.rows;

    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Helper function to check if a user is following another user
const isFollowing = async (followerId, followeeId) => {
  const result = await pool.query(
    'SELECT * FROM followers WHERE follower_id = $1 AND followee_id = $2 AND status = $3',
    [followerId, followeeId, 'accepted']
  );
  return result.rows.length > 0;
};


// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', auth, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error(err);
      return res.status(400).json({ msg: err });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: 'No media files uploaded' });
    }

    const { caption } = req.body;
    const userId = req.user.id;

    try {
      // Insert post into posts table
      const newPost = await pool.query(
        'INSERT INTO posts (user_id, caption) VALUES ($1, $2) RETURNING id, user_id, caption, created_at',
        [userId, caption]
      );
      const postId = newPost.rows[0].id;

      // Insert media files into media table
      const mediaPromises = req.files.map(file => {
        const mediaUrl = `/uploads/${file.filename}`; // Storing relative path
        const mediaType = file.mimetype.startsWith('image') ? 'image' : 'video';
        return pool.query(
          'INSERT INTO media (post_id, media_url, media_type) VALUES ($1, $2, $3)',
          [postId, mediaUrl, mediaType]
        );
      });

      await Promise.all(mediaPromises);

      res.json({ msg: 'Post created successfully', post: newPost.rows[0], media: req.files.map(file => file.filename) });
    } catch (dbErr) {
      console.error(dbErr.message);
      res.status(500).send('Server error');
    }
  });
});


// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const postId = parseInt(req.params.id);
  const userId = req.user.id;
  const { caption } = req.body;

  try {
    // Check if the post exists and belongs to the authenticated user
    const post = await pool.query('SELECT user_id FROM posts WHERE id = $1', [postId]);
    if (post.rows.length === 0) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    if (post.rows[0].user_id !== userId) {
      return res.status(403).json({ msg: 'Forbidden: You can only update your own posts' });
    }

    // Update the post caption
    const updatedPost = await pool.query(
      'UPDATE posts SET caption = $1 WHERE id = $2 RETURNING id, caption',
      [caption, postId]
    );

    res.json({ msg: 'Post updated successfully', post: updatedPost.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  const postId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    // Check if the post exists and belongs to the authenticated user
    const postResult = await pool.query('SELECT user_id FROM posts WHERE id = $1', [postId]);
    if (postResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    if (postResult.rows[0].user_id !== userId) {
      return res.status(403).json({ msg: 'Forbidden: You can only delete your own posts' });
    }

    // Get all media associated with the post to delete files
    const mediaResults = await pool.query('SELECT media_url FROM media WHERE post_id = $1', [postId]);

    // Delete media records from the database
    await pool.query('DELETE FROM media WHERE post_id = $1', [postId]);

    // Delete the post from the database
    await pool.query('DELETE FROM posts WHERE id = $1', [postId]);

    // Delete associated files from the filesystem
    mediaResults.rows.forEach(media => {
      const filePath = path.join(__dirname, '..', media.media_url);
      fs.unlink(filePath, (err) => {
        if (err) console.error(`Failed to delete file ${filePath}:`, err);
      });
    });

    res.json({ msg: 'Post and associated media deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/posts/:postId/media/:mediaId
// @desc    Delete a single media item from a post
// @access  Private
router.delete('/:postId/media/:mediaId', auth, async (req, res) => {
  const postId = parseInt(req.params.postId);
  const mediaId = parseInt(req.params.mediaId);
  const userId = req.user.id;

  try {
    // Check if the post exists and belongs to the authenticated user
    const postResult = await pool.query('SELECT user_id FROM posts WHERE id = $1', [postId]);
    if (postResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    if (postResult.rows[0].user_id !== userId) {
      return res.status(403).json({ msg: 'Forbidden: You can only delete media from your own posts' });
    }

    // Check if the media exists and belongs to the post
    const mediaResult = await pool.query('SELECT media_url FROM media WHERE id = $1 AND post_id = $2', [mediaId, postId]);
    if (mediaResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Media item not found in this post' });
    }

    // Delete the media record from the database
    await pool.query('DELETE FROM media WHERE id = $1', [mediaId]);

    // Delete the associated file from the filesystem
    const filePath = path.join(__dirname, '..', mediaResult.rows[0].media_url);
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Failed to delete file ${filePath}:`, err);
    });

    res.json({ msg: 'Media item deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/posts/:id/like
// @desc    Like a post
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  const postId = parseInt(req.params.id);
  const userId = req.user.id; // The user liking the post

  try {
    // Check if the post exists and if the user is authorized to see it
    const postVisibilityResult = await pool.query(
      `SELECT p.user_id, u.is_private
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [postId]
    );

    if (postVisibilityResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    const postInfo = postVisibilityResult.rows[0];
    const postOwnerId = postInfo.user_id;

    // If the post owner's profile is private, check for follow status
    if (postInfo.is_private && postOwnerId !== userId) {
      const isFollower = await isFollowing(userId, postOwnerId);
      if (!isFollower) {
        return res.status(403).json({ msg: 'You cannot like a post from a private profile you do not follow.' });
      }
    }

    // Check if already liked
    const alreadyLiked = await pool.query(
      'SELECT * FROM likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );
    if (alreadyLiked.rows.length > 0) {
      return res.status(400).json({ msg: 'Post already liked' });
    }

    // Insert like
    await pool.query('INSERT INTO likes (post_id, user_id) VALUES ($1, $2)', [postId, userId]);

    res.json({ msg: 'Post liked successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/posts/:id/like
// @desc    Unlike a post
// @access  Private
router.delete('/:id/like', auth, async (req, res) => {
  const postId = parseInt(req.params.id);
  const userId = req.user.id; // The user unliking the post

  try {
    // Check if post exists
    const postResult = await pool.query('SELECT id FROM posts WHERE id = $1', [postId]);
    if (postResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Delete like
    const deleteResult = await pool.query(
      'DELETE FROM likes WHERE post_id = $1 AND user_id = $2 RETURNING *',
      [postId, userId]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(400).json({ msg: 'Post not liked by this user' });
    }

    res.json({ msg: 'Post unliked successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/posts/:postId/like
// @desc    Check if a user has liked a post
// @access  Private
router.get('/:postId/like', auth, async (req, res) => {
  const postId = parseInt(req.params.postId);
  const userId = req.user.id;

  try {
    const like = await pool.query(
      'SELECT * FROM likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );

    if (like.rows.length > 0) {
      res.json({ liked: true });
    } else {
      res.json({ liked: false });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


// @route   POST /api/posts/:id/comment
// @desc    Comment on a post
// @access  Private
router.post('/:id/comment', auth, async (req, res) => {
  const postId = parseInt(req.params.id);
  const userId = req.user.id; // The user commenting
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ msg: 'Comment content is required' });
  }

  try {
    // Check if post exists
    const postResult = await pool.query('SELECT user_id FROM posts WHERE id = $1', [postId]);
    if (postResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    const postOwnerId = postResult.rows[0].user_id;

    // Check if the post owner is blocked by the commenting user, or vice versa
    const isBlocked = await pool.query(
      'SELECT * FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)',
      [userId, postOwnerId]
    );
    if (isBlocked.rows.length > 0) {
      return res.status(403).json({ msg: 'Cannot comment on this post due to blocking relationship' });
    }

    // Check if the post is from a private profile and the user is not following
    const postOwnerPrivate = await pool.query('SELECT is_private FROM users WHERE id = $1', [postOwnerId]);
    if (postOwnerPrivate.rows[0].is_private && postOwnerId !== userId) {
      const isFollowing = await pool.query(
        'SELECT * FROM followers WHERE follower_id = $1 AND followee_id = $2 AND status = $3',
        [userId, postOwnerId, 'accepted']
      );
      if (isFollowing.rows.length === 0) {
        return res.status(403).json({ msg: 'Cannot comment on a private post without following the user' });
      }
    }

    // Insert comment
    const newComment = await pool.query(
      'INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING id, post_id, user_id, content, created_at',
      [postId, userId, content]
    );

    res.json({ msg: 'Comment added successfully', comment: newComment.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/posts/:postId/comments/:commentId
// @desc    Edit a comment
// @access  Private
router.put('/:postId/comments/:commentId', auth, async (req, res) => {
  const { postId, commentId } = req.params;
  const userId = req.user.id;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ msg: 'Comment content is required' });
  }

  try {
    // Check if the comment exists and belongs to the authenticated user
    const comment = await pool.query('SELECT user_id FROM comments WHERE id = $1 AND post_id = $2', [commentId, postId]);
    if (comment.rows.length === 0) {
      return res.status(404).json({ msg: 'Comment not found' });
    }
    if (comment.rows[0].user_id !== userId) {
      return res.status(403).json({ msg: 'Forbidden: You can only edit your own comments' });
    }

    // Update the comment content
    const updatedComment = await pool.query(
      'UPDATE comments SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, content, updated_at',
      [content, commentId]
    );

    res.json({ msg: 'Comment updated successfully', comment: updatedComment.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/posts/:postId/comments/:commentId
// @desc    Delete a comment
// @access  Private
router.delete('/:postId/comments/:commentId', auth, async (req, res) => {
  const { postId, commentId } = req.params;
  const userId = req.user.id;

  try {
    // Check if the comment exists and belongs to the authenticated user
    const comment = await pool.query('SELECT user_id FROM comments WHERE id = $1 AND post_id = $2', [commentId, postId]);
    if (comment.rows.length === 0) {
      return res.status(404).json({ msg: 'Comment not found' });
    }
    if (comment.rows[0].user_id !== userId) {
      return res.status(403).json({ msg: 'Forbidden: You can only delete your own comments' });
    }

    // Delete the comment
    await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);

    res.json({ msg: 'Comment deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/posts/:postId/comments
// @desc    Get all comments for a post
// @access  Public
router.get('/:postId/comments', async (req, res) => {
  const postId = parseInt(req.params.postId);

  try {
    const comments = await pool.query(
      `SELECT c.id, c.content, c.created_at, u.id AS user_id, u.username
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at DESC`,
      [postId]
    );

    res.json(comments.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
