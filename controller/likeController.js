import Like from "../modals/likeSchema.js";
import Product from "../modals/productSchema.js";
import mongoose from "mongoose";

// backend/controller/likeController.js

const addLike = async (req, res) => {
  try {
    // 1. Check if user is authenticated/attached
    if (!req.user || !req.user._id) {
      console.error("Add like error: User not authenticated or missing _id");
      return res.status(401).json({ status: false, msg: "User not authenticated." });
    }

    const userId = req.user._id;
    const { foodId } = req.body;

    // 2. Validate input existence
    if (!foodId) {
      console.error("Add like error: Missing foodId in request body", req.body);
      return res.status(400).json({ status: false, msg: "Food ID is required." });
    }

    // 3. Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(foodId)) {
      console.error(`Add like error: Invalid foodId format: ${foodId}`);
      return res.status(400).json({ status: false, msg: "Invalid Food ID format." });
    }

    // 4. Verify product exists
    const product = await Product.findById(foodId);
    if (!product) {
      console.error(`Add like error: Product not found for ID: ${foodId}`);
      return res.status(404).json({ status: false, msg: "Food item not found." });
    }

    // 5. Check if already liked (Idempotent check)
    const existingLike = await Like.findOne({ userId, foodId });
    if (existingLike) {
      // Return success status even if already liked
      return res.status(200).json({
        status: true,
        msg: "Item already liked.",
        data: existingLike
      });
    }

    // 6. Create new like
    const newLike = await Like.create({ userId, foodId });
    console.log(`Like added successfully for User: ${userId}, Food: ${foodId}`);
    res.status(201).json({
      status: true,
      msg: "Like added successfully",
      data: newLike
    });

  } catch (err) {
    console.error("Add like server error:", err);

    // Handle specific Mongoose errors
    if (err.name === 'CastError') {
      return res.status(400).json({ status: false, msg: "Invalid ID format in database operation.", error: err.message });
    }

    res.status(500).json({
      status: false,
      msg: "Server Error",
      error: err.message,
      name: err.name,
      stack: err.stack
    });
  }
};

const fetchLikes = async (req, res) => {
  try {

    const userId = req.user._id;
    console.log(`Fetching likes for user: ${userId}`);

    const userLikes = await Like.find({ userId: userId })
      .populate({
        path: "foodId",
        select: "productName price images isAvailable category",
        populate: {
          path: "storeId",
          select: "storeName",
        },
      })
      .lean();

    console.log(`Found ${userLikes.length} raw like entries.`);
    if (userLikes.length > 0) {
      // Log first item's foodId to check population
      console.log("Sample populated foodId:", JSON.stringify(userLikes[0].foodId, null, 2));
    }

    // Optional: remove likes where the food was deleted
    const validLikes = userLikes.filter((like) => like.foodId != null && like.foodId !== null);
    console.log(`Returning ${validLikes.length} valid likes after filtering.`);

    res.status(200).json({
      status: true,
      msg: "Likes fetched successfully",
      data: validLikes,
    });
  } catch (err) {
    console.error("Fetch likes error:", err);
    res.status(500).json({ status: false, msg: "Server Error", error: err.message });
  }
};

const removeLike = async (req, res) => {
  try {
    const userId = req.user._id; // from auth
    const foodId = req.params.id; // from URL

    if (!foodId) {
      return res.status(400).json({ status: false, msg: "Food ID is required." });
    }

    if (!mongoose.Types.ObjectId.isValid(foodId)) {
      return res.status(400).json({ status: false, msg: "Invalid Food ID format." });
    }

    const result = await Like.findOneAndDelete({
      userId,
      foodId: new mongoose.Types.ObjectId(foodId),
    });

    if (!result) {
      return res.status(404).json({ status: false, msg: "Like not found." });
    }

    res.status(200).json({ status: true, msg: "Like removed successfully", data: result });
  } catch (err) {
    console.error("Remove like error:", err);
    res.status(500).json({ status: false, msg: "Server Error", error: err.message });
  }
};

export { addLike, fetchLikes, removeLike };
