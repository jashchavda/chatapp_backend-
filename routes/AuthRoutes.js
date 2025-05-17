import { Router } from "express";
import {
  DeleteProfileImage,
  getUserData,
  login,
  LogOutUser,
  sendOTP,
  signup,
  updateProfile,
  updateProfileImage,
  verifyOTPAndChangePassword,
} from "../controllar/authControllar.js";
import { verifyToken } from "../middelware/AuthMiddelware.js";
import multer from "multer";

import fs from "fs"; // Import to use renameSync

const AuthRoute = Router();

// Multer configuration for storing profile images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/profiles"); // Use relative path
  },
  filename: function (req, file, cb) {
    const date = Date.now();
    const extension = file.originalname.split(".").pop(); // Get the file extension
    cb(null, date + "-" + file.originalname); // Custom filename with a timestamp
  }
});

const upload = multer({ storage: storage });



AuthRoute.post("/signup", signup);

AuthRoute.post("/login", login);

AuthRoute.get("/userdata", verifyToken, getUserData);

AuthRoute.post("/update-profile", verifyToken, updateProfile);

// AuthRoute.post("/profile-img", verifyToken, upload.single('profile/image'), updateProfileImage);

AuthRoute.post("/profile-img", verifyToken, upload.single('profile/image'), updateProfileImage);

AuthRoute.delete("/delete-profile-img" , verifyToken , DeleteProfileImage)

AuthRoute.post("/logout", LogOutUser);

AuthRoute.post("/verifyotpandchangepassword",verifyToken, verifyOTPAndChangePassword);

AuthRoute.post("/sendotp",verifyToken,  sendOTP);


export default AuthRoute;
