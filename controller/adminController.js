import Admin from "../modals/adminSchema.js";
import Store from "../modals/storeSchema.js";
import Product from "../modals/productSchema.js";
import Category from "../modals/categorySchema.js";
import Banner from "../modals/bannerSchema.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";
import User from "../modals/userSchema.js";
import Likes from "../modals/likeSchema.js";



const adminSignup = async (req, res) => {
  const { userName } = req.body;
  try {
    const existAdmin = await Admin.findOne({ userName });
    if (existAdmin) {
      return res.status(400).json({
        msg: "Admin already exist",
      });
    } else {
      const adminDetails = await Admin.create(req.body);
      res.status(201).json({
        msg: "Admin detailes added succesfully",
        adminDetails,
      });
    }
  } catch (err) {
    res.status(400).json({
      error: "Error during signup",
      details: err.message || err,
    });
  }
};


const adminLogin = async (req, res) => {
  const { userName, password } = req.body;

  try {
    const existAdmin = await Admin.findOne({ userName });

    if (!existAdmin) {
      return res.status(400).json({ msg: "Admin not found" });
    }

    // Compare entered password with hashed one
    const isMatch = await bcrypt.compare(password, existAdmin.password);

    if (!isMatch) {
      return res.status(400).json({ msg: "Incorrect password" });
    }

    res.status(200).json({
      msg: "Login success",
      token: generateToken(existAdmin._id),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



const addStores = async (req, res) => {
  const { storeName } = req.body;
  try {
    const existStore = await Store.findOne({ storeName });
    if (existStore) {
      return res.status(400).json({
        msg: "Store already exist",
      });
    }

    const storeData = { ...req.body };
    if (req.file) {
      storeData.image = req.file.path;
    }

    const storeDetails = await Store.create(storeData);
    res.status(201).json({
      msg: "Store details addded successfully",
      storeDetails,
    });
  } catch (err) {
    res.status(400).json({
      error: "Error adding store",
      details: err.message || err,
    });
  }
};

const getStores = async (req, res) => {
  const { id } = req.query;
  let filter = {};

  if (id) filter._id = id;
  try {
    const storeDetails = await Store.find(filter);
    console.log("store details", storeDetails)
    res.status(200).json({
      msg: "Store details fetched successfully",
      data: storeDetails,
    });
  } catch (error) {
    console.error("error during fetching Stores:", error);
  }
};

const updateStores = async (req, res) => {
  try {
    let id = req.params.id;
    const updateData = { ...req.body };
    if (req.file) {
      updateData.image = req.file.path;
    }

    const updateStore = await Store.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    res.status(201).json({
      msg: "Store details updated successfully",
      data: updateStore,
    });
  } catch (err) {
    res.status(400).json({
      error: "Error updating store",
      details: err.message || err,
    });
  }
};

const deleteStores = async (req, res) => {
  try {
    let id = req.params.id;
    const deleteStore = await Store.findByIdAndDelete(id);
    res.status(201).json({
      msg: "Store details deleted successfully",
      data: deleteStore,
    });
  } catch (err) {
    res.status(400).json({
      error: "Error deleting store",
      details: err.message || err,
    });
  }
};

const addFoodItems = async (req, res) => {
  try {
    const foodData = { ...req.body };

    // Handle Product Image
    if (req.files && req.files.image) {
      foodData.image = req.files.image[0].path;
      foodData.images = [req.files.image[0].path];
    }

    // Handle Category integration
    if (foodData.category) {
      const categoryName = foodData.category.trim();
      let categoryUpdate = { name: categoryName };

      if (req.files && req.files.categoryImage) {
        categoryUpdate.image = req.files.categoryImage[0].path;
      }

      // Find or Create Category and get ID
      const category = await Category.findOneAndUpdate(
        { name: categoryName },
        { $setOnInsert: { image: "default_category.jpg" }, ...categoryUpdate },
        { upsert: true, new: true }
      );

      // Use the Category ID for the Product ref
      foodData.category = category._id;
    }

    const foodDetails = await Product.create(foodData);
    res.status(201).json({
      msg: "Food item added successfully",
      data: foodDetails,
    });
  } catch (err) {
    console.error("Error adding food item:", err);
    res.status(400).json({
      error: "Error adding food item",
      details: err.message || err,
    });
  }
};


const getFoodItems = async (req, res) => {
  try {
    // 1. Get all food items
    // .lean() makes the query faster as it returns plain JS objects
    const allFoods = await Product.find({})
      .populate("storeId", "storeName")
      .populate("restaurantId", "restaurantsName")
      .lean();

    // 2. Check if a user is logged in (from your 'protect' middleware)
    const userId = req.user?._id;

    if (userId) {
      // 3. Get all of this user's likes in a single query
      const userLikes = await Likes.find({ userId }).select('foodId').lean();

      // 4. Create a Set for fast lookup (O(1) complexity)
      const likedFoodIds = new Set(userLikes.map(like => like.foodId.toString()));

      // 5. Add the 'isLiked' field to each food item
      allFoods.forEach(food => {
        food.isLiked = likedFoodIds.has(food._id.toString());
      });
    } else {
      // If no user is logged in, all items are not liked by default
      allFoods.forEach(food => {
        food.isLiked = false;
      });
    }

    // Normalization and Aliasing
    const normalizedFoods = allFoods.map(food => {
      const normalized = {
        ...food,
        name: food.name || food.productName,
        image: food.image || (food.images && food.images.length > 0 ? food.images[0] : null)
      };

      if (food.restaurantId && !food.storeId) {
        normalized.storeId = {
          ...food.restaurantId,
          storeName: food.restaurantId.restaurantsName || food.restaurantId.storeName
        };
      }
      return normalized;
    });

    res.status(200).json({
      msg: "Food items fetched successfully",
      data: normalizedFoods,
    });
  } catch (err) {
    console.error("Error fetching all food items:", err);
    res.status(500).json({ msg: "Server error", error: err.message || err });
  }
};
const updateFoodItems = async (req, res) => {
  try {
    let id = req.params.id;
    const updateData = { ...req.body };
    if (req.file) {
      updateData.image = req.file.path;
    }
    const updateFood = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    res.status(201).json({
      msg: "Food item updated successfully",
      data: updateFood,
    });
  } catch (err) {
    res.status(400).json({
      error: "Error updating food item",
      details: err.message || err,
    });
  }
};

const deleteFoodItems = async (req, res) => {
  try {
    let id = req.params.id;
    const deleteFood = await Product.findByIdAndDelete(id);
    res.status(201).json({
      msg: "Food item deleted successfully",
      data: deleteFood,
    });
  } catch (err) {
    res.status(400).json({
      error: "Error deleting food item",
      details: err.message || err,
    });
  }
};

const getAllUserDetails = async (req, res) => {
  try {
    const userDetails = await User.find();
    res.status(200).json({
      msg: "User details fetched successfully",
      data: userDetails,
    });
  }
  catch (err) {
    res.status(400).json({
      error: "Error fetching user details",
      details: err.message || err,
    });
  }
};

const getStoresDetails = async (req, res) => {
  try {
    const resDetails = await Product.find()
      .populate("storeId", "storeName address description image")
      .populate("restaurantId", "restaurantsName address description image")
      .lean();

    const normalizedDetails = resDetails.map(item => {
      const normalized = {
        ...item,
        name: item.name || item.productName,
        image: item.image || (item.images && item.images.length > 0 ? item.images[0] : null)
      };

      if (item.restaurantId && !item.storeId) {
        normalized.storeId = {
          ...item.restaurantId,
          storeName: item.restaurantId.restaurantsName || item.restaurantId.storeName
        };
      }
      return normalized;
    });

    res.status(200).json({
      msg: "store detailes fetched successfully",
      data: normalizedDetails
    })
  } catch (err) {
    res.status(400).json({
      error: "Error fetching store details",
      details: err.message || err,
    });
  }
}



const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().lean();
    res.status(200).json({ success: true, data: banners });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const addBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No image file uploaded" });
    }
    const newBanner = await Banner.create({ image: req.file.path });
    res.status(201).json({ msg: "Banner added successfully", data: newBanner });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };
    if (req.file) {
      updateData.image = req.file.path;
    }
    const updatedBanner = await Banner.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedBanner) return res.status(404).json({ msg: "Banner not found" });
    res.status(200).json({ msg: "Banner updated successfully", data: updatedBanner });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) return res.status(404).json({ msg: "Banner not found" });
    res.status(200).json({ msg: "Banner deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ msg: "Category name is required" });
    }

    const categoryData = { name: name.trim() };
    if (req.file) {
      categoryData.image = req.file.path;
    } else {
      return res.status(400).json({ msg: "Category image is required" });
    }

    const newCategory = await Category.create(categoryData);
    res.status(201).json({
      msg: "Category added successfully",
      data: newCategory,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().lean();
    res.status(200).json({
      msg: "Categories fetched successfully",
      data: categories,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export {
  adminSignup,
  adminLogin,
  addStores,
  getStores,
  updateStores,
  deleteStores,
  addFoodItems,
  getFoodItems,
  updateFoodItems,
  deleteFoodItems,
  getAllUserDetails,
  getStoresDetails,
  getCategories,
  addCategory,
  getAllBanners,
  addBanner,
  updateBanner,
  deleteBanner
};
