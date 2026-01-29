import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  cartIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: true,
    },
  ],
  address: {
    type: String,
    required: true,
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },
  storeName: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
  },
  razorpayOrderId: {
    type: String,
    required: false,
  },
  razorpayPaymentId: {
    type: String,
    required: false,
  },
  razorpaySignature: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "cancelled"],
    default: "pending"
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Completed", "Failed"],
    default: "Pending",
  },
  paymentMethod: {
    type: String,
    default: "RAZORPAY",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model("Order", orderSchema);
export default Order;