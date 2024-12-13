import Order from "../models/order.model.js"
import User from "../models/user.models.js"

export const getAnalyticsData = async (req, res) => {
    const totalUsers = await User.countDocuments()
    const totalProducts = await User.countDocuments()
    const salesData = await Order.aggregate([
        {
            $group: {
                _id: null, // it groups all the document together
                totalSales: { $sum: 1 },
                totalRevenue: { $sum: "$totalAmount" }
            }
        }
    ])
    const { totalSales, totalRevenue } = salesData[0] || { totalSales: 0, totalRevenue: 0 };
    return {
        users: totalUsers,
        products: totalProducts,
        totalSales,
        totalRevenue
    }
}

export const getDailySalesData = async (startDate, endDate) => {
    try {
        const dailySalesDate = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate,
                    },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    sales: { $sum: 1 },
                    revenue: { $sum: "$totalAmount" },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        // this will return this array of object for every day
        // [
        //     { // first Day
        //         _id: "2024-08-12",
        //         sale: 12,
        //         revenue: 1450.35
        //     },
        //     { // second Day and so on
        //         _id: "2024-08-13",
        //         sale: 9,
        //         revenue: 1250.00
        //     },
        // ]
        const dateArray = getDatesInRange(startDate, endDate)

        return dateArray.map(date => {
            const foundData = dailySalesDate.find(item => item._id === date);
            return {
                date,
                sales: foundData?.sales || 0,
                revenue: foundData?.revenue || 0,
            }
        })
    } catch (error) {
        throw error
    }

}

function getDatesInRange(startDate, endDate) {
    const dates = []
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates
}