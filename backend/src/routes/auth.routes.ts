import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate, loginSchema, registerSchema } from '../utils/validation';

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     description: Login with mobile number or email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobileOrEmail
 *               - password
 *             properties:
 *               mobileOrEmail:
 *                 type: string
 *                 example: "9876543210"
 *                 description: Mobile number or email address
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *                 description: User password (minimum 6 characters)
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         mobile_no:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                           enum: [admin, driver, vendor]
 *                     token:
 *                       type: string
 *                       description: JWT authentication token
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', validate(loginSchema), authController.login.bind(authController));

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: User registration
 *     tags: [Authentication]
 *     description: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile_no
 *               - password
 *               - role
 *             properties:
 *               mobile_no:
 *                 type: string
 *                 pattern: "^[0-9]{10}$"
 *                 example: "9876543210"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *               role:
 *                 type: string
 *                 enum: [admin, driver, vendor]
 *                 example: "vendor"
 *               first_name:
 *                 type: string
 *                 example: "John"
 *               last_name:
 *                 type: string
 *                 example: "Doe"
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Validation error or user already exists
 */
router.post('/register', validate(registerSchema), authController.register.bind(authController));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Authentication]
 *     description: Get the currently authenticated user's information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information
 *       401:
 *         description: Not authenticated
 */
router.get('/me', authenticate, authController.getCurrentUser.bind(authController));

export default router;

