import Likes from "../modals/likeSchema.js";
import mongoose from "mongoose";

// backend/controller/likeController.js

const addLike = async (req, res) => {
  try {
    const userId = req.user._id; // ✅ Get from middleware, not body
    const { foodId } = req.body;

    if (!foodId) {
      return res.status(400).json({ msg: "Food ID is required." });
    }

    // Check if already liked
    const existingLike = await Likes.findOne({ userId, foodId });
    if (existingLike) {
      return res.status(409).json({ msg: "Item already liked." });
    }

    // Create new like
    const newLike = await Likes.create({ userId, foodId });
    res.status(201).json({ msg: "Like added successfully", data: newLike });
  } catch (err) {
    console.error("Add like error:", err); // ✅ Log the error
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};

const fetchLikes = async (req, res) => {
  try {

    const userId = req.user._id;

    const userLikes = await Likes.find({ userId: userId }) // no need for `new ObjectId(...)`
      .populate({
        path: "foodId",
        select: "productName price images isAvailable category",
        populate: {
          path: "storeId",
          select: "storeName",
        },
      })
      .lean();

    // Optional: remove likes where the food was deleted
    const validLikes = userLikes.filter((like) => like.foodId !== null);

    res.status(200).json({
      msg: "Likes fetched successfully",
      data: validLikes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};

const removeLike = async (req, res) => {
  try {
    const userId = req.user._id; // from auth
    const foodId = req.params.id; // from URL

    if (!foodId) {
      return res.status(400).json({ msg: "Food ID is required." });
    }

    if (!mongoose.Types.ObjectId.isValid(foodId)) {
      return res.status(400).json({ msg: "Invalid Food ID format." });
    }

    const result = await Likes.findOneAndDelete({
      userId, // already ObjectId if from DB
      foodId: new mongoose.Types.ObjectId(foodId),
    });

    if (!result) {
      return res.status(404).json({ msg: "Like not found." });
    }

    res.status(200).json({ msg: "Like removed successfully", data: result });
  } catch (err) {
    console.error("Remove like error:", err);
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};

export { addLike, fetchLikes, removeLike };
