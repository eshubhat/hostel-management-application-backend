import express from "express";
const router = express.Router();
import { superadminAuth } from "../middleware/authorization.js";
import {
  createRepresentative,
  createCollege,
} from "../controllers/superadmin.controller.js";

router.post("/create-representative", superadminAuth, createRepresentative);

router.post("/create-college", superadminAuth, createCollege);

export default router;
