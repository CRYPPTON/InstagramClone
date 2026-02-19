const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://enterwait_user:enterwait_dev_2024@localhost:5433/instagram_clone_db',
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, email, password, fullName } = req.body;

  try {
    const userExists = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);

    if (userExists.rows.length > 0) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO users (username, email, password, full_name) VALUES ($1, $2, $3, $4) RETURNING id, username',
      [username, email, hashedPassword, fullName]
    );

    const payload = {
      user: {
        id: newUser.rows[0].id,
        username: newUser.rows[0].username, // Include username in payload
      },
    };

    jwt.sign(payload, 'secret', { expiresIn: 3600 }, (err, token) => {
      if (err) throw err;
      res.header('x-auth-token', token).json({ token });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/auth/login
// @desc    Login a user
// @access  Public
router.post('/login', async (req, res) => {
  const { loginIdentifier, password } = req.body;

  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $1', [loginIdentifier]);

    if (user.rows.length === 0) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.rows[0].id,
        username: user.rows[0].username, // Include username in payload
      },
    };

    jwt.sign(payload, 'secret', { expiresIn: 3600 }, (err, token) => {
      if (err) throw err;
      res.header('x-auth-token', token).json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
