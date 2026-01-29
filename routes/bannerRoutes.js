import express from "express";
import { addBanner, getBanners, deleteBanner } from "../controller/bannerController.js";
import  upload  from "../config/multer.js";

const router = express.Router();

router.route("/")
    .get(getBanners)
    .post(upload.single('image'), addBanner);

router.route("/:id")
    .delete(deleteBanner);

export default router;