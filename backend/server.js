import express from "express";
import authRoutes from './routes/auth.route.js'
import productRoutes from './routes/product.route.js'
import cartRoutes from './routes/cart.route.js'
import couponsRoutes from './routes/coupons.route.js'
import paymentRoutes from './routes/payment.route.js'
import analyticsRoutes from './routes/analytics.route.js'
import path from 'path'
import { connectToMongoDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import { configDotenv } from "dotenv";

configDotenv()
const app = express()
const PORT = process.env.PORT || 5000
const __dirname =  path.resolve()

app.use(express.json({ limit: "10mb" }))
app.use(cookieParser())


app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/coupons', couponsRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/analytics', analyticsRoutes)

if(process.env.NODE_ENV === "production"){
    app.use(express.static(path.join(__dirname,'/frontend/dist')))

    app.get("*", (req,res)=>{
        res.sendFile(path.resolve(__dirname,"frontend",'dist', 'index.html'))
    })
}


app.listen(PORT, () => {
    console.log("Server is Running on http://localhost:" + PORT);
    connectToMongoDB()
})
