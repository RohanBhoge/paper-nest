import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cookieParser from 'cookie-parser';

import { pool } from './config/mySQLConfig.js';
import { paperRouter } from './routes/paperRouter.js';
import authRouter from './routes/authRouter.js';
import notificationRouter from './routes/notificationRouter.js';
import { ensureUserColumnsExist, checkSubscriptionExpirations } from './utils/helperFunctions.js';
import { initS3Mapping } from './utils/s3PathHelper.js';
import cron from 'node-cron';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

/**
 * Middleware Setup
 */
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true // Required for cookies/auth
}));
app.use(cookieParser()); // Parse cookies
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

/**
 * Route Definitions
 */
app.use('/api/v1/paper', paperRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/notification', notificationRouter);

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
  console.error('\n--- ERROR START ---');
  console.error(`[${req.method} ${req.originalUrl}]`);
  console.error(err.stack || err);
  console.error('--- ERROR END ---\n');

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

/**
 * Graceful Shutdown
 */
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

/**
 * Base Route
 */
app.get('/', (req, res) => {
  res.send('API Working');
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Catch-all route to serve credentials
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
});

/**
 * Start Server
 */
app.listen(port, async () => {
  try {
    initS3Mapping(); // Initialize S3 folder mapping
    await ensureUserColumnsExist();
    console.log('Database initialized successfully.');

    // Schedule subscription check every day at midnight
    cron.schedule('0 0 * * *', async () => {
      console.log('Running daily subscription expiration check...');
      await checkSubscriptionExpirations();
    });

  } catch (error) {
    console.error(
      'Failed to initialize database schema. Check connection/permissions.');
  }
  console.log(`Server started on port ${port}`);
});

export default app;
