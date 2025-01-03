import express from "express";
import {
  registerRepresentative,
  registerUser,
  forgotPassword,
  resetPassword,
  firstTimeLogin,
  login,
  logout,
} from "../controllers/authentication.controller.js";
import {
  representativeAuth,
  superadminAuth,
  authenticateJwt,
} from "../middleware/authorization.js";

const router = express.Router();

router.post("/UserRegistration", representativeAuth, registerUser);

router.post(
  "/representativeRegistration",
  superadminAuth,
  registerRepresentative
);

router.post("/first-time-login", authenticateJwt, firstTimeLogin);

router.post("/login", login);

router.post("/forget-password", forgotPassword);

router.post("/resetPassword/:ID/:token", resetPassword);

router.delete("/logout", logout);

export default router;
