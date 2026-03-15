import { AuthService } from '../../src/services/auth.service';
import db from '../../src/config/database';
import { UserRole } from '../../src/models/types';
import bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let testUserId: string;

  beforeAll(async () => {
    authService = new AuthService();
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await db('users').where('id', testUserId).del();
    }
    await db.destroy();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        mobile_no: '9999999999',
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.DRIVER,
        first_name: 'Test',
        last_name: 'User',
      };

      const user = await authService.register(userData);
      testUserId = user.id;

      expect(user).toBeDefined();
      expect(user.mobile_no).toBe(userData.mobile_no);
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe(userData.role);
      expect(user.first_name).toBe(userData.first_name);
      expect('password' in user).toBe(false); // Password should not be returned
      expect(user.is_active).toBe(true);
    });

    it('should throw error if user with mobile number already exists', async () => {
      const userData = {
        mobile_no: '9999999999', // Same as previous test
        email: 'different@example.com',
        password: 'password123',
        role: UserRole.DRIVER,
      };

      await expect(authService.register(userData)).rejects.toThrow(
        'User with this mobile number or email already exists'
      );
    });

    it('should auto-verify admin users', async () => {
      const adminData = {
        mobile_no: '8888888888',
        email: 'admin@test.com',
        password: 'password123',
        role: UserRole.ADMIN,
      };

      const admin = await authService.register(adminData);
      expect(admin.is_verified).toBe(true);

      // Clean up
      await db('users').where('id', admin.id).del();
    });
  });

  describe('login', () => {
    it('should login successfully with mobile number', async () => {
      const result = await authService.login('9876543210', 'password123');

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.mobile_no).toBe('9876543210');
      expect('password' in result.user).toBe(false);
    });

    it('should login successfully with email', async () => {
      const result = await authService.login('admin@akshayadairy.com', 'password123');

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('admin@akshayadairy.com');
    });

    it('should throw error for invalid credentials', async () => {
      await expect(authService.login('invalid@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should throw error for unverified account', async () => {
      // Create an unverified user
      const hashedPassword = await bcrypt.hash('password123', 10);
      const [unverifiedUser] = await db('users')
        .insert({
          mobile_no: '7777777777',
          email: 'unverified@test.com',
          password: hashedPassword,
          role: UserRole.DRIVER,
          is_active: true,
          is_verified: false,
        })
        .returning('*');

      await expect(authService.login('7777777777', 'password123')).rejects.toThrow(
        'Account not verified. Please contact admin.'
      );

      // Clean up
      await db('users').where('id', unverifiedUser.id).del();
    });

    it('should throw error for inactive account', async () => {
      await expect(authService.login('9999999999', 'wrongpassword')).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should return user by id', async () => {
      // Use seeded admin user
      const loginResult = await authService.login('9876543210', 'password123');
      const userId = loginResult.user.id;

      const user = await authService.getCurrentUser(userId);

      expect(user).toBeDefined();
      expect(user?.id).toBe(userId);
      expect(user).not.toHaveProperty('password');
    });

    it('should return null for non-existent user', async () => {
      const user = await authService.getCurrentUser('00000000-0000-0000-0000-000000000999');
      expect(user).toBeNull();
    });
  });
});

