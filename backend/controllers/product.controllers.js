import cloudinary from "../lib/cloudinary.js";
import { redis } from "../lib/redis.js";
import { Product } from "../models/product.models.js";

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        return res.status(200).json({ products, message: 'Get All Products Successfully' })
    } catch (error) {
        console.log('Error Occur in Product Controller: ', error.message);
        res.status(500).json({ message: 'Server Error', error: error.message })
    }
}
export const getFeaturedProducts = async (req, res) => {
    try {
        let featuredProducts = await redis.get("featured_products")
        if (featuredProducts) {
            return res.json(JSON.parse(featuredProducts))
        }
        console.log("featuredProducts:", featuredProducts);
        featuredProducts = await Product?.find({ isFeatured: true }).lean();
        if (!featuredProducts) {
            return res.status(404).json({ message: "No featured Products Found" })
        }
        await redis.set("featured_products", JSON.parse(featuredProducts))
        return res.json(featuredProducts)
    } catch (error) {
        console.log('Error Occur in product Controller: ', error);
        return res.status(500).json({ message: "Server Error", error: error.message })
    }
}


export const createProduct = async (req, res) => {
    try {
        const { name, description, price, image, category } = req.body;
        let cloudinaryResponse = null;

        if (image) {
            cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
        }

        const product = await Product.create({
            name,
            description,
            price,
            image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
            category,
        });

        return res.status(201).json(product);
    } catch (error) {
        console.log("Error in createProduct controller", error);
        res.status(500).json({ message: "Server error", error: error });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product Not Found" })
        }
        if (product.image) {
            const publicId = product.image.split("/").pop().split(".")[0]
            try {
                await cloudinary.uploader.destroy(`products/${publicId}`)
                console.log("Deleted image from cloudinary");
            } catch (error) {
                console.log('Error Occur in Deleting image: ', error);
            }
        }
        await Product.findByIdAndDelete(req.params.id)
        res.json({ message: "Product Deleted Successfully" })
    } catch (error) {
        console.log('Error Occur in Here: ', error);
        res.status(500).json({ message: "Server Error", error: error.message })
    }
}

export const getRecommendationProduct = async (req, res) => {
    try {
        const products = await Product.aggregate([
            {
                $sample: { size: 3 }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    image: 1,
                    price: 1
                }
            }
        ])
        res.json(products)
    } catch (error) {
        console.log('Error Occur in Here: ', error);
        res.status(500).json({ message: "Server Error", error: error.message })
    }
}


export const getProductByCategory = async (req, res) => {
    try {
        const { category } = req.params
        const products = await Product.find({ category });
        res.json(products)

    } catch (error) {
        console.log('Error Occur in Here: ', error);
        res.status(500).json({ message: "Server Error", error: error.message })
    }
}



export const toggleFeaturedProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
        if (product) {
            product.isFeatured = !product.isFeatured
            const updatedProduct = await product.save()
            await updatedFeaturedProductsCache()
            res.json(updatedProduct)
        } else {
            res.status(404).json({ message: "Product Not Found" })
        }
    } catch (error) {
        console.log('Error Occur in Here: ', error);
        res.status(500).json({ message: "Server Error", error: error.message })
    }
}


async function updatedFeaturedProductsCache() {
    try {
        const featuredProducts = await Product.find({ isFeatured: true }).lean();
        await redis.set('featured_products', JSON.stringify(featuredProducts))

    } catch (error) {
        console.log(("error in update cache function"));
    }
}