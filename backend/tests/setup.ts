import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests

