import { generatePassword } from "../utils/passwordGenerator.js";
import { User } from "../db/index.js";
import { roles } from "../utils/constants.js";
import cookieParser from "cookie-parser";
import express from "express";
import { Request, Response } from 'express';
const app = express();

app.use(cookieParser());

const createUser = async (req: Request, res: Response) => {

    const email = req.body.email;
    const user = await User.findOne({ email });

    if (user) {
        return res.send(403).json({ message: "User Already exist" });
    }
    const password = generatePassword();
    console.log(password);
    const newUser = new User({ email, password, role: roles.hostelOccupant, signup_key: 0 });
    await newUser.save();
    return res.status(201).json({ message: "User created successfully" });
}
//how to delete a user
export default createUser;