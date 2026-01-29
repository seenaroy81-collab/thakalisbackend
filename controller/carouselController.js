import Carousel from "../modals/carouselSchema.js";

// Add new carousel
export const addCarousel = async (req, res) => {
    try {
        const { title, subtitle, buttonText, buttonLink, order } = req.body;

        if (!req.file) {
            return res.status(400).json({ msg: "No image file uploaded" });
        }

        const newCarousel = new Carousel({
            title,
            subtitle,
            image: req.file.path,
            buttonText: buttonText || "Shop Now",
            buttonLink: buttonLink || "#",
            order: order || 0
        });

        await newCarousel.save();
        res.status(201).json({
            success: true,
            msg: "Carousel added successfully",
            data: newCarousel
        });
    } catch (err) {
        res.status(400).json({ success: false, err: err.message });
    }
};

// Get all carousels (for admin)
export const getAllCarousels = async (req, res) => {
    try {
        const carousels = await Carousel.find().sort({ order: 1, createdAt: -1 });
        res.status(200).json({
            success: true,
            data: carousels
        });
    } catch (err) {
        res.status(400).json({ success: false, err: err.message });
    }
};

// Get active carousels (for public/frontend) - limit to 3
export const getActiveCarousels = async (req, res) => {
    try {
        const carousels = await Carousel.find({ isActive: true })
            .sort({ order: 1, createdAt: -1 })
            .limit(3);
        res.status(200).json({
            success: true,
            data: carousels
        });
    } catch (err) {
        res.status(400).json({ success: false, err: err.message });
    }
};

// Update carousel
export const updateCarousel = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, subtitle, buttonText, buttonLink, order, isActive } = req.body;

        const carousel = await Carousel.findById(id);
        if (!carousel) {
            return res.status(404).json({ success: false, msg: "Carousel not found" });
        }

        // Update image if new file is uploaded
        if (req.file) {
            carousel.image = req.file.path;
        }

        // Update other fields
        if (title) carousel.title = title;
        if (subtitle) carousel.subtitle = subtitle;
        if (buttonText) carousel.buttonText = buttonText;
        if (buttonLink) carousel.buttonLink = buttonLink;
        if (order !== undefined) carousel.order = order;
        if (isActive !== undefined) carousel.isActive = isActive;

        await carousel.save();
        res.status(200).json({
            success: true,
            msg: "Carousel updated successfully",
            data: carousel
        });
    } catch (err) {
        res.status(400).json({ success: false, err: err.message });
    }
};

// Delete carousel
export const deleteCarousel = async (req, res) => {
    try {
        const { id } = req.params;
        const carousel = await Carousel.findByIdAndDelete(id);

        if (!carousel) {
            return res.status(404).json({ success: false, msg: "Carousel not found" });
        }

        res.status(200).json({
            success: true,
            msg: "Carousel deleted successfully"
        });
    } catch (err) {
        res.status(400).json({ success: false, err: err.message });
    }
};

// Toggle carousel active status
export const toggleCarouselStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const carousel = await Carousel.findById(id);

        if (!carousel) {
            return res.status(404).json({ success: false, msg: "Carousel not found" });
        }

        carousel.isActive = !carousel.isActive;
        await carousel.save();

        res.status(200).json({
            success: true,
            msg: `Carousel ${carousel.isActive ? 'activated' : 'deactivated'} successfully`,
            data: carousel
        });
    } catch (err) {
        res.status(400).json({ success: false, err: err.message });
    }
};
