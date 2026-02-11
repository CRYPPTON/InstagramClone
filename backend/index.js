const express = require('express');
const cors = require('cors');
const path = require('path'); // Import path module

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  exposedHeaders: 'x-auth-token',
}));
app.use(express.json());

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/users', require('./routes/users'));

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
