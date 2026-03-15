import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import logger from './utils/logger';
import { setupSwagger } from './config/swagger';

// Routes
import authRoutes from './routes/auth.routes';
import milkRoutes from './routes/milk.routes';
import milkPriceRoutes from './routes/milk-price.routes';
import driverRoutes from './routes/driver.routes';
import driverAdminRoutes from './routes/driver-admin.routes';
import dairyCenterRoutes from './routes/dairy-center.routes';
import paymentRoutes from './routes/payment.routes';
import milkCollectionAdminRoutes from './routes/milk-collection-admin.routes';
import reportRoutes from './routes/report.routes';
import centerMilkPriceRoutes from './routes/center-milk-price.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps, curl requests, or Swagger UI)
    if (!origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:3000', // Swagger UI
      'http://localhost:3001', // Admin Panel
      'http://localhost:3002', // Driver/Center Panel
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      // Any Vercel deployment (production + preview)
      /^https:\/\/[a-z0-9-_.]+\.vercel\.app$/,
    ];
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // Allow Vercel preview/production origins
    if (allowedOrigins.some((o) => (typeof o === 'string' ? o === origin : (o as RegExp).test(origin || '')))) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// CORS Middleware - must be before routes
// This automatically handles OPTIONS preflight requests
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Explicitly handle preflight for all routes

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    origin: req.get('origin'),
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Akshaya Dairy API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Akshaya Dairy API',
    version: '1.0.0',
    docs: `http://localhost:${PORT}/api-docs`,
    health: `http://localhost:${PORT}/health`,
  });
});

// App URLs for the landing page (set ADMIN_APP_URL and DRIVER_APP_URL in Vercel env)
app.get('/app-urls', (req, res) => {
  res.json({
    success: true,
    adminUrl: process.env.ADMIN_APP_URL || null,
    driverUrl: process.env.DRIVER_APP_URL || null,
  });
});

// Redirect trailing slash so Swagger UI asset paths resolve (fixes blank /api-docs/ on Vercel)
app.get('/api-docs/', (req, res) => res.redirect(301, '/api-docs'));

// Swagger Documentation
setupSwagger(app);

// Ensure MongoDB is connected for all /api routes (serverless-friendly: lazy connect, 503 if unavailable)
app.use('/api', async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (err) {
    logger.error('API request blocked: database unavailable', { error: err });
    res.status(503).json({
      success: false,
      message: 'Database unavailable. If on Vercel, set MONGODB_URI in Project Settings → Environment Variables.',
      ...(process.env.NODE_ENV !== 'production' && { detail: (err as Error).message }),
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/milk', milkRoutes);
app.use('/api/milk', milkCollectionAdminRoutes);
app.use('/api/milk', centerMilkPriceRoutes);
app.use('/api/milk-price', milkPriceRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/driver-admin', driverAdminRoutes);
app.use('/api/centers', dairyCenterRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reports', reportRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Connect to MongoDB (for both local server and Vercel serverless)
if (process.env.NODE_ENV !== 'test') {
  connectDatabase().catch((err) => {
    logger.error('MongoDB connection failed', { error: err });
    if (!process.env.VERCEL) process.exit(1);
  });
}

// Start HTTP server only when not in test and not on Vercel (Vercel runs app as serverless)
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  connectDatabase()
    .then(() => {
      const server = app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`Swagger API Documentation: http://localhost:${PORT}/api-docs`);
        console.log('\n🚀 Server is running!');
        console.log(`📚 Swagger API Documentation: http://localhost:${PORT}/api-docs`);
        console.log(`🏥 Health Check: http://localhost:${PORT}/health\n`);
      });
      server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          logger.error(`Port ${PORT} is already in use. Stop the other process or set PORT in .env.`);
          console.error(`\n❌ Port ${PORT} is already in use. Close the app using that port or run on another PORT (e.g. set PORT=3003 in .env).\n`);
        } else {
          logger.error('Server error', { error: err });
        }
        process.exit(1);
      });
    })
    .catch((err) => {
      logger.error('Failed to start server', { error: err });
      process.exit(1);
    });
}

export default app;

