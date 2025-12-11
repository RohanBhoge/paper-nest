import {
  adminRegister,
  adminLogin,
  studentRegister,
  studentLogin,
  deleteUser,
  getAllUsersController,
  handleToggleUserStatus
} from "../controllers/authController.js";
import { Router } from "express";

const router = Router();

// Admin routes
router.post("/register", adminRegister);
router.post("/login", adminLogin);
router.delete("/delete-user", deleteUser);
router.get("/get-users", getAllUsersController);
router.post("/deactivate-user", handleToggleUserStatus);
// Student routes
router.post("/register/student", studentRegister);
router.post("/login/student", studentLogin);

export default router;
