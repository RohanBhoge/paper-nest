import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { pool } from './config/mySQLConfig.js';
import { paperRouter } from './routes/paperRouter.js';
import authRouter from './routes/authRouter.js';
import notificationRouter from './routes/notificationRouter.js';
import { ensureUserColumnsExist } from './utils/helperFunctions.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

/**
 * Middleware Setup
 */
app.use(cors());
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
    await ensureUserColumnsExist();
    console.log('Database initialized successfully.');
  } catch (error) {
    console.error(
      'Failed to initialize database schema. Check connection/permissions.');
  }
  console.log(`Server started on port ${port}`);
});

export default app;
