import jwt, { Secret, JwtPayload, VerifyErrors } from 'jsonwebtoken';
import { roles } from "../utils/constants";
import dotenv from "dotenv";
import { Request, Response, NextFunction } from 'express';
// import { User } from '../db';
dotenv.config();

export const authenticateJwt = async (req: Request, res: Response, next: NextFunction) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) {
    res.status(401).json({ message: "User has not logged in!" });
  } else {
    const token = cookies.jwt;
    if (token) {
      jwt.verify(token, process.env.JWT_TOKEN_KEY as string, (err: VerifyErrors | null, user:any) => {
        if (err) {
          return res.status(403).json({ message: "Token has expired!/not valid token" });
        }
        next();
      })
    };
  }
};

export const superadminAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.jwt;
  console.log(token);
  if (!token) {
    res.sendStatus(401);
  } else {
    jwt.verify(token, process.env.JWT_TOKEN_KEY as string, (err: VerifyErrors | null, user:any) => {
      if (err) {
        return res.sendStatus(403);
      }
      if (user.role == roles.superadmin) {
        req.body = user;
        console.log("I am returning true");
        next();
        res.status(200).json({ message: "true", user, token });
      }
      else {
        return res.status(401).json({ message: "Unauthorised" });
      }
    });
  }
  return false;
}


export const collegeadminAuth = (req: Request, res: Response, next: NextFunction) => {
  const cookies = req.cookies;
  console.log(cookies);
  if (!cookies?.jwt) {
    res.sendStatus(401);
  } else {
    const token = cookies.jwt;
    jwt.verify(token, process.env.JWT_TOKEN_KEY as string, (err: VerifyErrors | null, user:any) => {
      if (err) {
        return res.sendStatus(403);
      }
      if (user.role == roles.collegeadmin) {
        next();
      }
      else {
        return res.status(401).json({ message: "Unauthorised" });
      }
    });
  }
}
