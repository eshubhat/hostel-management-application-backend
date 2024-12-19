import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import authenticationRoute from "./routes/authentication.routes.js";
import collegeAdminRouter from "./routes/collegeadmin.routes.js";
import superAdminRoute from "./routes/superadmin.routes.js";
import userRoute from "./routes/users.js";

dotenv.config();

const app = express();

app.use(cors({ credentials: true, origin: "*" }));
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authenticationRoute);
app.use("/superadmin", superAdminRoute);
app.use("/collegeadmin", collegeAdminRouter);
app.use("/user", userRoute);

mongoose.connect(process.env.MONGODB_URI as string, {
  dbName: process.env.DB_NAME as string,
});

app.listen(process.env.PORT, () =>
  console.log("Server running on port ", process.env.PORT)
);
