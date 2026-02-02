import express from "express";
import {
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
  getCategories,
  addCategory,
  getAllBanners,
  addBanner,
  updateBanner,
  deleteBanner,
  deleteCategory
} from "../controller/adminController.js";
import upload from "../config/multer.js";

const app = express.Router();

app.route("/").post(adminSignup);
app.route("/login").post(adminLogin);
app.route("/stores").post(upload.single('image'), addStores).get(getStores);
app.route("/stores/:id").put(upload.single('image'), updateStores).delete(deleteStores);
app.route("/food").post(upload.fields([{ name: 'image', maxCount: 1 }, { name: 'categoryImage', maxCount: 1 }]), addFoodItems).get(getFoodItems);
app.route("/food/:id").put(upload.fields([{ name: 'image', maxCount: 1 }, { name: 'categoryImage', maxCount: 1 }]), updateFoodItems).delete(deleteFoodItems);
app.route("/categories").get(getCategories).post(upload.single('image'), addCategory);
app.route("/categories/:id").delete(deleteCategory);
app.route("/banners").get(getAllBanners).post(upload.single('image'), addBanner);
app.route("/banners/:id").put(upload.single('image'), updateBanner).delete(deleteBanner);

export default app;
