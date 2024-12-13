import express from 'express'
import { getAllProducts, getFeaturedProducts, toggleFeaturedProduct, getProductByCategory, getRecommendationProduct, deleteProduct, createProduct } from '../controllers/product.controllers.js'
import { adminRoute, protectRoute } from '../middlewares/auth.middlewares.js'

const router = express.Router()

router.get('/', protectRoute, adminRoute, getAllProducts)
router.get('/featured', getFeaturedProducts)
router.get('/recommendations', getRecommendationProduct)
router.get('/category/:category', getProductByCategory)
router.post('/', protectRoute, adminRoute, createProduct)
router.patch('/:id', protectRoute, adminRoute, toggleFeaturedProduct)
router.delete('/:id', protectRoute, adminRoute, deleteProduct)

// Start from 1:42:27

export default router