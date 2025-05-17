import MessageData from "../model/MessageModel.js";
import { mkdirSync, renameSync } from "fs";

const getMessageData = async (req, res) => {
  try {
    const user1 = req.userId; // Assuming req.userId is set correctly
    const user2 = req.body.id;

    // Validate input
    if (!user1 || !user2) {
      return res.status(400).json({
        message: "Both user IDs are required.",
      });
    }

    // Fetch messages between the two users
    const messageData = await MessageData.find({
      $or: [
        { sender: user1, recipient: user2 },
        { sender: user2, recipient: user1 },
      ],
    }).sort({ timestamp: 1 });

    // Return messages in the correct format
    return res.status(200).json({
      message: "Messages fetched successfully",
      messages: messageData, // Renamed to 'messages' for clarity
    });
  } catch (error) {
    console.error("Error fetching messages:", error); // Updated log message for clarity
    return res.status(500).json({ message: "Server error." });
  }
};

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "File is required.",
      });
    }
    const date = Date.now(); 
    const fileDir = `uploads/files/${date}`;  // Create a new directory for the file

    const fileName = `${fileDir}/${req.file.originalname}`;
    console.log("<<<fileName>>>", fileName);

    mkdirSync(fileDir, { recursive: true });  // Create directory if it doesn't exist
    renameSync(req.file.path, fileName);  

    
    return res.status(200).json({
      message: "file Uploaded successfully",
      filePath: fileName,
    });
  } catch (error) {
    console.error("Error fetching messages:", error); // Updated log message for clarity
    return res.status(500).json({ message: "Server error." });
  }
};

export { getMessageData, uploadFile };
