import { Router } from "express";
import { createPost, Getpost } from "../controllar/postControllar.js";


const PostRoute =  Router()

PostRoute.get('/getallpost' ,Getpost )

PostRoute.post('/create-post' ,createPost )





export default PostRoute