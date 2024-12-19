import express from "express";
const router = express.Router();
import {collegeadminAuth} from "../middleware/authorization.js";
import createUser from "../controllers/superadmin.controller.js";

router.get("/createuser",collegeadminAuth,createUser);
export default router;