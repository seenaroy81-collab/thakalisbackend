import express from "express";
import {
    addCarousel,
    getAllCarousels,
    getActiveCarousels,
    updateCarousel,
    deleteCarousel,
    toggleCarouselStatus
} from "../controller/carouselController.js";
import upload from "../config/multer.js";

const router = express.Router();

// Public route - get active carousels (limited to 3)
router.get("/active", getActiveCarousels);

// Admin routes
router.post("/add", upload.single('image'), addCarousel);
router.get("/all", getAllCarousels);
router.put("/update/:id", upload.single('image'), updateCarousel);
router.delete("/delete/:id", deleteCarousel);
router.patch("/toggle/:id", toggleCarouselStatus);

export default router;
