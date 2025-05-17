import mongoose from "mongoose";
import UserData from "../model/userModel.js";
import MessageData from "../model/MessageModel.js";

const Searchcontacts = async (req, res) => {
  try {
    const { searchTerm } = req.body;

    console.log("searchTerm", searchTerm);
    if (searchTerm === undefined || searchTerm === null) {
      return res.status(400).json({
        message: "Search term is required",
      });
    }

    // Sanitize and prepare search term
    const sanitizedSearchTerm = searchTerm.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
    const regex = new RegExp(sanitizedSearchTerm, "i");

    // Find contacts based on search term
    const contacts = await UserData.find({
      $and: [
        { _id: { $ne: req.userId } }, // Exclude current user
        {
          $or: [{ firstName: regex }, { lastName: regex }, { email: regex }],
        },
      ],
    });

    // Return the contacts in the correct format
    return res.status(200).json({
      message: "Contacts fetched successfully",
      contacts,
    });
  } catch (error) {
    console.error("Error searching contacts:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

const showAllContacts = async (req, res) => {
  try {
    let { userId } = req;
    userId = new mongoose.Types.ObjectId(userId);

    const contacts = await MessageData.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { recipient: userId }],
        },
      },
      {
        $sort: { timestamp: -1 }, // Sorting by timestamp
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$sender", userId] },
              then: "$recipient",
              else: "$sender",
            },
          },
          lastMessageTime: {
            $first: "$timestamp",
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "contactInfo",
        },
      },
      {
        $unwind: "$contactInfo",
      },
      {
        $project: {
          _id: 1,
          lastMessageTime: 1,
          email: "$contactInfo.email",
          firstName: "$contactInfo.firstName",
          lastName: "$contactInfo.lastName",
          image: "$contactInfo.image",
          color: "$contactInfo.color",
        },
      },
      {
        $sort: {
          lastMessageTime: -1,
        },
      },
    ]);
    // Return the contacts in the correct format
    return res.status(200).json({
      message: "Contacts fetched successfully",
      contacts,
    });
  } catch (error) {
    console.error("Error searching contacts:", error);
    return res.status(500).json({ message: "Server error." });
  }
};



const getAllContactsForDM = async (req, res) => {
  try {
    // Await the result of the query
    const users = await UserData.find(
      { _id: { $ne: req.userId } },
      "firstName lastName _id email"
    );

    // Map the users to create the contacts array
    const contacts = users.map((user) => ({
      label: user.firstName ? `${user.firstName} ${user.lastName}` : user.email,
      value : user._id
    }));

    return res.status(200).json({
      message: "Contacts fetched successfully",
      contacts,
    });
  } catch (error) {
    console.error("Error searching contacts:", error);
    return res.status(500).json({ message: "Server error." });
  }
};


export { Searchcontacts, showAllContacts, getAllContactsForDM };
