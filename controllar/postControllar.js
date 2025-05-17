import Post from "../model/PostModel.js";
import { createError } from "../error.js";
import { v2 as cloudinary } from "cloudinary";
import { Configuration, OpenAIApi } from "openai";



import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log(process.env.CLOUDINARY_CLOUD_NAME);
console.log(process.env.CLOUDINARY_API_KEY);
console.log(process.env.CLOUDINARY_API_SECRET);

const Getpost = async (req, res, next) => {
  try {
    const posts = await Post.find({});
    if (!posts || posts.length === 0) {
      return res.status(404).json({
        message: "No posts found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Posts fetched successfully",
      success: true,
      data: posts,
    });
  } catch (error) {
    console.error("Error fetching posts:", error.message);
    res.status(500).json({ message: "Server error", success: false });
    next(
      createError(
        error.status,
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message
      )
    );
  }
};

const createPost = async (req, res, next) => {
  try {
    const { name, prompt, photo } = req.body;

    const photoUrl = await cloudinary.uploader.upload(photo);
    const newPost = await Post.create({
      name,
      prompt,
      photo: photoUrl?.secure_url,
    });

    return res.status(201).json({
      message: "Post Created SucessFully",
      success: true,
      data: newPost,
    });
  } catch (error) {
    console.error("Error fetching posts:", error.message);
    res.status(500).json({ message: "Server error", success: false });
    next(
      createError(
        error.status,
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message
      )
    );
  }
};



export { Getpost, createPost };
