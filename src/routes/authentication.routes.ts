import express from "express";
import {
  registerRepresentative,
  registerUser,
  forgotPassword,
  resetPassword,
  login,
  logout,
} from "../controllers/authentication.controller.js";
const router = express.Router();

router.post("/UserRegistration", registerUser);

router.post("/representativeRegistration", registerRepresentative);

router.post("/login", login);

router.post("/passwordreset", forgotPassword);

router.post("/resetPassword/:ID/:token", resetPassword);

router.delete("/logout", logout);

export default router;
