import express, { Request, Response } from "express";
import { CreateIssue, fetchIssues } from "../controllers/issues.controller";
import { userAuth } from "../middleware/authorization";

const router = express.Router();

router.post("/issue-creator", userAuth, CreateIssue);

router.get("/fetch-issues", userAuth, fetchIssues);
export default router;
