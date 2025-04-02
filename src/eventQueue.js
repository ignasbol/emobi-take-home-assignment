import {Queue, Worker, QueueEvents} from 'bullmq';
import {generateReport} from './reports.js';

const REDIS_SERVER = 'redis://127.0.0.1:6379';

const eventQueue = new Queue('eventQueue', REDIS_SERVER);
const queueEvents = new QueueEvents('eventQueue');

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

queueEvents.on('failed', ({jobId, failedReason}) => {
  console.error(`Job ${jobId} failed ${failedReason}`);
});

queueEvents.on('completed', ({jobId}) => {
  console.log(`Job ${jobId} completed successfully`);
});

export {eventQueue};
