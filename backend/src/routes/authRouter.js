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
} from '../controllers/authController.js';

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
router.post('/register', upload.single('logo'), adminRegister);

// Admin login
router.post('/login', adminLogin);

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
router.post('/register/student', studentRegister);

// Student login
router.post('/login/student', studentLogin);

export default router;
