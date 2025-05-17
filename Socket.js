import { Server } from "socket.io"; // Importing the Server instead of renaming Socket
import MessageData from "./model/MessageModel.js";
import Channel from "./model/ChannelModel.js";

import dotenv from "dotenv";

dotenv.config();

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });




  const userSocketMap = new Map();

  const disconnect = (socket) => {
    console.log(`Client Disconnected: ${socket.id}`);

    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        break;
      }
    }
  };

  const sendMessage = async (message) => {
    console.log("Message received on backend:", message); // Add this for debugging
    const senderSocketId = userSocketMap.get(message.sender);
    const recipientSocketId = userSocketMap.get(message.recipient);

    const createMessage = await MessageData.create(message);

    const messageDatas = await MessageData.findById(createMessage._id)
      .populate("sender", "id email firstName lastName image color") // Ensure 'sender' field is a reference to 'User'
      .populate("recipient", "id email firstName lastName image color"); // Ensure 'recipient' field is a reference to 'User'

   
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("recieveMessage", messageDatas);
    }

    if (senderSocketId) {
      io.to(senderSocketId).emit("recieveMessage", messageDatas);
    }
  };

  const sendChannelMessage = async (message) => {
    const { channelId, sender, content, messageType, fileUrl } = message;

    const createMessage = await MessageData.create({
      sender,
      recipient: null,
      content,
      messageType,
      timestamp: Date.now(),
      fileUrl,
    });

    const messageDatas = await MessageData.findById(createMessage._id)
      .populate("sender", "id email firstName lastName image color")
      .exec();
      console.log("<<<messageDatas", messageDatas);
    await Channel.findByIdAndUpdate(channelId, {
      $push: {
        messages: createMessage._id,
      },
    });

    const channel = await Channel.findById(channelId).populate("members");

    const finalData = { ...messageDatas._doc, channelId: channel._id };

    console.log("<<<finalData",finalData)
    if (channel && channel.members) {
      channel.members.forEach((member) => {
        const memberSokertID = userSocketMap.get(member._id.toString());
        if (memberSokertID) {
          io.to(memberSokertID).emit("recieve-channel-message", finalData);
        }

      });
      const adminSoketID = userSocketMap.get(channel.admin._id.toString());
      if (adminSoketID) {
        io.to(adminSoketID).emit("recieve-channel-message", finalData);
      }
    }
  };

  io.on("connection", (socket) => {
    try {
      const userId = socket.handshake.query.userId;

      if (userId) {
        userSocketMap.set(userId, socket.id);
        console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
      } else {
        console.log("User ID not provided during connection.");
        socket.disconnect(true); // Disconnect if userId is not provided
      }

      socket.on("sendMessage", sendMessage);
      socket.on("send-channel-message", sendChannelMessage);

      socket.on("disconnect", () => disconnect(socket));
    } catch (err) {
      console.error("Socket connection error:", err);
    }
  });
};

export default setupSocket;
