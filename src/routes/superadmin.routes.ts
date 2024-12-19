import express from "express";
const router = express.Router();
import {superadminAuth} from "../middleware/authorization.js";
import createUser from "../controllers/superadmin.controller.js";

router.post("/createuser",superadminAuth,createUser)

export default router;