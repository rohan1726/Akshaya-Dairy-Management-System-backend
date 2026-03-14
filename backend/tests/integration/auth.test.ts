import request from 'supertest';
import app from '../../src/app';
import db from '../../src/config/database';
import { UserRole } from '../../src/models/types';

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    // Ensure database is ready
    await db.raw('SELECT 1');
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          mobileOrEmail: '9876543210',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.mobile_no).toBe('9876543210');
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should login with email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          mobileOrEmail: 'admin@akshayadairy.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          mobileOrEmail: '9876543210',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          mobileOrEmail: '9876543210',
          // password missing
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for invalid password length', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          mobileOrEmail: '9876543210',
          password: '12345', // Less than 6 characters
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/register', () => {
    let testUserId: string;

    afterEach(async () => {
      if (testUserId) {
        await db('users').where('id', testUserId).del();
        testUserId = '';
      }
    });

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          mobile_no: '1111111111',
          email: 'newuser@test.com',
          password: 'password123',
          role: UserRole.DRIVER,
          first_name: 'New',
          last_name: 'User',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.mobile_no).toBe('1111111111');
      expect(response.body.data.password).toBeUndefined();
      testUserId = response.body.data.id;
    });

    it('should return 400 for duplicate mobile number', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          mobile_no: '9876543210', // Already exists from seed
          email: 'duplicate@test.com',
          password: 'password123',
          role: UserRole.DRIVER,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should return 400 for invalid mobile number format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          mobile_no: '12345', // Invalid format
          password: 'password123',
          role: UserRole.DRIVER,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          mobile_no: '2222222222',
          email: 'invalid-email',
          password: 'password123',
          role: UserRole.DRIVER,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;

    beforeAll(async () => {
      // Get auth token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          mobileOrEmail: '9876543210',
          password: 'password123',
        });

      authToken = loginResponse.body.data.token;
    });

    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.mobile_no).toBe('9876543210');
      expect(response.body.data.password).toBeUndefined();
    });

    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});

