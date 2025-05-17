import { compare } from "bcryptjs";
import bcrypt from 'bcryptjs';

import UserData from "../model/userModel.js";
import pkg from "jsonwebtoken"; // Import the entire package
const { sign } = pkg; // Destructure the 'sign' function
import sgMail from "@sendgrid/mail";
import nodemailer from "nodemailer";
import { renameSync, unlink, unlinkSync } from "fs";
import path from "path"; // To safely handle file paths

const maxage = 3 * 24 * 60 * 60 * 1000; // Cookie expiry time

// Function to create JWT token
const createToken = (email, userId) => {
  return sign({ email, userId }, process.env.JWT_KEY, { expiresIn: maxage });
};

// Signup function
const signup = async (req, res, next) => {
  try {
    const { password, email } = req.body;

    // Check if email and password are provided
    if (!password || !email) {
      return res
        .status(401)
        .json({ message: "Password and email must be required" });
    }

    // Create user in the database
    const user = await UserData.create({ email, password });

    // Set a JWT in the cookie
    res.cookie("jwt", createToken(email, user.id), {
      maxAge: maxage,
      secure: true,
      sameSite: "None",
      sameSite: "Lax",
    });

    // Return a success response with user details
    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        profileSetUp: user.profileSetUp,
      },
    });
  } catch (error) {
    res.status(500).send("Server error");
  }
};

const login = async (req, res) => {
  try {
    const { password, email } = req.body;

    if (!password || !email) {
      return res
        .status(401)
        .json({ message: "Password and email must be required" });
    }

    const user = await UserData.findOne({ email });
    console.log("<<USER", user);
    if (!user) {
      return res.status(404).json({ message: "Email not Found" });
    }

    const auth = await compare(password, user.password);
    console.log("<<<<<auth", auth);

    if (!auth) {
      return res.status(404).json({ message: "PassWord is inCorrect" });
    }

    // Set a JWT in the cookie
    res.cookie("jwt", createToken(email, user.id), {
      maxAge: maxage,
      secure: true,
      sameSite: "None",
    });

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        profileSetUp: user.profileSetUp,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        color: user.color,
      },
    });
  } catch (error) {
    res.status(500).send("Server error");
  }
};

const getUserData = async (req, res) => {
  try {
  

    // Use the correct model to find the user by their ID (assuming your model is named 'User')
    const userData = await UserData.findById(req.userId);

    // Check if the user was found
    if (!userData) {
      return res.status(404).json({ message: "User Not Found" });
    }

    // Return user data as a response
    return res.status(200).json({
      id: userData._id,
      email: userData.email,
      profileSetUp: userData.profileSetUp,
      firstName: userData.firstName,
      lastName: userData.lastName,
      image: userData.image,
      color: userData.color,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error");
  }
};

const updateProfile = async (req, res) => {
  try {
    const { userId } = req;
    const { firstName, lastName, color } = req.body;
    console.log("Request body:", req.body); // Log the incoming request data
    console.log("userId>>>>>>", userId); // Log the userId to check if it's passed correctly

    // Check if required fields are present
    if (!firstName || !lastName) {
      return res
        .status(400)
        .json({ message: "First name and last name are required." });
    }

    // Update user information
    const updateUser = await UserData.findByIdAndUpdate(
      userId,
      { firstName, lastName, color, profileSetUp: true }, // Fields to update
      { new: true, runValidators: true } // Return updated document and validate
    );

    console.log("<<<<Update", updateUser);

    if (!updateUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // Respond with updated user data
    return res.status(200).json({
      message: "User's profile updated successfully.",

      id: updateUser._id,
      email: updateUser.email,
      profileSetUp: updateUser.profileSetUp,
      firstName: updateUser.firstName,
      lastName: updateUser.lastName,
      image: updateUser.image,
      color: updateUser.color,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

const updateProfileImage = async (req, res) => {
  try {
    // Ensure file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "File is Required" });
    }

    // No need for renameSync because Multer already handles file storage
    const fileName = req.file.path; // Path is already set by multer

    // Update user image in the database
    const updatedUser = await UserData.findByIdAndUpdate(
      req.userId, // Assuming req.userId is set from token
      { image: fileName },
      { new: true, runValidators: true } // Return updated document and validate
    );

    return res.status(200).json({
      image: updatedUser.image,
    });
  } catch (error) {
    console.error("Error in updating profile image:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

const DeleteProfileImage = async (req, res) => {
  try {
    const { userId } = req;

    const updateUser = await UserData.findById(userId);

    if (!updateUser) {
      return res.status(404).json({ message: "User not found." });
    }

    if (updateUser.image) {
      unlinkSync(updateUser.image);
    }

    updateUser.image = null;
    await updateUser.save();

    return res.status(200).json({
      message: "User's profile Delete successfully.",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

const LogOutUser = async (req, res) => {
  const { userId } = req;
  try {
    res.cookie("jwt", "", { maxage: 1, secure: true, sameSite: "None" });

    return res.status(200).json({
      message: "LogOut SuccessFUlly",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

const sendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user exists in the database
    const user = await UserData.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    console.log("<<<USER", user);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    const otpExpires = Date.now() + 3600000; // OTP valid for 1 hour

    // Save OTP and expiration time in the database
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Create a transporter object using Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: false, // true for port 465, false for other ports
      port: 587, // Use 587 for TLS
      auth: {
        user: "kevalachauhan2017@gmail.com", // Correct email address
        pass: "yoec tblg fold acen", // Use the app-specific password here
      },
    });

    // Email message options
    const mailOptions = {
      from: "kevalachauhan2017@gmail.com", // Correct email address
      to: email,
      subject: "Password Reset OTP",
      html: `
        <table role="presentation" style="width: 100%; max-width: 600px; margin: auto; border-collapse: collapse; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="position: relative; text-align: center; background-color: #ffffff;">
              <!-- Background Image -->
              <img src="https://img.freepik.com/premium-vector/secure-email-otp-authentication-verification-method_258153-468.jpg" 
                   alt="Background" 
                   style="width: 100%; height: auto; position: absolute; top: 0; left: 0; right: 0; bottom: 0; object-fit: cover; opacity: 0.3; z-index: 0;" />
              
              <!-- Title Box -->
              <div style="position: relative; z-index: 1; background-color: #ff5722; padding: 10px; color: white; font-size: 20px; font-weight: bold; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                Max ChatApp
              </div>
    
              <!-- Foreground Content -->
              <div style="position: relative; z-index: 1; padding: 20px; background-color: rgba(255, 255, 255, 0.8); border-radius: 8px;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p style="font-size: 18px; color: #555;">Your One-Time Password (OTP) is:</p>
                <h1 style="font-size: 36px; color: #ff5722;">${otp}</h1>
                <p style="font-size: 16px; color: #555;">It is valid for <strong>1 hour</strong>.</p>
                <p style="font-size: 16px; color: #555;">If you did not request this, please ignore this email.</p>
                <footer style="margin-top: 20px; font-size: 14px; color: #999;">
                  <p>Thank you,</p>
                  <p>Your Company Name</p>
                </footer>
              </div>
            </td>
          </tr>
        </table>
      `,
    };

    // Send email
    const data = await transporter.sendMail(mailOptions);
    console.log("<<<data", data);

    // Respond with success message
    res.status(200).json({ message: "OTP sent successfully." });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const verifyOTPAndChangePassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  // Log data from the frontend for debugging
  console.log("<<<<<<Data from frontend:", email, otp, newPassword);

  try {
    // Step 1: Verify JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized request" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET); // Replace with your JWT secret
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Step 2: Check if the email in the token matches the requested email
    if (decoded.email !== email) {
      return res.status(403).json({ message: "Token does not match email" });
    }

    // Step 3: Find the user in the database
    const user = await UserData.findOne({ email });
    console.log("<<<User:", user);

    // Step 4: Verify OTP and expiration
    if (!user || user.otp !== otp || Date.now() > user.otpExpires) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // Step 5: Hash the new password and save it
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.otp = undefined; // Clear OTP
    user.otpExpires = undefined;

    await user.save();

    return res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

export {
  verifyOTPAndChangePassword,
  sendOTP,
  signup,
  login,
  getUserData,
  updateProfile,
  updateProfileImage,
  DeleteProfileImage,
  LogOutUser,
};
