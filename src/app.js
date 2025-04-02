import {CronJob} from 'cron';
import express from 'express';
import {v4 as uuidv4} from 'uuid';
import {eventQueue} from './eventQueue.js';

const TYPES = ['immediate', 'scheduled'];

const app = express();
const port = process.env.PORT ?? '9000';

app.use(express.json());

// Catch server errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({error: 'Something went wrong'});
});

// Check report status
app.get('/report/status/:reportId', async (req, res) => {
  const {reportId} = req.params;

  if (!reportId) return res.status(400).json({error: 'Report ID is required'});

  // Look up report based on ID, check if exists and get status
  const job = await eventQueue.getJob(reportId);

  if (!job) return res.status(404).json({error: 'Report not found'});

  const status = await job.getState();
  res.json({reportId, status});
});

/* Create a new report
  Params:
  - type - "immediate", "scheduled"
  - data
  - time (optional) - execution time as Unix timestamp
 */
app.post('/report/create', async (req, res) => {
  const {type, data, time} = req.body;

  if (!type) return res.status(400).json({error: 'Type is required'});
  if (!data) return res.status(400).json({error: 'Data is required'});
  if (type === 'scheduled' && !time)
    return res.status(400).json({error: 'Time is required'});
  if (!TYPES.includes(type))
    return res.status(400).json({error: 'Invalid type'});

  const reportId = uuidv4();
  let message = `Report scheduled`;

  // Process immediately
  if (type === 'scheduled') {
    // Schedule processing
    // TODO: determine input type
    // TODO: parse date string
    const scheduledDate = new Date(time * 1000);
    new CronJob(
      scheduledDate,
      async () => {
        await eventQueue.add(
          'report',
          {reportId, reportData: data},
          {jobId: reportId},
        );
      },
      null,
      true,
    );
    message = `Report scheduled for ${scheduledDate}`;
  } else {
    await eventQueue.add(
      'report',
      {reportId, reportData: data},
      {jobId: reportId},
    );
    message = `Report scheduled for immediate execution`;
  }

  res.status(202).json({message, reportId});
});

app.delete('/report/:reportId', async (req, res) => {
  const {reportId} = req.params;

  if (!reportId) return res.status(400).json({error: 'Report ID is required'});

  // Look up report based on ID, check if exists and cancel
  const job = await eventQueue.getJob(reportId);

  if (!job) return res.status(404).json({error: 'Report not found'});

  await job.remove();
  res.json({message: 'Report cancelled', reportId});
});

const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

app.closeServer = () => {
  server.close();
};

export default app;
