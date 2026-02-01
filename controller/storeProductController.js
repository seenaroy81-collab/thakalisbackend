import Product from "../modals/productSchema.js";
import { protectStore } from "../middleWare/storeMiddleWare.js";
import Banner from "../modals/bannerSchema.js";
import Category from "../modals/categorySchema.js";
import Store from "../modals/storeSchema.js";
import Carousel from "../modals/carouselSchema.js";

// Add a new product
export const addProduct = async (req, res) => {
    try {
        const { productName, category, description, price, maxQuantity, quantity } = req.body;
        const storeId = req.store._id;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ msg: "Please upload at least one product image" });
        }

        const imagePaths = req.files.map(file => file.path);

        console.log("Adding product with category:", category);

        // Resolve Category Name or ID to a valid ObjectId
        let categoryId = null;
        if (category) {
            // 1. Check if it's already a valid ObjectId
            if (mongoose.Types.ObjectId.isValid(category)) {
                categoryId = category;
            } else {
                // 2. Try to find by name (case-insensitive)
                const cat = await Category.findOne({
                    name: { $regex: new RegExp(`^${category.trim()}$`, "i") }
                });

                if (cat) {
                    categoryId = cat._id;
                } else {
                    // 3. Create if not found
                    console.log("Category not found, creating new category:", category);
                    const newCat = await Category.create({
                        name: category.trim(),
                        image: imagePaths[0] || 'default_category.jpg'
                    });
                    categoryId = newCat._id;
                }
            }
        }

        console.log("Resolved categoryId:", categoryId);

        const newProduct = new Product({
            storeId,
            productName,
            category: categoryId,
            description,
            price,
            maxQuantity,
            quantity: quantity !== undefined ? quantity : maxQuantity,
            images: imagePaths,
        });

        await newProduct.save();
        res.status(201).json({ msg: "Product added successfully", data: newProduct });
    } catch (err) {
        console.error("Error adding product:", err.message);
        res.status(400).json({ msg: "Failed to add product", error: err.message });
    }
};

// Get all products for the logged-in store
export const getStoreProducts = async (req, res) => {
    try {
        const storeId = req.store._id;
        const products = await Product.find({ storeId });
        res.status(200).json({ data: products });
    } catch (err) {
        res.status(400).json({ msg: "Failed to fetch products", error: err.message });
    }
};

// Update product details
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const storeId = req.store._id;

        // Check if product belongs to this store
        const product = await Product.findOne({ _id: id, storeId });
        if (!product) {
            return res.status(404).json({ msg: "Product not found or unauthorized" });
        }

        // Update with images if provided
        let updateData = { ...req.body };
        if (req.files && req.files.length > 0) {
            updateData.images = req.files.map(file => file.path);
        }

        // Resolve Category if it's being updated
        if (updateData.category) {
            console.log("Updating product with category:", updateData.category);

            // 1. Check if it's already a valid ObjectId
            if (mongoose.Types.ObjectId.isValid(updateData.category)) {
                // Already an ID, no change needed
            } else {
                // 2. Try to find by name (case-insensitive)
                const cat = await Category.findOne({
                    name: { $regex: new RegExp(`^${updateData.category.trim()}$`, "i") }
                });

                if (cat) {
                    updateData.category = cat._id;
                } else {
                    // 3. Create if not found
                    console.log("Category not found in update, creating:", updateData.category);
                    const newCat = await Category.create({
                        name: updateData.category.trim(),
                        image: updateData.images?.[0] || 'default_category.jpg'
                    });
                    updateData.category = newCat._id;
                }
            }
            console.log("Resolved update categoryId:", updateData.category);
        }

        const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });
        res.status(200).json({ msg: "Product updated successfully", data: updatedProduct });
    } catch (err) {
        res.status(400).json({ msg: "Failed to update product", error: err.message });
    }
};

// Toggle product availability
export const toggleAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const storeId = req.store._id;

        const product = await Product.findOne({ _id: id, storeId });
        if (!product) {
            return res.status(404).json({ msg: "Product not found or unauthorized" });
        }

        product.isAvailable = !product.isAvailable;
        await product.save();

        res.status(200).json({
            msg: `Product is now ${product.isAvailable ? 'available' : 'unavailable'}`,
            data: product
        });
    } catch (err) {
        res.status(400).json({ msg: "Failed to toggle availability", error: err.message });
    }
};

// Delete a product
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const storeId = req.store._id;

        const product = await Product.findOneAndDelete({ _id: id, storeId });
        if (!product) {
            return res.status(404).json({ msg: "Product not found or unauthorized" });
        }

        res.status(200).json({ msg: "Product deleted successfully" });
    } catch (err) {
        res.status(400).json({ msg: "Failed to delete product", error: err.message });
    }
};

// Public: Get all products for all stores
// Public: Get all products for all stores with pagination and filtering
export const getAllPublicProducts = async (req, res) => {
    try {
        console.log("getAllPublicProducts - req.query:", req.query);
        const { page = 1, limit = 10, storeId } = req.query;
        const skip = (page - 1) * limit;

        const query = { isAvailable: true };
        if (storeId) {
            // Handle array of storeIds
            if (Array.isArray(storeId)) {
                query.storeId = { $in: storeId };
            } else {
                query.storeId = storeId;
            }
        }

        // Get total count for pagination
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        // Fetch products with pagination
        const products = await Product.find(query)
            .populate("storeId", "storeName address image description")
            .lean()
            .skip(Number(skip))
            .limit(Number(limit));

        // Normalize fields for frontend compatibility
        const normalizedProducts = products.map(product => {
            const normalized = {
                ...product,
                name: product.name || product.productName,
                image: product.image || (product.images && product.images.length > 0 ? product.images[0] : null),
                stock: product.quantity, // Added stock alias for easier tracking
                maxStock: product.maxQuantity
            };

            // Alias restaurantId to storeId if it exists
            if (product.restaurantId && !product.storeId) {
                normalized.storeId = product.restaurantId;
                if (typeof normalized.storeId === 'object' && normalized.storeId !== null) {
                    normalized.storeId.storeName = normalized.storeId.restaurantsName || normalized.storeId.storeName || "Unknown Restaurant";
                }
            }

            return normalized;
        });

        // Fetch store name if storeId is provided
        let storeName = null;
        if (storeId) {
            console.log("getAllPublicProducts - storeId from query:", storeId);
            const ids = Array.isArray(storeId) ? storeId : [storeId];
            console.log("getAllPublicProducts - ids to find:", ids);
            const stores = await Store.find({ _id: { $in: ids } }).select("storeName");
            console.log("getAllPublicProducts - found stores:", stores);

            if (stores.length > 0) {
                const names = stores.map(store => store.storeName);
                // Return single string if only one ID was passed (to maintain backward compatibility), otherwise return array
                storeName = Array.isArray(storeId) ? names : names[0];
            }
        }

        // Fetch all stores for frontend filter
        const allStores = await Store.find({ isActive: true }).select("storeName _id");

        res.status(200).json({
            success: true,
            data: normalizedProducts,
            pagination: {
                currentPage: Number(page),
                totalPages,
                totalProducts,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            storeName: storeName, // Return specific store name if filtered
            allStores: allStores // Return list of all available stores
        });
    } catch (err) {
        console.error("Error in getAllPublicProducts:", err);
        res.status(400).json({ msg: "Failed to fetch all products", error: err.message });
    }
};

// Public: Get all products for a specific store
export const getPublicStoreProducts = async (req, res) => {
    try {
        const { storeId } = req.params;
        const products = await Product.find({ storeId, isAvailable: true })
            .lean();

        // Normalize fields
        const normalizedProducts = products.map(product => {
            const normalized = {
                ...product,
                name: product.name || product.productName,
                image: product.image || (product.images && product.images.length > 0 ? product.images[0] : null),
                stock: product.quantity,
                maxStock: product.maxQuantity
            };

            // Alias restaurantId to storeId if it exists
            if (product.restaurantId && !product.storeId) {
                normalized.storeId = {
                    ...product.restaurantId.toObject ? product.restaurantId.toObject() : product.restaurantId,
                    storeName: product.restaurantId.restaurantsName || product.restaurantId.storeName
                };
            }

            return normalized;
        });

        res.status(200).json({ data: normalizedProducts });
    } catch (err) {
        res.status(400).json({ msg: "Failed to fetch store products", error: err.message });
    }
};

// Combined endpoint for home page - returns banners, categories, and products
export const getHomeData = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        // Fetch all three datasets in parallel for better performance
        const [banners, categories, products, totalProducts] = await Promise.all([
            Banner.find().lean(),
            Category.find().lean(),
            Product.find({ isAvailable: true })
                .populate("storeId", "storeName address image description")
                .lean()
                .skip(Number(skip))
                .limit(Number(limit)),
            Product.countDocuments({ isAvailable: true })
        ]);

        const totalPages = Math.ceil(totalProducts / limit);

        // Normalize products
        const normalizedProducts = products.map(product => {
            const normalized = {
                ...product,
                name: product.name || product.productName,
                image: product.image || (product.images && product.images.length > 0 ? product.images[0] : null),
                stock: product.quantity,
                maxStock: product.maxQuantity
            };

            // Alias restaurantId to storeId if it exists
            if (product.restaurantId && !product.storeId) {
                normalized.storeId = product.restaurantId;
                if (typeof normalized.storeId === 'object' && normalized.storeId !== null) {
                    normalized.storeId.storeName = normalized.storeId.restaurantsName || normalized.storeId.storeName || "Unknown Restaurant";
                }
            }

            return normalized;
        });

        res.status(200).json({
            success: true,
            data: {
                banners,
                categories,
                products: normalizedProducts,
                pagination: {
                    currentPage: Number(page),
                    totalPages,
                    totalProducts,
                    hasNextPage: Number(page) < totalPages,
                    hasPrevPage: Number(page) > 1
                }
            }
        });
    } catch (err) {
        console.error("Error in getHomeData:", err);
        res.status(500).json({
            success: false,
            msg: "Failed to fetch home data",
            error: err.message
        });
    }
};


// New: Endpoint including Carousels as requested
export const getHomeDataWithCarousel = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        // Fetch all four datasets in parallel
        const [banners, categories, carousels, products, totalProducts] = await Promise.all([
            Banner.find().populate("storeId").lean(),
            Category.find().lean(),
            Carousel.find({ isActive: true }).sort({ order: 1 }).lean(),
            Product.find({ isAvailable: true })
                .populate("storeId", "storeName address image description")
                .lean()
                .skip(Number(skip))
                .limit(Number(limit)),
            Product.countDocuments({ isAvailable: true })
        ]);

        const totalPages = Math.ceil(totalProducts / limit);

        // Normalize products
        const normalizedProducts = products.map(product => {
            const normalized = {
                ...product,
                name: product.name || product.productName,
                image: product.image || (product.images && product.images.length > 0 ? product.images[0] : null),
                stock: product.quantity,
                maxStock: product.maxQuantity
            };

            // Alias restaurantId to storeId if it exists
            if (product.restaurantId && !product.storeId) {
                normalized.storeId = product.restaurantId;
                if (typeof normalized.storeId === 'object' && normalized.storeId !== null) {
                    normalized.storeId.storeName = normalized.storeId.restaurantsName || normalized.storeId.storeName || "Unknown Restaurant";
                }
            }

            return normalized;
        });

        res.status(200).json({
            success: true,
            data: {
                banners,
                carousels,
                categories,
                products: normalizedProducts,
                pagination: {
                    currentPage: Number(page),
                    totalPages,
                    totalProducts,
                    hasNextPage: Number(page) < totalPages,
                    hasPrevPage: Number(page) > 1
                }
            }
        });
    } catch (err) {
        console.error("Error in getHomeDataWithCarousel:", err);
        res.status(500).json({
            success: false,
            msg: "Failed to fetch home data",
            error: err.message
        });
    }
};
