import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    prompt: {
        type: String,
        required: true,
    },
    photo: {
        type: String,
        required: true,
    },
});

// Define the model using the schema
const PostData = mongoose.model("Post", PostSchema);

export default PostData;
