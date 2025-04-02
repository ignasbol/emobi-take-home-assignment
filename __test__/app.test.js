import request from 'supertest';
import app from '../src/app';

jest.mock('bullmq', () => {
  return {
    Queue: jest.fn().mockImplementation(() => {
      return {
        add: jest.fn(),
        getJob: jest.fn().mockImplementation(() => {
          return {
            getState: () => {
              return 'completed';
            },
            remove: jest.fn(),
          };
        }),
      };
    }),
    Worker: jest.fn(),
    QueueEvents: jest.fn().mockImplementation(() => {
      return {
        on: jest.fn(),
      };
    }),
  };
});

jest.mock('cron'),
  () => {
    return {
      CronJob: jest.fn(),
    };
  };

afterAll(async () => {
  app.closeServer();
});

describe('API tests', () => {
  it('should respond with type is required', async () => {
    const response = await request(app).post('/report/create').send({
      data: {},
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Type is required');
  });

  it('should respond with data is required', async () => {
    const response = await request(app).post('/report/create').send({
      type: 'immediate',
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Data is required');
  });

  it('should respond with time is required', async () => {
    const response = await request(app).post('/report/create').send({
      type: 'scheduled',
      data: {},
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Time is required');
  });

  it('should respond with invalid type', async () => {
    const response = await request(app).post('/report/create').send({
      type: 'invalid_type',
      data: {},
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid type');
  });

  let reportId;
  it('should respond with report scheduled', async () => {
    const response = await request(app).post('/report/create').send({
      type: 'immediate',
      data: {},
    });
    expect(response.status).toBe(202);
    expect(response.body.message).toBe(
      'Report scheduled for immediate execution',
    );

    reportId = response.body.reportId;
  });

  it('should respond with report scheduled in the future', async () => {
    const response = await request(app).post('/report/create').send({
      type: 'scheduled',
      time: '2059112372',
      data: {},
    });
    expect(response.status).toBe(202);
    expect(response.body.message).toBe(
      'Report scheduled for Mon Apr 02 2035 00:39:32 GMT-0700 (Pacific Daylight Time)',
    );

    reportId = response.body.reportId;
  });

  it('should fail if no reportId provided to get status', async () => {
    const response = await request(app).get('/report/status');
    expect(response.status).toBe(404);
  });

  it('should get status for report', async () => {
    const response = await request(app).get(`/report/status/${reportId}`);
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('completed');
  });

  it('should fail if no reportId provided to delete report', async () => {
    const response = await request(app).delete('/report');
    expect(response.status).toBe(404);
  });

  it('should cancel report', async () => {
    const response = await request(app).delete(`/report/${reportId}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Report cancelled');
  });
});
