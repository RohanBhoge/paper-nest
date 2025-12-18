import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import {
  createUser,
  getUserByEmail,
  createStudent,
  getAdminByUserName,
  getStudentByEmail,
  deleteUserByEmail,
  getAllUsers,
  toggleUserActivationStatus,
} from '../utils/helperFunctions.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Generates a signed URL for an S3 object.
 * @param {string} key - The S3 object key.
 * @returns {Promise<string>} - The signed URL.
 */
const getObjectURL = async (key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });
  const url = await getSignedUrl(s3Client, command, { expiresIn: 7200 });
  return url;
};

/**
 * Handles admin registration.
 */
const register = async (req, res) => {
  try {
    const { email, password, full_name, watermark } = req.body;

    // --- DEBUG LOG START ---
    console.log('--- REGISTER REQUEST ---');
    console.log('Email:', email);
    if (req.file) {
      console.log('File received:', req.file.originalname, 'Size:', req.file.size);
    }
    // --- DEBUG LOG END ---

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    let logoKey = null;

    if (req.file) {
      const file = req.file;
      const fileKey = `logos/${Date.now()}_${file.originalname}`;

      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      try {
        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        console.log('S3 Upload Success:', fileKey);
        logoKey = fileKey;
      } catch (s3Error) {
        console.error('S3 Upload Failed:', s3Error);
      }
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = await createUser(
      email,
      hash,
      full_name || null,
      watermark,
      logoKey
    );

    const token = jwt.sign({ sub: userId }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.status(201).json({
      token,
      user: {
        id: userId,
        email,
        full_name,
        logo: logoKey,
        watermark,
      },
    });
  } catch (err) {
    console.error('Register error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Handles student registration.
 */
const studentRegister = async (req, res) => {
  try {
    const {
      email,
      password,
      organizationName,
      full_name,
      std,
      class: classVal,
    } = req.body;

    if (!email || !password || !organizationName) {
      return res.status(400).json({
        error: 'Email, password, and organization name are required.',
      });
    }

    // 1. Validate & Get Admin ID
    const admin = await getAdminByUserName(organizationName);
    if (!admin) {
      return res
        .status(404)
        .json({ error: 'Organization name (Admin username) not found.' });
    }
    const adminUserId = admin.id;

    // 2. Check for existing email
    const existingAdmin = await getUserByEmail(email);
    if (existingAdmin) {
      return res
        .status(409)
        .json({ error: 'Email already registered as an administrator.' });
    }

    const existingStudent = await getStudentByEmail(email);
    if (existingStudent) {
      return res
        .status(409)
        .json({ error: 'Email already registered as a student.' });
    }

    // 3. Hash password and create student
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const studentId = await createStudent(
      adminUserId,
      email.split('@')[0], // username
      email,
      hash,
      full_name || null,
      std || null,
      classVal || null
    );

    // 4. Generate JWT
    const token = jwt.sign(
      {
        sub: studentId,
        role: 'student',
        adminId: adminUserId,
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
      }
    );

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      token,
      user: {
        id: studentId,
        email,
        full_name,
        role: 'student',
        adminId: adminUserId,
      },
    });
  } catch (err) {
    console.error('Student Register error', err);
    res.status(500).json({ error: 'Server error during student registration' });
  }
};

/**
 * Handles student login.
 */
const studentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await getStudentByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found as student' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign(
      { sub: user.id, role: 'student', adminId: user.user_id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: 'student',
        adminId: user.user_id,
      },
    });
  } catch (err) {
    console.error('Student Login error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Handles admin login.
 */
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ error: 'User not found as admin' });
    }

    if (user.is_active === 0 || user.is_active === false) {
      console.log(`Deactivated user attempted login: ${email}`);
      return res
        .status(401)
        .json({ error: 'Your account is currently deactivated.' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid password' });

    let logoUrl = null;
    if (user.logo) {
      logoUrl = await getObjectURL(user.logo);
    }
    console.log('Generated S3 URL:', logoUrl);

    const token = jwt.sign({ sub: user.id, role: 'admin' }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: 'admin',
        logo_url: logoUrl,
        watermark: user.watermark,
      },
    });
  } catch (err) {
    console.error('Admin Login error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Deletes a user.
 */
const deleteUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required to delete user' });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const deleted = await deleteUserByEmail(email);

    if (deleted === 0) {
      return res.status(500).json({ error: 'Failed to delete user' });
    }

    return res.json({
      success: true,
      message: `User '${email}' deleted successfully`,
    });
  } catch (err) {
    console.error('Delete User error', err);
    return res.status(500).json({ error: 'Server error during deletion' });
  }
};

/**
 * Gets all users.
 */
const getAllUsersController = async (req, res) => {
  try {
    const users = await getAllUsers();

    return res.json({
      success: true,
      total: users.length,
      users,
    });
  } catch (err) {
    console.error('Get All Users error', err);
    return res.status(500).json({ error: 'Server error fetching users' });
  }
};

/**
 * Toggles user activation status.
 */
const handleToggleUserStatus = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'Missing user ID.' });
  }

  try {
    const result = await toggleUserActivationStatus(userId);

    if (result.affectedRows > 0) {
      console.log(`User ID ${userId} status set to: ${result.newStatus}`);
      return res.status(200).json({
        success: true,
        message: `User status successfully changed to ${result.newStatus}.`,
        new_status: result.newStatus,
      });
    } else {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
  } catch (error) {
    console.error('User Status Toggle API Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export {
  register as adminRegister,
  adminLogin,
  studentRegister,
  studentLogin,
  deleteUser,
  getAllUsersController,
  handleToggleUserStatus,
};