import express, { Request, Response } from "express";
import { Types } from "mongoose";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import crypto from "crypto";
import jwt, { Secret, JwtPayload, VerifyErrors } from "jsonwebtoken";
import { User, Room, Hostel, College } from "../db/index.js";
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

// const findAvailableRoom = async (
//   hostelId: Types.ObjectId,
//   roomType: string
// ) => {
//   // First, let's check if any rooms exist with these basic criteria
//   const hostelIdObject = new mongoose.Types.ObjectId(hostelId);
//   console.log("Search criteria:", {
//     hostel: hostelIdObject,
//     sharing: roomType,
//   });

//   const roomCount = await Room.find({
//     hostel: hostelIdObject,
//     sharing: String(roomType),
//   });

//   console.log("roomCount", roomCount);

//   console.log(`Found ${roomCount} total rooms of type ${roomType} in hostel`);

//   const maxOccupantsForSharingType = (roomType: string): number => {
//     switch (roomType) {
//       case "single":
//         return 1;
//       case "double":
//         return 2;
//       case "triple":
//         return 3;
//       case "bunker":
//         return 4;
//       default:
//         throw new Error("Invalid room type");
//     }
//   };

//   const room = await Room.findOne({
//     hostel: hostelId,
//     sharing: roomType,
//     status: "available", // Use status instead of isAvailable
//     $expr: {
//       $lt: [{ $size: "$occupants" }, maxOccupantsForSharingType(roomType)],
//     },
//   })
//     .populate("hostel")
//     .populate("college")
//     .populate("occupants");

//   console.log("hi");
//   if (room) {
//     console.log(
//       `Found room ${room.number} with ${room.occupants.length} occupants`
//     );
//   }

//   return room;
// };

export const studentRegistration = async (req: Request, res: Response) => {
  try {
    const { studentName, email, hostelType, selectedHostel, roomType } =
      req.body;

    // Validate required fields
    if (!email || !studentName || !hostelType || !selectedHostel || !roomType) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate room type
    if (!["single", "double", "triple", "bunker"].includes(roomType)) {
      return res.status(400).json({ message: "Invalid room type" });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already registered" });
    }

    const hostelFound = await Hostel.findById(selectedHostel);
    if (!hostelFound) {
      return res.status(400).json({ message: "Hostel not found" });
    }

    // Find an available room
    const emptyRoom = await findAvailableRoom(
      hostelFound._id as Types.ObjectId,
      roomType
    );
    if (!emptyRoom) {
      return res.status(404).json({
        message: "No available rooms found",
        details: `No ${roomType} rooms available in the selected hostel`,
      });
    }

    // Generate a temporary password
    const tempPassword = crypto.randomBytes(3).toString("hex");

    // Create the new user
    const newUser = new User({
      name: studentName,
      email,
      password: tempPassword,
      registrationNumber: new mongoose.Types.ObjectId(),
      hostel: hostelFound._id,
      roomNumber: emptyRoom.number.toString(),
      isFirstLogin: true,
      isProfileComplete: false,
    });

    // Save the user first
    await newUser.save();

    try {
      // Update the room with the new occupant
      const maxOccupants = maxOccupantsForSharingType(roomType);

      const updatedRoom = await Room.findOneAndUpdate(
        {
          _id: emptyRoom._id,
          status: "available",
          $expr: { $lt: [{ $size: "$occupants" }, maxOccupants] }, // Validate array length dynamically
        },
        {
          $push: { occupants: newUser._id },
          $set: {
            status:
              emptyRoom.occupants.length + 1 >= maxOccupants
                ? "occupied"
                : "available",
            isAvailable:
              emptyRoom.occupants.length + 1 >= maxOccupants ? false : true,
          },
        },
        { new: true }
      );

      console.log(updatedRoom);

      if (!updatedRoom) {
        // If room update fails, delete the user and throw error
        await User.findByIdAndDelete(newUser._id);
        return res.status(409).json({
          message: "Room no longer available. Please try again.",
        });
      }

      // Send the welcome email
      const htmlTemplate = `
        <html>
          <body>
            <h2>Welcome to the Hostel Management System</h2>
            <p>Dear ${studentName},</p>
            <p>Your account has been created successfully.</p>
            <p>Please use the following credentials to log in:</p>
            <ul>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Password:</strong> ${tempPassword}</li>
            </ul>
            <p>It is recommended to change your password after logging in.</p>
            <p>Best Regards,<br>Hostel Management Team</p>
          </body>
        </html>
      `;

      await sendEmail(
        email,
        "Welcome to the Hostel Management System",
        htmlTemplate
      );

      return res.status(201).json({
        message: "User registered successfully",
        roomNumber: updatedRoom.number,
        floor: updatedRoom.floor,
      });
    } catch (error) {
      // If anything fails after user creation, cleanup the user
      await User.findByIdAndDelete(newUser._id);
      throw error;
    }
  } catch (error) {
    console.error("Error during student registration:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

// Helper function for max occupants
const maxOccupantsForSharingType = (
  roomType: "single" | "double" | "triple" | "bunker"
): number => {
  const map = {
    single: 1,
    double: 2,
    triple: 3,
    bunker: 6,
  };

  if (!(roomType in map)) throw new Error("Invalid room type");

  return map[roomType];
};

// Helper function to find available rooms
const findAvailableRoom = async (
  hostelId: Types.ObjectId,
  roomType: string
) => {
  return await Room.findOne({
    hostel: hostelId,
    sharing: roomType,
    isAvailable: true,
    status: "available",
  }).sort({ number: 1 }); // Sort by room number for consistency
};

export const registerHostel = async (req: Request, res: Response) => {
  try {
    const { hostelName, hostelType, totalFloor, wardenEmail, sharingTypes } =
      req.body;

    // Extract college from the decoded token
    const collegeId = req.user.collegeId;
    console.log("collegeId", req.user);

    // Validate inputs
    if (
      !hostelName ||
      !hostelType ||
      !totalFloor ||
      !wardenEmail ||
      !collegeId
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Fetch college details
    const college = await College.findById(
      new mongoose.Types.ObjectId(collegeId as string)
    );
    if (!college) {
      return res.status(404).json({ message: "College not found" });
    }

    const institutionName = college.name;

    // Check if warden exists
    let warden = await User.findOne({ email: wardenEmail });

    if (!warden) {
      // Generate a random 5-digit password for the new warden
      const tempPassword = Math.random().toString().slice(2, 7);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Create a new warden
      warden = new User({
        email: wardenEmail,
        role: "warden",
        college: collegeId,
        password: hashedPassword,
      });

      // Send email to the new warden
      const htmlTemplate = `
        <html>
          <body>
            <h2>Welcome to ${institutionName}</h2>
            <p>Dear Warden,</p>
            <p>You have been registered as a warden for the hostel "<strong>${hostelName}</strong>".</p>
            <p>Please use the following credentials to log in for the first time:</p>
            <ul>
              <li><strong>Email:</strong> ${wardenEmail}</li>
              <li><strong>Password:</strong> ${tempPassword}</li>
            </ul>
            <p>It is recommended to change your password after logging in.</p>
            <p>Best Regards,<br>${institutionName}</p>
          </body>
        </html>
      `;

      await sendEmail(
        wardenEmail,
        `Welcome to ${institutionName} as a Warden`,
        htmlTemplate
      );

      await warden.save();
    } else if (warden.role !== "warden") {
      return res
        .status(400)
        .json({ message: "The user must have the role of 'warden'." });
    }

    // Save hostel
    const hostel = new Hostel({
      name: hostelName,
      gender: hostelType,
      totalFloor,
      rooms: [],
      college: collegeId,
    });

    // Calculate and create rooms
    const rooms = [];
    let roomNumber = 1;

    for (const sharingType of sharingTypes) {
      const { type, value } = sharingType;

      if (value > 0) {
        const roomsPerFloor = Math.floor(value / totalFloor);
        const remainingRooms = value % totalFloor;

        for (let floor = 1; floor <= totalFloor; floor++) {
          const numRoomsOnFloor =
            roomsPerFloor + (floor <= remainingRooms ? 1 : 0);

          for (let i = 0; i < numRoomsOnFloor; i++) {
            rooms.push({
              number: roomNumber,
              floor,
              sharing: type,
              isAvailable: true,
              status: "available",
              hostel: hostel._id,
              college: collegeId,
            });
            roomNumber++;
          }
        }
      }
    }

    // Save all rooms in the database
    const savedRooms = await Room.insertMany(rooms);

    // Update hostel with room references
    hostel.rooms = savedRooms.map((room) => room._id as Types.ObjectId);
    await hostel.save();

    return res
      .status(201)
      .json({ message: "Hostel registered successfully", hostel });
  } catch (error) {
    console.error("Error registering hostel:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const searchWarden = async (req: Request, res: Response) => {
  const { email } = req.query;

  try {
    const query = email ? { email: email, role: "warden" } : { role: "warden" };
    const users = await User.find(query).select("name email");

    return res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Failed to fetch users." });
  }
};

export const fetchHostels = async (req: Request, res: Response) => {
  try {
    const collegeId = req.user.collegeId;
    const hostels = await Hostel.find({ college: collegeId });
    return res.status(200).json(hostels);
  } catch (error) {
    console.error("Error fetching hostels:", error);
    throw error;
  }
};
