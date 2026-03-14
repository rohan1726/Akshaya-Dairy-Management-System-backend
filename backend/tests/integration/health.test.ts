import request from 'supertest';
import app from '../../src/app';
import db from '../../src/config/database';

describe('Health Check API', () => {
  beforeAll(async () => {
    await db.raw('SELECT 1');
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Akshaya Dairy API is running');
      expect(response.body.timestamp).toBeDefined();
    });
  });
});

