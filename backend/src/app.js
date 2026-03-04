import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import compression from 'compression';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cron from 'node-cron';

// Internal Configs & Middleware
import { validateEnv, getConfig } from './config/envConfig.js';
import { errorHandler } from './middleware/errorHandler.js';
import { pool } from './config/mySQLConfig.js';
import { getRedisClient, isRedisConnected } from './config/redisConfig.js';
import { paperRouter } from './routes/paperRouter.js';
import authRouter from './routes/authRouter.js';
import notificationRouter from './routes/notificationRouter.js';
import { ensureUserColumnsExist, checkSubscriptionExpirations } from './utils/helperFunctions.js';
import { initS3Mapping } from './utils/s3PathHelper.js';

dotenv.config();
validateEnv();

const config = getConfig();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.set('trust proxy', 1);

const port = config.server.port || 8070;

// --- CORS CONFIGURATION ---
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'https://paper-nest.in',
  'https://www.paper-nest.in',
  'http://paper-nest.in',
  'paper-nest.in',
  'www.paper-nest.in',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes('*')) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error(`[CORS BLOCK] Origin '${origin}' was blocked. Allowed: ${allowedOrigins.join(', ')}`);
      callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

// --- MIDDLEWARE ---
app.use(helmet({
  // Allow cross-origin requests to work with our CORS config
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // Content Security Policy — adjust if you serve HTML from the API
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
}));
app.use(cors(corsOptions));
app.use(compression()); // gzip compression for all responses
app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// --- API ROUTES ---
app.use('/api/v1/paper', paperRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/notification', notificationRouter);
app.get('/', (req, res) => {
  res.status(200).send('API Working and Healthy');
});

// --- PROPER HEALTH CHECK ---
app.get('/health', async (req, res) => {
  const start = Date.now();
  const checks = {};

  // Check MySQL
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    checks.mysql = { status: 'ok' };
  } catch (e) {
    checks.mysql = { status: 'error', message: e.message };
  }

  // Check Redis
  if (isRedisConnected()) {
    try {
      const redis = getRedisClient();
      await redis.ping();
      checks.redis = { status: 'ok' };
    } catch (e) {
      checks.redis = { status: 'error', message: e.message };
    }
  } else {
    checks.redis = { status: 'unavailable', message: 'Running without cache' };
  }

  const allOk = Object.values(checks).every(c => c.status === 'ok' || c.status === 'unavailable');
  const statusCode = allOk ? 200 : 503;

  res.status(statusCode).json({
    status: allOk ? 'healthy' : 'degraded',
    uptime: process.uptime(),
    responseTime: `${Date.now() - start}ms`,
    timestamp: new Date().toISOString(),
    checks,
  });
});

// Error Handler (Must be after all API routes)
app.use(errorHandler);

// --- DATABASE & SERVER START ---
process.on('SIGINT', async () => {
  console.log('\nClosing MySQL pool...');
  try {
    await pool.end();
    console.log('MySQL pool closed successfully.');
  } catch (e) {
    console.error('Error closing MySQL pool:', e);
  }
  process.exit(0);
});

app.listen(port, async () => {
  try {
    // Initialize Redis (non-blocking — app still works if Redis is down)
    getRedisClient();

    initS3Mapping();
    await ensureUserColumnsExist();
    console.log('Database initialized successfully.');

    // Cron Job: Daily check at midnight
    cron.schedule('0 0 * * *', async () => {
      console.log('Running daily subscription expiration check...');
      await checkSubscriptionExpirations();
    });

  } catch (error) {
    console.error('Failed to initialize database schema. Check connection/permissions.');
  }
  console.log(`Server started on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
});

export default app;