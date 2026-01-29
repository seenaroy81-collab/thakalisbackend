import mongoose from "mongoose";

const carouselSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    subtitle: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    buttonText: {
        type: String,
        default: "Shop Now"
    },
    buttonLink: {
        type: String,
        default: "#"
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Carousel = mongoose.model('Carousel', carouselSchema);

export default Carousel;
