import express from 'express'
import { login, logout, signup, refreshToken, getProfile } from '../controllers/auth.controllers.js'
import { protectRoute } from '../middlewares/auth.middlewares.js'

const router = express.Router()

router.post("/signup", signup)
router.post("/login", login)
router.post("/logout", logout)
router.post("/refresh-token", refreshToken)

router.get("/profile", protectRoute, getProfile)


export default router