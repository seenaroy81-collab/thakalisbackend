import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    foodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    likedAt: {
        type: Date,
        default: Date.now,
    },
});

const Like = mongoose.model("Like", likeSchema);
export default Like;