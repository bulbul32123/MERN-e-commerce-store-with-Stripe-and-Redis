import mongoose from "mongoose";


export const connectToMongoDB = async () => {
    try {
        const connect = await mongoose.connect(process.env.MONGO_URL)
        if (connect) console.log(`MongoDb is Connected`);
        
    } catch (error) {
        console.log('Error connection to MongoDB ', error);
        process.exit(1) 

    }
}
