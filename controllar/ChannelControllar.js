import mongoose from "mongoose";
import Channel from "../model/ChannelModel.js";
import UserData from "../model/userModel.js";

const createChannel = async (req, res) => {
  try {
    const { name, members } = req.body;
    const userId = req.userId;

    // Check if the admin (user creating the channel) exists
    const admin = await UserData.findById(userId);

    if (!admin) {
      return res.status(400).json({
        message: "Admin not found.",
      });
    }

    // Validate that all the provided member IDs correspond to actual users
    const validMembers = await UserData.find({ _id: { $in: members } });

    if (validMembers.length !== members.length) {
      return res.status(400).json({
        message: "One or more members not found.",
      });
    }

    // Create a new channel
    const newChannel = new Channel({
      name,
      members,
      admin: userId, // Reference to the admin who created the channel
    });

    // Save the new channel to the database
    await newChannel.save();

    return res.status(201).json({
      message: "Channel created successfully",
      channel: newChannel,
    });
  } catch (error) {
    console.error("Error creating channel:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

const getAllChannel = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const channels = await Channel.find({
      $or: [{ admin: userId }, { members: userId }],
    }).sort({ updatedAt: -1 });

    return res.status(201).json({
      message: "Channel fetch successfully",
      channels,
    });
  } catch (error) {
    console.error("Error creating channel:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

const getChannelMessages = async (req, res) => {
  try {

    const { channelId } = req.params;
    const channel = await Channel.findById(channelId).populate({
      path: "messages",
      populate: {
        path: "sender",
        select: "firstName lastName email _id image color",
      },
    });
    
    if (!channel) {
      return response.status(404).send("Channel not found.");
    }
    
    const messages = channel.messages;
  
    return res.status(201).json({
      message: "Channel fetch successfully",
      messages,
    });
  } catch (error) {
    console.error("Error creating channel:", error);
    return res.status(500).json({ message: "Server error." });
  }
};
export { createChannel, getAllChannel, getChannelMessages };
