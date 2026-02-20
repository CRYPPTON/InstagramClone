const app = require('./app');
const port = process.env.PORT || 3002;

app.listen(port, () => {
  console.log(`Post Service running on port ${port}`);
});
