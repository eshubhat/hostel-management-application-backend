import mongoose, { Schema, Document, Model } from "mongoose";
import express from "express";
import bcrypt from "bcrypt";
import { roles } from "../utils/constants";

const app = express();
app.use(express.json());

// Define interface for User document
interface UserDocument extends Document {
  first_name: string;
  last_name: string;
  email: string;
  // signup_key: number;
  password: string;
  phone_no: number;
  hostel_id: mongoose.Types.ObjectId;
  role: string;
  college_id: mongoose.Types.ObjectId;
}

// Define interface for UserModel
interface UserModel extends Model<UserDocument> {}

// User Schema
const userSchema = new Schema<UserDocument, UserModel>({
  first_name: String,
  last_name: String,
  email: { type: String, lowercase: true },
  // signup_key: { type: Number, required: true },
  password: String,
  phone_no: Number,
  hostel_id: { type: mongoose.Schema.Types.ObjectId, ref: "clubs" },
  role: {
    type: String,
    enum: [roles.collegeadmin, roles.hostelwarden, roles.hostelOccupant],
    default: roles.hostelOccupant,
  },
  college_id: { type: mongoose.Schema.Types.ObjectId, ref: "college_info" },
});

// Club Schema
interface HostelDocument extends Document {
  hostel_name: string;
  college_id: mongoose.Types.ObjectId;
  description?: string;
}

interface ClubModel extends Model<HostelDocument> {}

const HostelSchema = new Schema<HostelDocument, ClubModel>({
  hostel_name: String,
  college_id: { type: mongoose.Schema.Types.ObjectId, ref: "college_info" },
  description: { type: String, max: 500 },
});

// College Schema
interface CollegeDocument extends Document {
  college_name: string;
  college_email: string;
}

interface CollegeModel extends Model<CollegeDocument> {}

const collegeSchema = new Schema<CollegeDocument, CollegeModel>({
  college_name: String,
  college_email: String,
});

// Pre-save hook for hashing password
userSchema.pre<UserDocument>("save", async function (next) {
  try {
    if (this.isNew || this.isModified("password")) {
      const hashedPassword = await bcrypt.hash(this.password, 10);
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
export const Club = mongoose.model<HostelDocument, ClubModel>(
  "clubs",
  HostelSchema
);
export const College = mongoose.model<CollegeDocument, CollegeModel>(
  "college_info",
  collegeSchema
);
