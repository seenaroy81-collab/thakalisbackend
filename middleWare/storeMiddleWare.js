import AsyncHandler from 'express-async-handler'
import Store from '../modals/storeSchema.js'
import jwt from 'jsonwebtoken'

const protectStore = AsyncHandler(async (req, res, next) => {
    try {
        let token = req.headers.token

        if (!token) {
            return res.status(401).json({ msg: 'Not authorized, no token' })
        }

        if (!process.env.JWT_SECRET_KEY) {
            throw new Error('JWT_SECRET_KEY is missing from environment variables');
        }

        let decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
        let store = await Store.findById(decoded.id)

        if (!store) {
            return res.status(401).json({ msg: 'No store found..' })
        }

        req.store = store
        next();

    } catch (error) {
        console.error("Store Auth Middleware Error:", error.message);
        res.status(401).json({ msg: 'Not authorized, token failed' })
    }
});

export { protectStore };
