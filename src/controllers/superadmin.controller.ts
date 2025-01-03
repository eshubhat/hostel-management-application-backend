import { generatePassword } from "../utils/passwordGenerator.js";
import mongoose, { Types } from "mongoose";
import { User, College } from "../db/index.js";
import { roles } from "../utils/constants.js";
import nodemailer from "nodemailer";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import crypto from "crypto";
import express from "express";
import { Request, Response } from "express";
const app = express();

app.use(cookieParser());

const sendEmail = async (email: string, subject: string, html: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.OFFICIAL_EMAIL,
      pass: process.env.OFFICIAL_EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.OFFICIAL_EMAIL,
    to: email,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
};

export const createRepresentative = async (req: Request, res: Response) => {
  const { email, name } = req.body;
  console.log(email);
  const user = await User.findOne({ email });

  if (user) {
    return res.send(401).json({ message: "User Already exist" });
  }
  const password = generatePassword();
  console.log(password);
  const newUser = new User({
    name,
    email,
    password,
    role: roles.representative,
    registrationNumber: new mongoose.Types.ObjectId(),
  });
  await newUser.save();
  return res.sendStatus(201).json({ message: "User created successfully" });
};
//how to delete a user

export const createCollege = async (req: Request, res: Response) => {
  const { collegeName, representativeEmail } = req.body;
  console.log(collegeName, representativeEmail);
  const college = await College.findOne({ name: collegeName });

  if (college) {
    return res.status(403).json({ message: "College Already exist" });
  }

  let user = await User.findOne({ email: representativeEmail });
  let tempPassword = "";
  if (!user) {
    console.log("User not found");
    tempPassword = crypto.randomBytes(3).toString("hex");
    console.log(tempPassword);
    const newUser = new User({
      email: representativeEmail,
      role: roles.representative,
      password: tempPassword,
      college: new mongoose.Types.ObjectId(),
      registrationNumber: new mongoose.Types.ObjectId(),
    });

    user = newUser;
  }
  // Send email to the new warden
  const htmlTemplate = `
  <html>
    <body>
      <h2>Welcome to Hostel Management System</h2>
      <p>Dear Warden,</p>
      <p>You have been registered as a representative for the college "<strong>${collegeName}</strong>".</p>
      <p>Please use the following credentials to log in for the first time:</p>
      <ul>
        <li><strong>Email:</strong> ${representativeEmail}</li>
        <li><strong>Password:</strong> ${tempPassword}</li>
      </ul>
      <p>It is recommended to change your password after logging in.</p>
      <p>Best Regards,<br>Hostel Management System</p>
    </body>
  </html>
`;

  await sendEmail(
    representativeEmail,
    `Welcome to ${collegeName} as a college Admin`,
    htmlTemplate
  );

  const newCollege = new College({
    name: collegeName,
    representative: user._id,
  });
  await newCollege.save();
  user.college = newCollege._id as Types.ObjectId;

  user.save();

  return res
    .status(201)
    .json({ message: "College and Representative created successfully" });
};
