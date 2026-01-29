import Order from "../modals/orderSchema.js";

// Get all orders for the logged-in store
export const getStoreOrders = async (req, res) => {
    try {
        const storeId = req.store._id;
        const orders = await Order.find({ storeId })
            .populate("userId", "name email phone")
            .populate({
                path: "cartIds",
                populate: { path: "foodId" }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: orders });
    } catch (err) {
        console.error("Error in getStoreOrders:", err);
        res.status(500).json({ success: false, msg: "Failed to fetch orders", error: err.message });
    }
};

// Update order status (Approve, Ship, Deliver, or Cancel)
export const updateStoreOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const storeId = req.store._id;

        const order = await Order.findOne({ _id: id, storeId });

        if (!order) {
            return res.status(404).json({ success: false, msg: "Order not found" });
        }

        // Logic: specific rule "after approve cannot be cancel"
        // Assuming "preparing", "Shipped", "delivered" means approved.
        // "pending" is before approval.

        if (status === "cancelled") {
            if (order.status !== "pending") {
                return res.status(400).json({
                    success: false,
                    msg: "Cannot cancel order that has already been approved or processed."
                });
            }
        }

        // 2. Cannot reject if already approved
        if (status === "rejected") {
            if (order.status === "approved" || order.status === "preparing" || order.status === "Shipped" || order.status === "delivered") {
                return res.status(400).json({
                    success: false,
                    msg: "Cannot reject an order that has already been approved."
                });
            }
        }

        // 3. Cannot approve if already rejected
        if (status === "approved") {
            if (order.status === "rejected") {
                return res.status(400).json({
                    success: false,
                    msg: "Cannot approve an order that has already been rejected."
                });
            }
            // Also cannot re-approve if already approved/cancelled (existing logic)
            if (order.status === "approved" || order.status === "cancelled") {
                return res.status(400).json({
                    success: false,
                    msg: "Order is already processed."
                });
            }
        }

        // If trying to cancel, or change to any other status, proceed
        order.status = status;
        await order.save();

        res.status(200).json({
            success: true,
            msg: `Order status updated to ${status}`,
            data: order
        });

    } catch (err) {
        console.error("Error in updateStoreOrderStatus:", err);
        res.status(500).json({ success: false, msg: "Failed to update order status", error: err.message });
    }
};
