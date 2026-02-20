const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// FIX: Serve static files from root so that /uploads/xxx works correctly when proxied
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(uploadsDir));

app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/internal', require('./routes/internal'));

app.get('/', (req, res) => {
  res.send('Auth & User Service is running');
});

module.exports = app;
