import { Router } from "express";

import { verifyToken } from "../middelware/AuthMiddelware.js";
import { getMessageData, uploadFile } from "../controllar/MessageControllar.js";
import multer from "multer";
const MessagesRoute = Router();
const upload = multer({dest : "uploads/files"})


MessagesRoute.post("/get-messages", verifyToken, getMessageData);

MessagesRoute.post("/upload-files", verifyToken,upload.single("file"), uploadFile);


export default MessagesRoute;
