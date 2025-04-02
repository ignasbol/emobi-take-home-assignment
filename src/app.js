import express from 'express';
import {v4 as uuidv4} from 'uuid';

const TYPES = ['immediate', 'scheduled'];

const app = express();
const port = process.env.PORT ?? '9000';

app.use(express.json());

// Catch server errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({error: 'Something went wrong'});
});

// Check report status - 'pending', 'running', 'completed'
app.get('/report/status/:reportId', (req, res) => {
  const {reportId} = req.params;

  if (!reportId) return res.status(400).json({error: 'Report ID is required'});

  // Retrieve report status
  const status = 'completed';

  res.json({reportId, status});
});

/* Create a new report
  Params:
  - type - "immediate", "scheduled"
  - data
  - time (optional) - execution time
 */
app.post('/report/create', (req, res) => {
  const {type, data, time} = req.body;

  if (!type) return res.status(400).json({error: 'Type is required'});
  if (!data) return res.status(400).json({error: 'Data is required'});
  if (!TYPES.includes(type))
    return res.status(400).json({error: 'Invalid type'});

  const reportId = uuidv4();

  res.json({message: 'Report created', reportId});
});

app.delete('/report/:reportId', (req, res) => {
  const {reportId} = req.params;

  if (!reportId) return res.status(400).json({error: 'Report ID is required'});

  // Look up report based on ID, check if exists and cancel.

  res.json({message: 'Report cancelled', reportId});
});

const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

app.closeServer = () => {
  server.close();
};

export default app;
