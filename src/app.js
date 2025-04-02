import express from 'express';

const app = express();
const port = process.env.PORT ?? '9000';

// Check report status
app.get('/', (req, res) => {
  res.send('Request received');
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
