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

// ✅ Ensures a user can't like the same food item twice
likeSchema.index({ userId: 1, foodId: 1 }, { unique: true });

const Likes = mongoose.model("Likes", likeSchema);
export default Likes;