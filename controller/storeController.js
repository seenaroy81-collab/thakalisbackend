import Store from "../modals/storeSchema.js";
import generateToken from "../utils/generateToken.js";

const storeSignup = async (req, res) => {
    const { contact, email: topLevelEmail } = req.body;
    const email = topLevelEmail || contact?.email;

    try {
        if (!email) {
            return res.status(400).json({ msg: "Email is required" });
        }

        const existStore = await Store.findOne({ "contact.email": email });
        if (existStore) {
            return res.status(400).json({
                msg: "Store already exists with this email",
            });
        }

        const storeData = { ...req.body };
        if (topLevelEmail && !storeData.contact) {
            storeData.contact = { email: topLevelEmail };
        } else if (topLevelEmail) {
            storeData.contact.email = topLevelEmail;
        }

        const store = await Store.create(storeData);
        res.status(201).json({
            msg: "Store registered successfully",
            data: store,
        });
    } catch (err) {
        console.error("Store Signup Error:", err);
        res.status(400).json({
            msg: "Failed to register store",
            error: err.message,
        });
    }
};

const storeLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ msg: "Email and password are required" });
        }

        const store = await Store.findOne({ "contact.email": email });

        if (!store) {
            return res.status(400).json({
                msg: "Store not found",
            });
        }

        const isMatch = await store.matchPassword(password);

        if (!isMatch) {
            return res.status(400).json({
                msg: "Incorrect password",
            });
        }

        return res.status(200).json({
            msg: "Store login successful",
            data: {
                _id: store._id,
                storeName: store.storeName,
                email: store.contact.email,
                token: generateToken(store._id),
            },
        });
    } catch (err) {
        console.error("Store Login Error:", err.message);
        return res.status(500).json({
            msg: "Server error",
            error: err.message,
        });
    }
};

export { storeSignup, storeLogin };
