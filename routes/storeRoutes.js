import express from "express";
import { storeSignup, storeLogin } from "../controller/storeController.js";
import {
    addProduct,
    getStoreProducts,
    updateProduct,
    toggleAvailability,
    deleteProduct,
    getAllPublicProducts,
    getPublicStoreProducts,
    getHomeDataWithCarousel,
    getHomeData
} from "../controller/storeProductController.js";
import { protectStore } from "../middleWare/storeMiddleWare.js";
import upload from "../config/multer.js";

const router = express.Router();

// Auth routes
router.post("/signup", storeSignup);
router.post("/login", storeLogin);

// Public product routes
router.get("/home", getHomeData); // Combined endpoint for banners, categories, and products (No Carousel)
router.get("/home-carousel", getHomeDataWithCarousel); // Combined endpoint INCLUDING Carousel
router.get("/", getAllPublicProducts);
router.get("/public/products/:storeId", getPublicStoreProducts);

// Product management routes (Protected)
router.use(protectStore); // Apply protection to all routes below

router.route("/products")
    .get(getStoreProducts)
    .post(upload.array('images', 5), addProduct);

router.route("/products/:id")
    .put(upload.array('images', 5), updateProduct)
    .delete(deleteProduct);

router.patch("/products/:id/availability", toggleAvailability);

// Order management routes (Protected)
import { getStoreOrders, updateStoreOrderStatus } from "../controller/storeOrderController.js";
router.get("/orders", getStoreOrders);
router.patch("/orders/:id/status", updateStoreOrderStatus);

export default router;
