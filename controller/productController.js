import Product from "../modals/productSchema.js";

const getProductById = async (req, res) => {
  try {
    // Correct way to extract param
    const id = req.params.id;
    console.log("id in backend ", id);


    // Fetch product by your custom foodId field
    const product = await Product.findOne({ _id: id })
      .populate("storeId", "storeName address contact cuisine rating openingHours image")
      .populate("restaurantId", "restaurantsName address contact cuisine rating openingHours image")
      .lean();
    console.log("product are ..", product);

    if (!product) {
      return res.status(404).json({
        msg: "Food item not found",
      });
    }

    // Normalize and Alias for frontend
    const normalizedProduct = {
      ...product,
      name: product.name || product.productName,
      image: product.image || (product.images && product.images.length > 0 ? product.images[0] : null)
    };

    if (product.restaurantId && !product.storeId) {
      normalizedProduct.storeId = {
        ...product.restaurantId,
        storeName: product.restaurantId.restaurantsName || product.restaurantId.storeName
      };
    }

    res.status(200).json({
      msg: "Food item fetched successfully",
      data: normalizedProduct,
    });
  } catch (err) {
    console.error("Error fetching food item:", err);
    res.status(500).json({
      msg: "Error occurred during fetching of food item",
      error: err.message,
    });
  }
};


export { getProductById }