import mongoose from "mongoose";

var bannerSchema = new mongoose.Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: true
    },
    image: {
        type: String,
        required: true
    },
})

const Banner = mongoose.model('Banner', bannerSchema);

export default Banner;