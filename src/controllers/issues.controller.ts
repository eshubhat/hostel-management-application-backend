import express, { Request, Response } from "express";
import { Types } from "mongoose";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import crypto from "crypto";
import jwt, { Secret, JwtPayload, VerifyErrors } from "jsonwebtoken";
import { User, Room, Hostel, College, Issue } from "../db/index.js";
import mongoose from "mongoose";

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

const getEmptyRooms = async () => {
  try {
    const emptyRooms = await Room.findOne({
      $or: [
        {
          sharing: "single",
          $expr: { $eq: [{ $size: "$occupants" }, 0] }, // Single room with 0 occupants
        },
        {
          sharing: "double",
          $expr: { $lt: [{ $size: "$occupants" }, 2] }, // Double room with less than 2 occupants
        },
        {
          sharing: "triple",
          $expr: { $lt: [{ $size: "$occupants" }, 3] }, // Triple room with less than 3 occupants
        },
        {
          sharing: "bunker",
          $expr: { $lt: [{ $size: "$occupants" }, 4] }, // Bunker room with less than 4 occupants
        },
      ],
      isAvailable: true, // Ensure the room is marked as available
      sendStatus: "available", // Ensure the sendStatus is 'available'
    })
      .populate("hostel")
      .populate("college")
      .populate("occupants");

    return emptyRooms;
  } catch (err) {
    console.error("Error fetching empty rooms:", err);
    throw err;
  }
};

export const CreateIssue = async (req: Request, res: Response) => {
  try {
    // Extract data from request body
    const { name, roomNumber, floorNumber, tag, description, hostelId } =
      req.body;

    console.log("req.user", req.user);

    // Validate required fields
    if (
      !name ||
      !roomNumber ||
      !floorNumber ||
      !tag ||
      !description ||
      !hostelId
    ) {
      return res.sendStatus(400).json({ message: "All fields are required" });
    }

    // Validate user existence
    const user = await User.findOne({ email: req.user.email }); // Assuming req.user._id contains the user's ID
    if (!user) {
      return res.sendStatus(403).json({ message: "User not eligible" });
    }

    // Create issue
    const issue = new Issue({
      student: {
        name: user.name, // Assuming User model has a "name" field
        registrationNumber: user.registrationNumber, // Assuming User model has a "registrationNumber" field
        roomNumber,
      },
      floorNumber,
      tag,
      description,
      hostel: hostelId, // Assuming `hostelId` is passed in the request
    });

    // Save issue to the database
    await issue.save();

    // Respond with success
    return res
      .sendStatus(201)
      .json({ message: "Issue created successfully", issue });
  } catch (error) {
    console.error("Error creating issue:", error);
    return res.sendStatus(500).json({ message: "Server error", error });
  }
};

export const fetchIssues = async (req: Request, res: Response) => {
  try {
    const role = req.user.role;
    console.log("role", req.user);
    const issues = await Issue.find({
      hostel: new mongoose.Types.ObjectId(req.user.user.hostel as string),
    }).populate("hostel");
    console.log("issues", issues);
    if (role === "warden") {
      return res.sendStatus(200).json(issues);
    } else if (role === "student") {
      const issues = await Issue.find().populate("hostel");
      const filteredIssues = issues.filter((issue: any) => {
        return (
          issue.student.registrationNumber === req.user.user.registrationNumber
        );
      });
      return res.sendStatus(200).json(filteredIssues);
    } else {
      return res
        .sendStatus(403)
        .json({ message: "You are not authorized to view this page" });
    }
  } catch (error) {}
};
