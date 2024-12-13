import { Product } from "../models/product.models.js";

export const addToCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user
        const existingItem = user?.cartItem?.find(item => item.id === productId)
        if (existingItem) {
            existingItem.quantity += 1
        } else {
            user?.cartItem?.push(productId)
        }
        await user.save()
        res.json(user.cartItem)
    } catch (error) {
        console.log('Error Occur in Add to Cart: ', error);
        res.status(500).json({ message: "Server Error", error: error.message })
    }
}



export const updateQuantity = async (req, res) => {
    try {
        const { id: productId } = req.params
        const { quantity } = req.body
        const user = req.user
        const existingItem = user.cartItem?.find((item) => item.id === productId)
        if (existingItem) {
            if (quantity === 0) {
                user.cartItem = user?.cartItem.filter(item => item.id !== productId)
                await user.save()
                return res.json(user?.cartItem)
            }
            existingItem.quantity = quantity
            await user.save()
            res.json(user.cartItem)
        } else {
            res.status(404).json({ message: "Product not found" })
        }
    }
    catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message })
    }
}



export const getCartProducts = async (req, res) => {
    try {
        const products = await Product.find({ _id: { $in: req.user.cartItem } });
        const cartItem = products.map(product => {
            const item = req.user.cartItem.find(cartItem => cartItem.id === product.id);
            return { ...product.toJSON(), quantity: item.quantity }
        })
        res.json(cartItem)
    } catch (error) {
        console.log('Error Occur in Here: ', error);
        res.status(500).json({ message: "Server Error", error: error.message })
    }
}



export const removeAllFromCart = async (req, res) => {
    try {
        const { productId } = req.body
        const user = req.user
        if (!productId) {
            user.cartItem = [];
        } else {
            user.cartItem = user.cartItem.filter((item) => item.id !== productId)
        }
        await user.save()
        res.json(user.cartItem)
    } catch (error) {
        console.log('Error Occur in remove all from cart: ', error);
        res.status(500).json({ message: "Server Error", error: error.message })
    }
}