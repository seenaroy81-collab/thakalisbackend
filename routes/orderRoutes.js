import { createOrder, deleteOrder,updateOrder,getOrders,getAllOrders,processPayment,getKey,verifyPayment,handlePaymentFailure,returnOrder } from "../controller/orderController.js";
import protect from "../middleWare/userMiddleWare.js";
import express from "express";

const app = express.Router();
app.route("/").post(protect,createOrder).get(protect,getOrders);
app.route("/verify").post(protect, verifyPayment);
app.route("/payment-failed").post(protect, handlePaymentFailure);  
app.route("/payment").post(processPayment).get(getKey)
app.route('/getAll').get(getAllOrders)
app.route("/:id").delete(protect,deleteOrder).put(protect,updateOrder)
app.route("/return/:id").put(returnOrder)


//update admin order not done

export default app;
