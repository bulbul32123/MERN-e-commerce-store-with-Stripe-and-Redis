import express from 'express'
import { protectRoute } from '../middlewares/auth.middlewares.js'
import { getCoupons, validateCoupon } from '../controllers/coupons.controllers.js'

const router = express.Router()

router.get('/', protectRoute, getCoupons)
router.post('/validate', protectRoute, validateCoupon)



export default router