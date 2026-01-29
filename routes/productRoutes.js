import express from "express";
import { getProductById } from "../controller/productController.js";
import { getAllPublicProducts } from "../controller/storeProductController.js";

const router = express.Router();

router.get("/", getAllPublicProducts);
router.get("/:id", getProductById);

export default router;
