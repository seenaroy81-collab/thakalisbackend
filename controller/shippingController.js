import Order from "../modals/orderSchema.js";
import Shipping from "../modals/shippingSchema.js";

export const shipOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) return res.status(404).json({ error: "Order not found" });

    const existingShipping = await Shipping.findOne({ orderId: order._id });
    if (existingShipping) {
      return res.status(400).json({
        error: "Order has already been shipped",
        shipping: existingShipping,
      });
    }

    // Mock shipping creation
    const trackingNumber = `TRK${Math.floor(Math.random() * 1000000)}`;
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    const shipping = await Shipping.create({
      orderId: order._id,
      courier: "MockCourier",
      trackingNumber,
      status: "Shipped",
      estimatedDelivery,
    });

    // Update order
    order.shippingId = shipping._id;
    order.status = "Shipped";
    await order.save();

    res.json({ message: "Order shipped successfully", shipping });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to ship order" });
  }
};
