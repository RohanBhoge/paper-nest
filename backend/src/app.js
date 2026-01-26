import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cron from 'node-cron';

// Internal Configs & Middleware
import { validateEnv, getConfig } from './config/envConfig.js';
import { errorHandler } from './middleware/errorHandler.js';
import { pool } from './config/mySQLConfig.js';
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

const port = config.server.port || 8080;

// --- CORS CONFIGURATION ---
const allowedOrigins = process.env.CORS_ORIGIN

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
app.use(cors(corsOptions));
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
app.get('/health', (req, res) => {
  res.status(200).send('API Working and Healthy');
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