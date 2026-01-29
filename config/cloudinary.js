import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

if (!process.env.CLOUDINARY_API_KEY) {
  console.error("❌ CLOUDINARY_API_KEY is missing");
}
if (!process.env.CLOUDINARY_API_SECRET) {
  console.error("❌ CLOUDINARY_API_SECRET is missing");
}
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.error("❌ CLOUDINARY_CLOUD_NAME is missing");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

console.log("✅ Cloudinary configured:", cloudinary.config().cloud_name);

export default cloudinary;
export { cloudinary };
