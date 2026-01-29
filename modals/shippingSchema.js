import mongoose from "mongoose";

const shippingSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true },

  // Shipway shipment fields
  shipwayOrderId: { type: String },
  shipwayReturnId: { type: String },
  courierName: { type: String },

  status: { 
    type: String, 
    enum: ["Pending", "Shipped", "Delivered", "Returned", "Cancelled"], 
    default: "Pending" 
  },
  shippedAt: { type: Date },
  returnedAt: { type: Date },
  totalAmount: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

const Shipping = mongoose.model("Shipping", shippingSchema);
export default Shipping;
