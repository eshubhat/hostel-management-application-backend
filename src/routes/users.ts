import express from "express";
import { authenticateJwt } from "../middleware/authorization.js";
import { User, College } from "../db/index.js";
import { verifyUser } from "../controllers/user.controller.js";
const router = express.Router();

router.get("/verifyuser", authenticateJwt, verifyUser);

export default router;
