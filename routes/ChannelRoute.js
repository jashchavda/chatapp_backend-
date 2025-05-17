import { Router } from "express";
import { createChannel, getAllChannel, getChannelMessages } from "../controllar/ChannelControllar.js";
import { verifyToken } from "../middelware/AuthMiddelware.js";


const ChannelRoute = Router()


ChannelRoute.post('/create-channel',verifyToken, createChannel)

ChannelRoute.get('/get-all-channels',verifyToken, getAllChannel)

ChannelRoute.get('/get-messages-channels/:channelId',verifyToken, getChannelMessages)




export default ChannelRoute