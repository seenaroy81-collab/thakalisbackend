import AsyncHandler from 'express-async-handler'
import Admin from '../modals/adminSchema.js'
import jwt from 'jsonwebtoken'

const protectAdmin = AsyncHandler(async (req, res, next) => {
    try {
        let token = req.headers.token
        if (!token) {
            return res.status(401).json({ msg: 'Not authorized, no token' })
        }

        if (!process.env.JWT_SECRET_KEY) {
            throw new Error('JWT_SECRET_KEY is missing from environment variables');
        }

        let decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
        let isAdmin = await Admin.findOne({ _id: decoded.id })

        if (!isAdmin) {
            res.status(401).json({ msg: 'Not authorized as admin' })
        } else {
            req.admin = isAdmin
            next();
        }

    } catch (error) {
        res.status(401).json({ msg: 'Not authorized, token failed' })
    }
});

export default protectAdmin
