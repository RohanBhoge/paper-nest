import express from 'express';
import {
  createNotification,
  getAllNotifications,
} from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const notificationRouter = express.Router();

/**
 * Notification Routes
 */

// Create a new notification (Admin only)
notificationRouter.post(
  '/store-notification',
  requireAuth,
  createNotification
);

// Get all notifications for the user's organization
notificationRouter.get(
  '/getAll-notification',
  requireAuth,
  getAllNotifications
);

export default notificationRouter;