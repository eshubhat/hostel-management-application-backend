// import { generatePassword } from "../utils/passwordGenerator.js";
// import mongoose, { Types } from "mongoose";
// import { User, College } from "../db/index.js";
// import { roles } from "../utils/constants.js";
// import nodemailer from "nodemailer";
// import cookieParser from "cookie-parser";
// import bcrypt from "bcrypt";
// import crypto from "crypto";
// import express from "express";
// import { Request, Response } from "express";
// const app = express();

// app.use(cookieParser());

// const sendEmail = async (email: string, subject: string, html: string) => {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.OFFICIAL_EMAIL,
//       pass: process.env.OFFICIAL_EMAIL_PASSWORD,
//     },
//   });

//   const mailOptions = {
//     from: process.env.OFFICIAL_EMAIL,
//     to: email,
//     subject,
//     html,
//   };

//   return transporter.sendMail(mailOptions);
// };

// export const markAttendance = async (req: Request, res: Response) => {
//   try {
//     const { studentId, status } = req.body;
//     const student = await User.findById(studentId);

//     if (!student) {
//       return res.status(404).json({ message: "Student not found" });
//     }

//     const today = new Date();
//     today.setHours(0, 0, 0, 0); // Normalize to start of day

//     // Check if attendance for today already exists
//     const attendanceExists = student.attendance?.some(
//       (record) => record.date.getTime() === today.getTime()
//     );

//     if (attendanceExists) {
//       return res.status(400).json({ message: "Attendance already marked for today" });
//     }

//     // Add attendance record
//     student.attendance = student.attendance || [];
//     student.attendance.push({ date: today, status });

//     await student.save();

//     return res.status(200).json({ message: "Attendance marked successfully" });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// };

// export const getAttendanceHistory = async (req: Request, res: Response) => {
//   try {
//     const { studentId } = req.params;
//     const student = await User.findById(studentId);

//     if (!student) {
//       return res.status(404).json({ message: "Student not found" });
//     }

//     return res.status(200).json({ attendance: student.attendance });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// };
