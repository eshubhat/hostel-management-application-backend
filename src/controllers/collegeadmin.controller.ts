import { generatePassword } from "../utils/passwordGenerator.js";
import { User } from "../db/index.js";
import { roles } from "../utils/constants.js";
import { Request, Response } from 'express';

const createUser = async (req: Request, res: Response) => {
    const email = req.body;
    const user = await User.findOne({ email });

    if (user) {
        return res.sendStatus(403).json({ message: "User Already exist" });
    }
    const password = generatePassword();
    console.log(password);
    const newUser = new User({ email, password, role: roles.hostelOccupant });
    newUser.save();
    res.sendStatus(201).json({ message: "User created successfully" });
}

export default createUser;