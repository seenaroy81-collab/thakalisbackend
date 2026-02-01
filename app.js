import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });
import connectDB from "./config/connection.js"
import userRoutes from './routes/userRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import likeRoutes from './routes/likeRoutes.js'
import productRoutes from './routes/productRoutes.js'
import shippingRoutes from "./routes/shippingRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import carouselRoutes from "./routes/carouselRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import instance from "./config/razorpay.js";
import cors from "cors";


const app = express();

if (!process.env.JWT_SECRET_KEY) {
  console.warn("WARNING: JWT_SECRET_KEY is not defined in .env file");
}

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://e-commerce-ui-731u.vercel.app",
    "https://ecommerce-thakalis.vercel.app"
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;
app.get("/", (req, res) => {
  res.send("Hello world !");
});

export { instance };


app.use("/user", userRoutes)
app.use("/admin", adminRoutes)
app.use("/cart", cartRoutes)
app.use("/order", orderRoutes)
app.use("/likes", likeRoutes)
app.use('/products', productRoutes)
app.use('/shipping', shippingRoutes)

app.use('/banners', bannerRoutes)
app.use('/carousels', carouselRoutes)
app.use('/stores', storeRoutes)







app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

connectDB().catch(err => {
  console.error("Failed to connect to MongoDB:", err.message);
});


