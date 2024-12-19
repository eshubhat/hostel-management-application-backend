import express from "express";
import { usersignup, userlogin, forgotPassword, resetPassword ,logout} from "../controllers/authentication.controller.js";
const router = express.Router();

router.post('/signup',usersignup);

router.post('/login', userlogin);

router.post('/passwordreset', forgotPassword);

router.post('/resetPassword/:ID/:token', resetPassword);

router.delete('/logout', logout);

export default router;