import jwt from "jsonwebtoken";
import User from "../models/user.models.js";

export const protectRoute = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;
        if (!accessToken) {
            return res.status(401).json({ message: "Unauthorized - No token provided" })
        }
        try {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
            const user = await User.findById(decoded.userId).select("-password")
            if (!user) {
                return res.status(401).json({ message: "User not found!" })
            }

            req.user = user
            next()
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return res.status(400).json({ message: "Unauthorized Access token is expired" })
            }
            throw error
        }

    } catch (error) {
        console.log('Error Occur in Protect Routes: ', error.message);
        res.status(401).json({ message: 'Unauthorized - Invalid access Token', error: error.message })
    }
}



export const adminRoute = async (req, res, next) => {
    console.log('hellooo');
    if (req.user && req.user.role === 'admin') {
        console.log('hellooo2');
        next()
    } else {
        return res.status(403).json({ message: " Access denied - Admin Only" })
    }
}