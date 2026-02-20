const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// Routes
app.use('/interactions', require('./routes/interactions'));

// Internal Routes for counts and cleanup
app.use('/internal', require('./routes/interactions')); // Reuse the same file or split

app.get('/', (req, res) => {
  res.send('Interaction Service is running');
});

app.listen(port, () => {
  console.log(`Interaction Service running on port ${port}`);
});
