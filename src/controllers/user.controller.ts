import { Request, Response } from 'express';

interface userRequest extends Request {
  user?: any; // Specify the type of the 'user' property (change 'any' to the actual user type)
}
export const verifyUser = (req: userRequest, res: Response)=>{
    const user = req.user;
    if(user){
      res.status(200).json({message:"User Verified!"});
    }
  }