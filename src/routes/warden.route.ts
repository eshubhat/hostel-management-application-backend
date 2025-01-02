import express from "express";
const router = express.Router();
import { wardenAuth } from "../middleware/authorization.js";
import { createRepresentative } from "../controllers/superadmin.controller.js";

// router.post("/create-", wardenAuth, createRepresentative);

export default router;
