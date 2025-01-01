import express from "express";
const router = express.Router();
import { representativeAuth } from "../middleware/authorization.js";
import createUser from "../controllers/superadmin.controller.js";

router.get("/createuser", representativeAuth, createUser);
export default router;
