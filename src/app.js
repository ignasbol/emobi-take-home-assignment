import express from 'express';
import {Queue, Worker, QueueEvents} from 'bullmq';
import {v4 as uuidv4} from 'uuid';
import {generateReport} from './reports.js';

const TYPES = ['immediate', 'scheduled'];
const REDIS_SERVER = 'redis://127.0.0.1:6379';

const app = express();
const port = process.env.PORT ?? '9000';
const eventQueue = new Queue('eventQueue', REDIS_SERVER);
const queueEvents = new QueueEvents('eventQueue');

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

  // Retrieve report status
  const job = await eventQueue.getJob(reportId);

  if (!job) return res.status(404).json({error: 'Report not found'});

  const status = await job.getState();
  res.json({reportId, status});
});

/* Create a new report
  Params:
  - type - "immediate", "scheduled"
  - data
  - time (optional) - execution time
 */
app.post('/report/create', async (req, res) => {
  const {type, data, time} = req.body;

  if (!type) return res.status(400).json({error: 'Type is required'});
  if (!data) return res.status(400).json({error: 'Data is required'});
  if (!TYPES.includes(type))
    return res.status(400).json({error: 'Invalid type'});

  const reportId = uuidv4();

  // Process immediately
  if (!time) {
    await eventQueue.add(
      'report',
      {reportId, reportData: data},
      {jobId: reportId},
    );
    return res.status(202).json({message: 'Report created', reportId});
  }

  //TODO: Schedule processing

  res.json({message: 'Report created', reportId});
});

app.delete('/report/:reportId', async (req, res) => {
  const {reportId} = req.params;

  if (!reportId) return res.status(400).json({error: 'Report ID is required'});

  // Look up report based on ID, check if exists and cancel.
  const job = await eventQueue.getJob(reportId);

  if (!job) return res.status(404).json({error: 'Report not found'});

  await job.remove();
  res.json({message: 'Report cancelled', reportId});
});

queueEvents.on('failed', ({jobId, failedReason}) => {
  console.error(`Job ${jobId} failed ${failedReason}`);
});

queueEvents.on('completed', ({jobId}) => {
  console.log(`Job ${jobId} completed successfully`);
});

const worker = new Worker(
  'eventQueue',
  async (job) => {
    const {reportId, reportData} = job.data;

    try {
      console.log(`Processing report: ${reportId}`);

      await generateReport(reportId, reportData);

      console.log(`Report processed successfully: ${reportId}`);
    } catch (error) {
      console.error(`Error processing report: ${reportId}.`, error);
      throw error;
    }
  },
  {connection: REDIS_SERVER},
);

const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

app.closeServer = () => {
  server.close();
};

export default app;
