import Like from "../modals/likeSchema.js";
import Product from "../modals/productSchema.js";
import mongoose from "mongoose";

// backend/controller/likeController.js

const addLike = async (req, res) => {
  try {
    const userId = req.user._id;
    const foodId = req.params.id;

    if (!foodId || !mongoose.Types.ObjectId.isValid(foodId)) {
      return res.status(400).json({ status: false, msg: "Invalid or missing Food ID." });
    }

    const product = await Product.findById(foodId);
    if (!product) {
      return res.status(404).json({ status: false, msg: "Food item not found." });
    }

    // Use findOneAndUpdate with upsert for atomicity if possible, or just stay simple
    const existingLike = await Like.findOne({ userId, foodId });
    if (existingLike) {
      return res.status(200).json({ status: true, msg: "Item already in favorites", data: existingLike });
    }

    const newLike = await Like.create({ userId, foodId });
    res.status(201).json({ status: true, msg: "Added to favorites", data: newLike });

  } catch (err) {
    console.error("Add like error:", err);
    res.status(500).json({ status: false, msg: "Server Error", error: err.message });
  }
};

const fetchLikes = async (req, res) => {
  try {
    const userId = req.user._id;
    const userLikes = await Like.find({ userId })
      .populate({
        path: "foodId",
        populate: { path: "storeId", select: "storeName" },
      })
      .lean();

    // Filter out likes for missing products
    const validLikes = userLikes.filter(like => like.foodId);

    res.status(200).json({
      status: true,
      msg: "Favorites fetched",
      data: validLikes,
    });
  } catch (err) {
    console.error("Fetch likes error:", err);
    res.status(500).json({ status: false, msg: "Server Error", error: err.message });
  }
};

const removeLike = async (req, res) => {
  try {
    const userId = req.user._id;
    const foodId = req.params.id;

    if (!foodId || !mongoose.Types.ObjectId.isValid(foodId)) {
      return res.status(400).json({ status: false, msg: "Invalid Food ID." });
    }

    const result = await Like.findOneAndDelete({ userId, foodId });

    // Idempotent: even if not found, the item is now not liked, so return success
    if (!result) {
      return res.status(200).json({ status: true, msg: "Favorite not found, but removed from view" });
    }

    res.status(200).json({ status: true, msg: "Removed from favorites", data: result });
  } catch (err) {
    console.error("Remove like error:", err);
    res.status(500).json({ status: false, msg: "Server Error", error: err.message });
  }
};

export { addLike, fetchLikes, removeLike };
