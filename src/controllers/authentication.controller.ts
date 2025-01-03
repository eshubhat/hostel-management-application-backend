import express, { Request, Response } from "express";
import { User } from "../db/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import nodemailer from "nodemailer";
import { config } from "dotenv";
import crypto from "crypto"; // For generating random passwords
import { roles } from "../utils/constants.js";

const app = express();

app.use(cookieParser());

// Helper function to send emails
const sendEmail = async (email: string, subject: string, text: string) => {
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
    text,
  };

  return transporter.sendMail(mailOptions);
};

// SuperAdmin registers a representative
export const registerRepresentative = async (req: Request, res: Response) => {
  try {
    const { email, collegeId } = req.body;

    if (!email) {
      return res.sendStatus(403).json({ message: "Email is required" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.sendStatus(401).json({ message: "User already registered" });
    }

    const tempPassword = crypto.randomBytes(3).toString("hex"); // Generate 5-digit random password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const representative = new User({
      email,
      password: hashedPassword,
      role: "representative",
      isFirstLogin: true, // Mark as first login
      college: collegeId,
    });

    await representative.save();

    const emailText = `Welcome to our platform!
      
      Your temporary password is: ${tempPassword}
      
      Please log in and change your password.

      Best regards,
      Team HostelManagement.`;

    await sendEmail(email, "Your Temporary Password", emailText);

    return res
      .sendStatus(201)
      .json({ message: "Representative registered successfully" });
  } catch (error) {
    return res.sendStatus(500).json({ error });
  }
};

// First-time login handler
export const firstTimeLogin = async (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body;
    const { email } = req.user;
    console.log(email, newPassword);

    if (!newPassword) {
      return res.status(403).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isFirstLogin) {
      return res.status(400).json({ message: "Not a first-time login" });
    }

    // user.password = await bcrypt.hash(newPassword, 10);
    user.password = newPassword;
    user.isFirstLogin = false; // Reset the first login flag
    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ error });
  }
};

// Representative registers warden or student
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, role, collegeId } = req.body;

    if (!email || !["warden", "student"].includes(role)) {
      return res.sendStatus(403).json({ message: "Invalid input" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.sendStatus(401).json({ message: "User already registered" });
    }

    const tempPassword = crypto.randomBytes(3).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      role,
      isFirstLogin: true,
      college: collegeId,
    });

    await newUser.save();

    const emailText = `Welcome to our platform!
      
      Your temporary password is: ${tempPassword}
      
      Please log in and change your password.

      Best regards,
      Team ClubHouse.`;

    await sendEmail(email, "Your Temporary Password", emailText);

    return res
      .sendStatus(201)
      .json({ message: `${role} registered successfully` });
  } catch (error) {
    return res.sendStatus(500).json({ error });
  }
};

// General login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    let isFirstLogin = false;
    console.log(email, password);

    if (!email || !password) {
      console.log("Email and password are required");
      return res
        .status(401)
        .json({ message: "Email and password are required" });
    }

    if (
      email === process.env.SUPERADMIN_EMAIL &&
      password === process.env.SUPERADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        { email, role: roles.superadmin },
        process.env.JWT_TOKEN_KEY as string,
        { expiresIn: "1d" }
      );

      return res
        .cookie("jwt", token, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          maxAge: 24 * 60 * 60 * 1000,
        })
        .json({ message: "Login successful", token });
    }

    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password as string))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.isFirstLogin) {
      isFirstLogin = true;
    }

    const token = jwt.sign(
      { email, user, role: user.role, collegeId: user?.college },
      process.env.JWT_TOKEN_KEY as string,
      { expiresIn: "1d" }
    );

    return res
      .cookie("jwt", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      })
      .json({ message: "Login successful", token, isFirstLogin });
  } catch (error) {
    return res.status(500).json({ error });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { ID, token } = req.params;
    const { password } = req.body;

    const user = await User.findById(ID);

    if (user) {
      user.password = password;
      await user.save();

      return res.sendStatus(200).json({ message: "password changed" });
    } else {
      return res.sendStatus(404).json({ message: "User not found" });
    }
  } catch (error) {
    return res.sendStatus(500).json({ error });
  }
};

export const logout = (req: Request, res: Response) => {
  res
    .clearCookie("jwt", {
      httpOnly: true,
      secure: false, // when we will use https we will do it true
      sameSite: "lax", // enables cross-site cookie for now
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    })
    .json({ message: "User logged out" });
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.sendStatus(401).json({ message: "Email not found!" });
    }

    const token = jwt.sign({ email }, process.env.JWT_TOKEN_KEY as string, {
      expiresIn: "10m",
    });
    // console.log(token+'\n'+user._id);
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.OFFICIAL_EMAIL,
        pass: process.env.OFFICIAL_EMAIL_PASSWORD,
      },
    });

    const mailOption = {
      from: process.env.OFFICIAL_EMAIL,
      to: email,
      Subject: "Reset Your password: Important Information for Website Access",
      text: `Dear ${user.name},

      
      To reset your password, please follow the link below:
      
      http://${process.env.DOMAIN_NAME}/auth/resetPassword/${user._id}/${token}


      devuse:http://localhost:3000/auth/resetPassword/${user._id}/${token}
      
      If you encounter any difficulties or have any questions, please don't hesitate to reach out to our support team at [support@email.com].
      
      Thank you for your cooperation in this matter.
      
      Best regards,
      Team ClubHouse.`,
    };

    transporter.sendMail(mailOption, (err, info) => {
      if (err) {
        res.json(err);
      } else {
        return res.sendStatus(200).json({ message: "Email sent successfully" });
      }
    });
  } catch (error) {
    return res
      .sendStatus(500)
      .json({ message: "Something went wrong, Please try again" });
  }
};
