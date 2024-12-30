import mongoose, { Schema, Document, Model, Types } from "mongoose";
import express from "express";
import bcrypt from "bcrypt";
import { roles } from "../utils/constants";

const app = express();
app.use(express.json());

// Define interface for User document
interface UserDocument extends Document {
  name: string;
  email: string;
  password?: string;
  role: "superAdmin" | "warden" | "representative" | "student";
  gender: "male" | "female";
  registrationNumber?: string;
  hostel?: Types.ObjectId;
  roomNumber?: string;
  temporaryKey?: string;
  isProfileComplete: boolean;
}

interface UserModel extends Model<UserDocument> {}

const userSchema = new Schema<UserDocument, UserModel>({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: {
    type: String,
    enum: ["superAdmin", "warden", "representative", "student"],
    required: true,
  },
  gender: { type: String, enum: ["male", "female"], required: true },
  registrationNumber: { type: String, unique: true },
  hostel: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel" },
  roomNumber: { type: String },
  temporaryKey: { type: String },
  isProfileComplete: { type: Boolean, default: false },
});

// Hostel Schema
interface HostelDocument extends Document {
  name: string;
  gender: "male" | "female";
  rooms: {
    roomNumber: string;
    capacity: number;
    occupants: Types.ObjectId[];
  }[];
  college: Types.ObjectId;
}

interface HostelModel extends Model<HostelDocument> {}

const hostelSchema = new Schema<HostelDocument, HostelModel>({
  name: { type: String, required: true },
  gender: { type: String, enum: ["male", "female"], required: true },
  rooms: [
    {
      roomNumber: { type: String, required: true },
      capacity: { type: Number, required: true },
      occupants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
  ],
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College",
    required: true,
  },
});

// College Schema
interface CollegeDocument extends Document {
  name: string;
  address: string;
  hostels: Types.ObjectId[];
}

interface CollegeModel extends Model<CollegeDocument> {}

const collegeSchema = new Schema<CollegeDocument, CollegeModel>({
  name: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  hostels: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hostel" }],
});

//Absentee schema
interface AbsenteeDocument extends Document {
  date: Date;
  student: {
    name: string;
    registrationNumber: string;
    roomNumber: string;
  };
  hostel: Types.ObjectId;
}

interface AbsenteeModel extends Model<AbsenteeDocument> {}

const absenteeSchema = new Schema<AbsenteeDocument, AbsenteeModel>({
  date: { type: Date, required: true },
  student: {
    name: { type: String, required: true },
    registrationNumber: { type: String, required: true },
    roomNumber: { type: String, required: true },
  },
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hostel",
    required: true,
  },
});

//Issue Schema
interface IssueDocument extends Document {
  student: {
    name: string;
    registrationNumber: string;
    roomNumber?: string;
  };
  floorNumber?: number;
  tag: "carpenter" | "plumber" | "electrician" | "cleaning" | "other";
  description: string;
  status: "open" | "in-progress" | "resolved";
  createdAt: Date;
  hostel: Types.ObjectId;
}

interface IssueModel extends Model<IssueDocument> {}

const issueSchema = new Schema<IssueDocument, IssueModel>({
  student: {
    name: { type: String, required: true },
    registrationNumber: { type: String, required: true },
    roomNumber: { type: String },
  },
  floorNumber: { type: Number },
  tag: {
    type: String,
    enum: ["carpenter", "plumber", "electrician", "cleaning", "other"],
    required: true,
  },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ["open", "in-progress", "resolved"],
    default: "open",
  },
  createdAt: { type: Date, default: Date.now },
  hostel: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel" },
});

// Pre-save hook for hashing password
userSchema.pre<UserDocument>("save", async function (next) {
  try {
    if (this.isNew || this.isModified("password")) {
      const hashedPassword = await bcrypt.hash(this.password as string, 10);
      this.password = hashedPassword;
    }
    next();
  } catch (error) {
    console.log("DB_Error");
  }
});

// Export models
export const User = mongoose.model<UserDocument, UserModel>(
  "users",
  userSchema
);
export const Hostel = mongoose.model<HostelDocument, HostelModel>(
  "Hostel",
  hostelSchema
);
export const College = mongoose.model<CollegeDocument, CollegeModel>(
  "college_info",
  collegeSchema
);
export const Absentee = mongoose.model<AbsenteeDocument, AbsenteeModel>(
  "Absentee",
  absenteeSchema
);
export const Issue = mongoose.model<IssueDocument, IssueModel>(
  "Issue",
  issueSchema
);
