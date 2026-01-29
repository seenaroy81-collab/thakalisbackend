import jwt from 'jsonwebtoken'

const generateToken = (id, expiresIn = '10d') => {
    if (!process.env.JWT_SECRET_KEY) {
        throw new Error('JWT_SECRET_KEY is missing from environment variables');
    }
    return jwt.sign({ id }, process.env.JWT_SECRET_KEY, { expiresIn })
}

export default generateToken