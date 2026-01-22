import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) console.warn("Warning: JWT_SECRET not set in environment.");

export function requireAuth(req, res, next) {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }

    const payload = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: payload.sub || payload.userId || payload.id,
      role: payload.role,
      adminId: payload.adminId
    };

    if (!req.user.id)
      return res.status(401).json({ error: "Invalid token payload" });
    return next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
        message: 'Please refresh your session'
      });
    }

    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
