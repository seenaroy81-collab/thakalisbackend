import mongoose from "mongoose";
import bcrypt from "bcrypt";

const storeSchema = new mongoose.Schema({
  storeName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
  },
  address: {
    street: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    pincode: {
      type: String,
    },
    country: {
      type: String,
      default: "India",
    },
  },
  contact: {
    phone: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
  },
  password: {
    type: String,
    required: true,
  },
  cuisine: [
    {
      type: String,
    },
  ], // e.g., ["Indian", "Chinese"]
  categories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
  ],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  openingHours: {
    open: {
      type: String,
      default: "09:00",
    },
    close: {
      type: String,
      default: "22:00",
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

storeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

storeSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Store = mongoose.model("Store", storeSchema);
export default Store;
