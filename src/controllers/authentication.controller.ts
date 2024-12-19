import express, { Request, Response } from "express"
import { User } from "../db/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from 'cookie-parser';
import nodemailer from "nodemailer";
import { config } from "dotenv";
const app = express()


app.use(cookieParser());

export const usersignup = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    if (email == "" || password == "") {
      return res.status(403).json({ message: "You have not filled the field" })//
    }
    let user = await User.findOne({ email });

    if (user) {
      return res.status(401).json({ message: "User has already been registered" })//
    } else {

      user = new User({ email, password });

      await user.save();

      const token = jwt.sign({ email, role: user.role }, process.env.JWT_TOKEN_KEY as string, { expiresIn: '1d' });
      return res.cookie('jwt', token, {
        httpOnly: true,
        secure: false,// when we will use https we will do it true
        sameSite: 'none',// enables cross-site cookie for now
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      }).json({ message: 'User created successfully', token });
    }

  }
  catch (error) {
    return res.status(500).json({ error });
  }
};


export const userlogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (email == "" || password == "") {
      return res.status(403).json({ message: "You have not filled the field" })//
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: "Username or Password incorrect!" })
    }

    if (user) {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ message: 'Email or password incorrect!' });
      }
      const token = jwt.sign({ email, role: user.role }, process.env.JWT_TOKEN_KEY as string, { expiresIn: '24h' });
      return res.status(200).cookie('jwt', token, {
        httpOnly: true,
        secure: false,// when we will use https we will do it true
        sameSite: 'lax',// enables cross-site cookie for now
        maxAge: 24 * 60 * 60 * 1000,// 1 day
      }).json({ message: 'Logged in successfully!', token });
    }
  } catch (error) {
  }
};

export const forgotPassword = async (req: Request, res: Response) => {

  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Email not found!" });
    }

    const token = jwt.sign({ email }, process.env.JWT_TOKEN_KEY as string, { expiresIn: '10m' });
    // console.log(token+'\n'+user._id);
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.OFFICIAL_EMAIL,
        pass: process.env.OFFICIAL_EMAIL_PASSWORD
      }
    });

    const mailOption = {
      from: process.env.OFFICIAL_EMAIL,
      to: email,
      Subject: "Reset Your password: Important Information for Website Access",
      text: `Dear ${user.first_name},

      
      To reset your password, please follow the link below:
      
      http://${process.env.DOMAIN_NAME}/auth/resetPassword/${user._id}/${token}


      devuse:http://localhost:3000/auth/resetPassword/${user._id}/${token}
      
      If you encounter any difficulties or have any questions, please don't hesitate to reach out to our support team at [support@email.com].
      
      Thank you for your cooperation in this matter.
      
      Best regards,
      Team ClubHouse.`

    }

    transporter.sendMail(mailOption, (err, info) => {
      if (err) {
        res.json(err);
      } else {
        return res.status(200).json({ message: "Email sent successfully" });
      }
    })
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong, Please try again' })
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { ID, token } = req.params;
    const { password } = req.body;

    const user = await User.findById(ID);

    if (user) {

      user.password = password;
      await user.save();

      return res.status(200).json({ message: "password changed" });
    } else {
      return res.status(404).json({ message: "User not found" });

    }
  } catch (error) {
    return res.status(500).json({ error });
  }
}

export const logout = (req: Request, res: Response) => {
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: false,// when we will use https we will do it true
    sameSite: 'lax',// enables cross-site cookie for now
    maxAge: 24 * 60 * 60 * 1000,// 1 day

  }).json({ message: "User logged out" });
}