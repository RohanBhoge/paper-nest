import * as authService from '../services/authService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getConfig } from '../config/envConfig.js';

const config = getConfig();

// 💡 Auth Cookies setup
const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = config.server.isProduction || process.env.NODE_ENV === 'production' || !!process.env.AWS_REGION;

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction ? true : false,
    sameSite: isProduction ? 'none' : 'lax',
  };

  res.cookie('access_token', accessToken, {
    ...cookieOptions,
    maxAge: 21 * 60 * 60 * 1000
  });

  res.cookie('refresh_token', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
};


export const adminRegister = asyncHandler(async (req, res) => {
  const { email, password, full_name, watermark } = req.body;

  try {
    const result = await authService.registerAdmin(
      email,
      password,
      full_name,
      watermark,
      req.file
    );

    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(201).json(
      ApiResponse.success(
        {
          id: result.userId,
          email: result.email,
          full_name: result.fullName,
          logo: result.logoKey,
          watermark: result.watermark,
        },
        'Registration successful'
      )
    );
  } catch (error) {
    if (error.message === 'Email already registered') {
      throw ApiError.conflict(error.message);
    }
    if (error.message === 'Email and password required') {
      throw ApiError.badRequest(error.message);
    }
    throw error;
  }
});

export const studentRegister = asyncHandler(async (req, res) => {
  const { email, password, organizationName, full_name, std, class: classVal } = req.body;

  try {
    const result = await authService.registerStudent(
      email,
      password,
      organizationName,
      full_name,
      std,
      classVal
    );

    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(201).json(
      ApiResponse.success(
        {
          id: result.studentId,
          email: result.email,
          full_name: result.fullName,
          role: 'student',
          adminId: result.adminUserId,
        },
        'Student registered successfully'
      )
    );
  } catch (error) {
    if (error.message.includes('already registered')) {
      throw ApiError.conflict(error.message);
    }
    if (error.message.includes('not found')) {
      throw ApiError.notFound(error.message);
    }
    if (error.message.includes('required')) {
      throw ApiError.badRequest(error.message);
    }
    throw error;
  }
});

export const studentLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await authService.loginStudent(email, password);

    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.json(
      ApiResponse.success(result.user, 'Login successful')
    );
  } catch (error) {
    if (error.message === 'User not found as student') {
      throw ApiError.notFound(error.message);
    }
    if (error.message === 'Invalid password') {
      throw ApiError.unauthorized(error.message);
    }
    if (error.message === 'Email and password required') {
      throw ApiError.badRequest(error.message);
    }
    throw error;
  }
});

export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await authService.loginAdmin(email, password);

    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.json(
      ApiResponse.success(
        {
          id: result.user.id,
          email: result.user.email,
          full_name: result.user.fullName,
          role: result.user.role,
          logo_url: result.user.logoUrl,
          watermark: result.user.watermark,
          subscription_end_date: result.user.subscriptionEndDate,
          remaining_days: result.user.remainingDays,
        },
        'Login successful'
      )
    );
  } catch (error) {
    if (error.message === 'User not found as admin') {
      throw ApiError.notFound(error.message);
    }
    if (error.message === 'Invalid password') {
      throw ApiError.unauthorized(error.message);
    }
    if (error.message.includes('deactivated')) {
      throw ApiError.unauthorized(error.message);
    }
    if (error.message === 'Email and password required') {
      throw ApiError.badRequest(error.message);
    }

    throw error;
  }
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { email } = req.body;

  try {
    const result = await authService.removeUser(email);

    res.json(
      ApiResponse.success(
        null,
        `User '${result.email}' deleted successfully`
      )
    );
  } catch (error) {
    if (error.message === 'User not found') {
      throw ApiError.notFound(error.message);
    }
    if (error.message === 'Email is required to delete user') {
      throw ApiError.badRequest(error.message);
    }
    if (error.message === 'Failed to delete user') {
      throw ApiError.internal(error.message);
    }
    throw error;
  }
});

export const getAllUsersController = asyncHandler(async (req, res) => {
  const users = await authService.listAllUsers();

  res.json(
    ApiResponse.success(
      users,
      'Users fetched successfully'
    )
  );
});

export const handleToggleUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  try {
    const result = await authService.toggleUserStatus(userId);

    res.json(
      ApiResponse.success(
        { new_status: result.newStatus },
        result.message
      )
    );
  } catch (error) {
    if (error.message === 'User not found') {
      throw ApiError.notFound(error.message);
    }
    if (error.message === 'Missing user ID') {
      throw ApiError.badRequest(error.message);
    }
    throw error;
  }
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refresh_token;

  try {
    const result = await authService.refreshAccessToken(refreshToken);

    // Determine production status
    const isProd = config.server.isProduction || process.env.NODE_ENV === 'production';

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 21 * 60 * 60 * 1000,
    });

    res.json(ApiResponse.success(null, 'Token refreshed'));
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }
    if (error.message === 'No refresh token provided') {
      throw ApiError.unauthorized(error.message);
    }
    throw error;
  }
});

export const logout = asyncHandler(async (req, res) => {
  clearAuthCookies(res);
  res.json(ApiResponse.success(null, 'Logged out successfully'));
});