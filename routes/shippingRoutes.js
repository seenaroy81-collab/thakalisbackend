import express from "express";
import { shipOrder } from "../controller/shippingController.js";


const app = express.Router();

app.route("/:orderId").post(shipOrder)

export default app;





