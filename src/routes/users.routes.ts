import express from "express";
import { authenticateJwt } from "../middleware/authorization.js";
import { User, College } from "../db/index.js";
import { verifyUser, getRole } from "../controllers/user.controller.js";
const router = express.Router();

router.get("/verifyuser", authenticateJwt, verifyUser);

router.get("/get-role", authenticateJwt, getRole);
// router.post("/create-issue", async (req, res) => {
//   const { issue } = req.body;
// });

export default router;
