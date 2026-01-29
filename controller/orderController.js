import Order from "../modals/orderSchema.js";
import Cart from "../modals/cartSchema.js";
import instance from "../config/razorpay.js";
import crypto from 'crypto';


const createOrder = async (req, res) => {
  const userId = req.user._id;
  const { address, amount } = req.body;

  try {
    console.log("Request body:", req.body);

    if (!amount || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        msg: "Valid amount is required",
      });
    }

    // Get all previously ordered cartIds
    const previousOrders = await Order.find({ userId }).select("cartIds");
    const usedCartIds = previousOrders.flatMap(order =>
      order.cartIds.map(id => id.toString())
    );

    console.log("Previously used cart IDs:", usedCartIds);

    const userCarts = await Cart.find({
      userId,
      _id: { $nin: usedCartIds }
    }).populate({
      path: "foodId",
      populate: {
        path: "storeId",
        select: "_id storeName",
      },
    });

    if (userCarts.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "No new cart items to order",
      });
    }

    // Create Razorpay order once
    const razorpayOrder = await instance.orders.create({
      amount: Number(amount * 100),
      currency: "INR",
    });

    // Create Separate Orders for Each Food Item
    const createdOrders = [];

    for (const cartItem of userCarts) {
      if (!cartItem.foodId) {
        console.warn(`Skipping cart item ${cartItem._id} because foodId is missing`);
        continue;
      }

      const storeId = cartItem.foodId.storeId?._id || cartItem.foodId.storeId;
      const storeName = cartItem.foodId.storeId?.storeName || "Unknown Store";

      const newOrder = await Order.create({
        userId,
        cartIds: [cartItem._id], // single item
        address,
        amount: cartItem.foodId.price * cartItem.quantity,
        razorpayOrderId: razorpayOrder.id,
        paymentStatus: "Pending",
        storeId: storeId,
        storeName: storeName,
      });

      createdOrders.push(newOrder);
    }

    res.status(201).json({
      success: true,
      msg: `${createdOrders.length} order(s) created successfully`,
      orders: createdOrders,
      razorpayOrder,
      totalOrders: createdOrders.length,
    });

  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({
      success: false,
      msg: "Failed to create order",
      error: err.message,
    });
  }
};


// Add this new controller for handling payment failures
const handlePaymentFailure = async (req, res) => {
  try {
    const { razorpay_order_id, error } = req.body;

    const order = await Order.findOne({
      razorpayOrderId: razorpay_order_id
    });

    if (order) {
      order.paymentStatus = "Failed";
      await order.save();
    }

    res.status(200).json({
      success: true,
      msg: "Payment failure recorded",
      paymentStatus: "Failed"
    });
  } catch (error) {
    console.error("Error handling payment failure:", error);
    res.status(500).json({
      success: false,
      msg: "Failed to update payment status"
    });
  }
};



const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      address,
      amount
    } = req.body;

    console.log("Verifying payment:", req.body);

    // Find all orders associated with this Razorpay order ID
    const orders = await Order.find({
      razorpayOrderId: razorpay_order_id
    });

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        msg: "Orders not found"
      });
    }

    // Verify Razorpay signature
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    // Check if signature matches
    if (generated_signature === razorpay_signature) {
      // Payment SUCCESS - Update all associated orders
      for (const order of orders) {
        order.paymentStatus = "Completed";
        order.razorpayPaymentId = razorpay_payment_id;
        order.razorpaySignature = razorpay_signature;
        await order.save();
      }

      // Clear the cart after successful payment
      // await Cart.deleteMany({ userId: order.userId });

      return res.status(200).json({
        success: true,
        msg: "Payment verified successfully",
        ordersCount: orders.length,
        razorpayOrderId: razorpay_order_id,
        paymentStatus: "Completed"
      });
    } else {
      // Payment FAILED - Signature mismatch
      for (const order of orders) {
        order.paymentStatus = "Failed";
        await order.save();
      }

      return res.status(400).json({
        success: false,
        msg: "Payment verification failed - Invalid signature",
        paymentStatus: "Failed"
      });
    }
  } catch (error) {
    console.error("Verification error:", error);

    // If error occurs, try to mark order as failed
    if (req.body.razorpay_order_id) {
      await Order.updateMany(
        { razorpayOrderId: req.body.razorpay_order_id },
        { paymentStatus: "Failed" }
      );
    }

    return res.status(500).json({
      success: false,
      msg: "Payment verification failed",
      error: error.message,
      paymentStatus: "Failed"
    });
  }
};


const deleteOrder = async (req, res) => {
  try {
    let id = req.params.id;
    const deleteOrder = await Order.findByIdAndDelete(id);
    res.status(201).json({
      msg: "Order deleted successfully",
      data: deleteOrder,
    });
  } catch (err) {
    res.status(400).json(err);
  }
};

const getOrders = async (req, res) => {
  const userId = req.user._id;
  try {
    const orderDetails = await Order.find({ userId })
      .populate("storeId", "storeName")
      .populate({
        path: "cartIds",
        populate: {
          path: "foodId",
          populate: {
            path: "category"
          }
        },
      })
      .lean();

    res.status(200).json({
      success: true,
      msg: "Orders fetched successfully",
      data: orderDetails,
    });
  } catch (err) {
    console.error("[DEBUG] ERROR in getOrders:", err);
    res.status(500).json({
      success: false,
      msg: "System error while fetching orders",
      error: err.message
    });
  }
};

const processPayment = async (req, res) => {
  try {
    const options = {
      amount: Number(req.body.amount * 100), // amount in paise
      currency: "INR",
    };

    const order = await instance.orders.create(options); // fixed syntax

    res.status(200).json({
      success: true,
      order,
    });
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    res.status(500).json({
      success: false,
      msg: "Failed to create order",
      error: err.message,
    });
  }
};

const getKey = async (req, res) => {
  res.status(200).json({
    key: process.env.RAZORPAY_KEY_ID,
  });
};

const getAllOrders = async (req, res) => {
  try {
    const orderDetails = await Order.find()
      .populate({ path: "userId", select: "fullName email" })
      .populate({
        path: "cartIds",
        populate: {
          path: "foodId",
          populate: {
            path: "storeId",
            select: "storeName",
          },
        },
      });

    res.status(200).json({
      msg: "All orders fetched successfully",
      data: orderDetails,
    });
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
};


const updateOrder = async (req, res) => {
  try {
    let id = req.params.id;
    const updateOrder = await Order.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.status(201).json({
      msg: "Order updated successfully",
      data: updateOrder,
    });
  } catch (err) {
    res.status(400).json(err);
  }
};

const returnOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Optional: check if order exists
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Optional: ensure only delivered orders can be returned
    if (existingOrder.status !== "Delivered") {
      return res.status(400).json({ message: "Only delivered orders can be returned" });
    }

    // Update order status and include any additional info from request body
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "Return Initiated",
          returnReason: req.body.returnReason || "Not specified",
          returnRequestedAt: new Date(),
        },
      },
      { new: true }
    );

    res.status(200).json({
      message: "Return initiated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Error in returnOrder:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
}

export {
  createOrder,
  verifyPayment,
  deleteOrder,
  getOrders,
  getAllOrders,
  updateOrder,
  processPayment,
  getKey,
  handlePaymentFailure,
  returnOrder
};