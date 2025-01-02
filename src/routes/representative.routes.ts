import express, { Request, Response } from "express";
import {
  studentRegistration,
  registerHostel,
  fetchHostels,
} from "../controllers/representative.controller";
import { representativeAuth } from "../middleware/authorization";

const router = express.Router();
router.post("/studentRegistration", representativeAuth, studentRegistration);

router.post("/registerHostel", representativeAuth, registerHostel);

router.get("/fetch-hostels", representativeAuth, fetchHostels);

export default router;
