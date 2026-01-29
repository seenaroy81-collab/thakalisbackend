import bcrypt from "bcrypt";
import mongoose from "mongoose";

var Schema = mongoose.Schema;
var userSchema = new Schema({
  fullName: {
    type: String,
    // required: true,
  },
  phoneNumber: {
    type: Number,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    // required: true,
  },
  address: {
    type: String,
  },
  pincode: {
    type: Number,
  },
  password: {
    type: String,
    // required: true,
  },
  otp: {
    type: String,
    default: null,
  },
  otpExpiry: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
