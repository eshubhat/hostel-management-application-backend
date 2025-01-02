import jwt, { Secret, JwtPayload, VerifyErrors } from "jsonwebtoken";
import { roles } from "../utils/constants";
import dotenv from "dotenv";
import { Request, Response, NextFunction, RequestHandler } from "express";
// import { User } from '../db';
dotenv.config();

export const authenticateJwt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) {
    res.status(401).json({ message: "User has not logged in!" });
  } else {
    const token = cookies.jwt;
    if (token) {
      jwt.verify(
        token,
        process.env.JWT_TOKEN_KEY as string,
        (err: VerifyErrors | null, user: any) => {
          if (err) {
            return res
              .status(403)
              .json({ message: "Token has expired!/not valid token" });
          }
          next();
        }
      );
    }
  }
};

interface RequestWithUser extends Request {
  user: any;
}

export const superadminAuth: RequestHandler = (
  req: Request, // Maintain extended Request type
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.jwt;

  if (!token) {
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(
    token,
    process.env.JWT_TOKEN_KEY as string,
    (err: VerifyErrors | null, user: any) => {
      if (err) {
        return res.sendStatus(403); // Forbidden
      }

      if (user.role === roles.superadmin) {
        req.user = user; // Add `user` to the request object
        return next(); // Move to the next middleware
      } else {
        return res.status(401).json({ message: "Unauthorized", user });
      }
    }
  );
};

export const representativeAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const cookies = req.cookies;
  console.log(cookies);
  if (!cookies?.jwt) {
    res.sendStatus(401);
  } else {
    const token = cookies.jwt;
    jwt.verify(
      token,
      process.env.JWT_TOKEN_KEY as string,
      (err: VerifyErrors | null, user: any) => {
        if (err) {
          return res.sendStatus(403);
        }
        if (user.role == roles.representative) {
          req.user = user;
          next();
        } else {
          return res.status(401).json({ message: "Unauthorised" });
        }
      }
    );
  }
};

export const wardenAuth = (req: Request, res: Response, next: NextFunction) => {
  const cookies = req.cookies;
  console.log(cookies);
  if (!cookies?.jwt) {
    res.sendStatus(401);
  } else {
    const token = cookies.jwt;
    jwt.verify(
      token,
      process.env.JWT_TOKEN_KEY as string,
      (err: VerifyErrors | null, user: any) => {
        if (err) {
          return res.sendStatus(403);
        }
        if (user.role == roles.warden) {
          next();
        } else {
          return res.status(401).json({ message: "Unauthorised" });
        }
      }
    );
  }
};

export const userAuth = (req: Request, res: Response, next: NextFunction) => {
  const cookies = req.cookies;
  console.log(cookies);
  if (!cookies?.jwt) {
    res.sendStatus(401);
  } else {
    const token = cookies.jwt;
    jwt.verify(
      token,
      process.env.JWT_TOKEN_KEY as string,
      (err: VerifyErrors | null, user: any) => {
        if (err) {
          return res.sendStatus(403);
        }
        console.log("user", user);
        req.user = user;
        next();
      }
    );
  }
};
