const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// FIX: Serve static files from root so that /uploads/xxx works correctly when proxied
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/posts', require('./routes/posts'));

// Internal Routes
app.get('/internal/posts/:id', async (req, res) => {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        const post = await pool.query('SELECT user_id FROM posts WHERE id = $1', [req.params.id]);
        if (post.rows.length === 0) return res.status(404).json({ msg: 'Post not found' });
        res.json(post.rows[0]);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

app.get('/', (req, res) => {
  res.send('Post & Media Service is running');
});

app.listen(port, () => {
  console.log(`Post Service running on port ${port}`);
});
