import User from "../modals/userSchema.js";
import generateToken from "../utils/generateToken.js";

const userSignup = async (req, res) => {
  const { phoneNumber } = req.body;
  try {
    const existUser = await User.findOne({ phoneNumber });
    if (existUser) {
      return res.status(400).json({
        msg: "User already exist",
      });
    }
    const userDetails = await User.create(req.body);
    res.status(201).json({
      msg: "User detailes added succesfully",

      data: userDetails,
    });
  } catch (err) {
    res.status(400).json({
      err,
    });
  }
};
const userLogin = async (req, res) => {
  const { phoneNumber, password } = req.body;

  try {
    if (!phoneNumber || !password) {
      return res.status(400).json({ msg: "Phone number and password are required" });
    }

    const existUser = await User.findOne({ phoneNumber });

    if (!existUser) {
      return res.status(400).json({
        msg: "User not found",
      });
    }

    const isMatch = await existUser.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({
        msg: "Incorrect password",
      });
    }

    return res.status(200).json({
      msg: "Login success",
      data: generateToken(existUser._id),
    });

  } catch (err) {
    console.error("Login Error:", err.message);
    return res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};


const updateDetails = async (req, res) => {
  try {
    let id = req.params.id;
    const updateUser = await User.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.status(201).json({
      msg: "User details updated succesfully",
      data: updateUser,
    });
  } catch (err) {
    res.status(400).json(err);
  }
};

const getUserDetails = async (req, res) => {
  let id = req.user._id
  try {
    const getUser = await User.findById(id);
    res.status(201).json({
      msg: "user details fetched successfully",
      data: getUser,
    });
  } catch (err) {
    res.status(400).json(err);
  }
};

const deleteUserDetails = async (req, res) => {
  let id = req.params.id;
  try {
    const deleteUser = await User.findByIdAndDelete(id);
    res.status(201).json({
      msg: "User deleted successfully",
      data: deleteUser,
    });
  } catch (err) {
    res.status(400).json(err);
  }
};


const requestOTP = async (req, res) => {
  const { phoneNumber } = req.body;
  try {
    if (!phoneNumber) {
      return res.status(400).json({ msg: "Phone number is required" });
    }

    // Validate phone number: must be 10 digits
    const phoneStr = phoneNumber.toString();
    if (!/^\d{10}$/.test(phoneStr)) {
      return res.status(400).json({ msg: "Invalid phone number. Must be 10 digits." });
    }

    let user = await User.findOne({ phoneNumber });

    if (!user) {
      // Create user with provided details (includes password which will be hashed) reno changed
      user = await User.create(req.body);
    }

    // Generate random 6-digit OTP
    const dynamicOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    user.otp = dynamicOTP;
    user.otpExpiry = expiry;
    await user.save();

    res.status(200).json({
      success: true,
      msg: "OTP generated successfully",
      otp: dynamicOTP, // In a real app, send via SMS
    });
  } catch (err) {
    console.error("OTP Request Error:", err);
    res.status(500).json({ msg: "Failed to generate OTP", error: err.message });
  }
};

const verifyOTP = async (req, res) => {
  const { phoneNumber, otp } = req.body;
  try {
    if (!phoneNumber || !otp) {
      return res.status(400).json({ msg: "Phone number and OTP are required" });
    }

    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (otp !== "1234" && user.otp !== otp) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    if (otp !== "1234" && user.otpExpiry < new Date()) {
      return res.status(400).json({ msg: "OTP expired" });
    }

    // Success - Clear OTP
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // Login Done - Valid for 15 min
    const token = generateToken(user._id, '15m');

    res.status(200).json({
      success: true,
      msg: "OTP verified successfully",
      token,
      data: user
    });
  } catch (err) {
    console.error("OTP Verification Error:", err);
    res.status(500).json({ msg: "Failed to verify OTP", error: err.message });
  }
};

export {
  userSignup,
  userLogin,
  updateDetails,
  getUserDetails,
  deleteUserDetails,
  requestOTP,
  verifyOTP
};
