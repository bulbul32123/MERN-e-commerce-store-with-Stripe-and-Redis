import { create } from 'zustand';
import toast from 'react-hot-toast';
import { axiosInstance } from '../lib/axios';

export const useCartStore = create((set, get) => ({
    cart: [],
    coupon: null,
    total: 0,
    subTotal: 0,
    isCouponApplied: false,
    applyCoupon: async (code) => {
        try {
            const res = await axiosInstance.post('/coupons/validate', { code });
            set({ coupon: res.data, isCouponApplied: true })
            get().calculateTotals()
            toast.success("Coupon applied successfully.")
        } catch (error) {
            console.log('Error Occur in Here: applyCoupon function', error?.response?.data?.message);

        }
    },
    getMyCoupon: async () => {
        try {
            const res = await axiosInstance.get('/coupons');
            set({ coupon: res.data });
        } catch (error) {
            console.log('Error Occur in Here: getMyCoupon function ', error?.response?.data?.message);
        }
    },
    removeCoupon: async () => {
        set({ coupon: null, isCouponApplied: false })
        get().calculateTotals()
        toast.success("Coupon removed")
    },
    getCartItems: async () => {
        try {
            const res = await axiosInstance.get('/cart');
            set({ cart: res?.data })
            get().calculateTotals()
        } catch (error) {
            set({ cart: [] })
            toast.error(error.response.data.error || "Failed to get cart items")
        }
    },
    addToCart: async (product) => {
        try {
            await axiosInstance.post('/cart', { productId: product._id });
            toast.success("Product added to Cart");
            set((state) => {
                console.log(state);
                const existingItem = state?.cart?.find((item) => item._id === product._id);
                const newCart = existingItem ? state?.cart.map((item) => (item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item)) : [...state.cart, { ...product, quantity: 1 }]
                return { cart: newCart }
            })
            get().calculateTotals()
        } catch (error) {
            toast.error(error.response.data.error || "Failed to add product to Cart")
            console.log('Error Occur in Here: ', error);

        }
    },
    removeFromCart: async (productId) => {
        await axiosInstance.delete(`/cart`, { data: { productId } });
        set(pre => ({ cart: pre.cart.filter(item => item._id !== productId) }))
        get().calculateTotals()
    },
    updateQuantity: async (productId, quantity) => {
        if (quantity === 0) {
            get().removeFromCart(productId)
            return
        }
        await axiosInstance.put(`/cart/${productId}`, { quantity });
        set((pre) => ({
            cart: pre.cart.map((item) => (item._id === productId ? { ...item, quantity } : item))
        }))
        get().calculateTotals()
    },
    calculateTotals: () => {
        const { cart, coupon } = get();
        const subTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        let total = subTotal

        if (coupon) {
            const discount = subTotal * (coupon.discountPercentage / 100);
            total = subTotal - discount
        }
        set({ subTotal, total })
    },
    clearCart: async () => {
        set({ cart: [], coupon: null, total: 0, subtotal: 0 });
    },
}))
