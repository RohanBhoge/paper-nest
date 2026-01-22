import { Router } from 'express';
import multer from 'multer';

import {
  adminRegister,
  adminLogin,
  studentRegister,
  studentLogin,
  deleteUser,
  getAllUsersController,
  handleToggleUserStatus,
  refresh,
  logout,
} from '../controllers/authController.js';

import { validate } from '../middleware/validate.js';
import {
  adminLoginSchema,
  studentLoginSchema,
  adminRegisterSchema,
  studentRegisterSchema
} from '../validators/authValidator.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimiter.js';

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const router = Router();

/**
 * Admin Routes
 */
// Register new admin with optional logo upload
router.post('/register', registerLimiter, upload.single('logo'), validate(adminRegisterSchema), adminRegister);

// Admin login
router.post('/login', loginLimiter, validate(adminLoginSchema), adminLogin);

// Delete user by email
router.delete('/delete-user', deleteUser);

// Get all users
router.get('/get-users', getAllUsersController);

// Toggle user activation status
router.post('/deactivate-user', handleToggleUserStatus);

/**
 * Student Routes
 */
// Register new student under an organization
router.post('/register/student', registerLimiter, validate(studentRegisterSchema), studentRegister);

// Student login
router.post('/login/student', loginLimiter, validate(studentLoginSchema), studentLogin);

/**
 * Token Management Routes
 */
// Refresh access token
router.post('/refresh', refresh);

// Logout (clear cookies)
router.post('/logout', logout);

export default router;



