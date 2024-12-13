import User from "../models/user.models.js"
import { redis } from '../lib/redis.js'
import jwt from 'jsonwebtoken'


const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h',
    })
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '7d',
    })
    return { accessToken, refreshToken }
}
const storeRefreshToken = async (userId, refreshToken) => {
    await redis.set(`refresh_Token:${userId}`, refreshToken, 'EX', 7 * 24 * 60 * 60)
}
const setCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000,
    })
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    })
}


export const signup = async (req, res) => {
    const { email, password, name } = req.body
    console.log(email);
    try {
        const existingUser = await User.findOne({ email }) // Checking if user already exist in db
        if (existingUser) { // if user exist then send a message that "User already exist"
            return res.status(400).json({ message: "User already exist" })
        } // and if not user exist then create user by email,name, password, and then send a message that "User created successfully" with the current user
        const user = await User.create({ email, password, name })

        const { accessToken, refreshToken } = generateTokens(user._id)

        await storeRefreshToken(user._id, refreshToken)
        setCookies(res, accessToken, refreshToken)

        return res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        })

    } catch (error) {
        console.log('Error in Sign', error.message);
        res.status(500).json({ message: error.message })
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ email })
        if (user && (await user.comparePassword(password))) {
            const { accessToken, refreshToken } = generateTokens(user._id)
            await storeRefreshToken(user._id, refreshToken)
            setCookies(res, accessToken, refreshToken)
            return res.json({ _id: user._id, name: user.name, email: user.email, role: user.role })
        }
    } catch (error) {
        console.log('Error in Login', error.message);
        res.status(500).json({ message: error.message })
    }
}

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken
        if (refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            await redis.del(`refresh_Token:${decoded.userId}`)
        }
        res.clearCookie('accessToken')
        res.clearCookie('refreshToken')
        res.json({ message: "Logged Out successfully" })
    } catch (error) {
        console.log('Error in Logout', error.message);
        res.status(500).json({ message: "Server Error", error: error.message })
    }
}

export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken
        if (!refreshToken) {
            return res.status(401).json({ message: "NO Refresh token Provide" })
        }
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const storedToken = await redis.get(`refresh_Token:${decoded.userId}`)
        if (storedToken !== refreshToken) {
            return res.status(401).json({ message: "Refresh token is invalid" })
        }
        const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" })
        console.log(accessToken);
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000,
        });
        return res.json({ message: "Token Refresh Successfully" })

    } catch (error) {
        return res.status(500).json({ message: "Server Error!", error: error.message })
    }
}





export const getProfile = async (req, res) => {
    try {
        return res.json(req.user)
    } catch (error) {
        console.log('Error Occur in get profile: ', error);

    }
}