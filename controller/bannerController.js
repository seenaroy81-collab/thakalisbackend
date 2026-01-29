import Banner from "../modals/bannerSchema.js";

export const addBanner = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: "No image file uploaded" });
        }
        const newBanner = new Banner({
            image: req.file.path
        });
        await newBanner.save();
        res.status(201).json({ msg: "Banner added successfully", data: newBanner });
    } catch (err) {
        res.status(400).json({ err: err.message });
    }
};

export const getBanners = async (req, res) => {
    try {
        const banners = await Banner.find();
        res.status(200).json({ data: banners });
    } catch (err) {
        res.status(400).json({ err: err.message });
    }
};

export const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const banner = await Banner.findByIdAndDelete(id);
        if (!banner) {
            return res.status(404).json({ msg: "Banner not found" });
        }
        res.status(200).json({ msg: "Banner deleted successfully" });
    } catch (err) {
        res.status(400).json({ err: err.message });
    }
};