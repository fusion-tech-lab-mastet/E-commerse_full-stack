const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { 
    usersDB, 
    productsDB, 
    ordersDB, 
    categoriesDB 
} = require('../utils/storage');

// Get admin dashboard stats
router.get('/stats', protect, authorize('admin'), async (req, res) => {
    try {
        const [users, products, orders, categories] = await Promise.all([
            usersDB.read(),
            productsDB.read(),
            ordersDB.read(),
            categoriesDB.read()
        ]);

        // Calculate total sales
        const totalSales = orders.reduce((sum, order) => sum + order.total, 0);

        res.json({
            success: true,
            totalSales: parseFloat(totalSales.toFixed(2)),
            totalOrders: orders.length,
            totalProducts: products.length,
            totalCustomers: users.filter(u => u.role === 'customer').length,
            totalCategories: categories.length,
            recentOrders: orders.slice(-5).reverse(),
            lowStockProducts: products.filter(p => p.stock < 10).slice(0, 5)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get all users (admin only)
router.get('/users', protect, authorize('admin'), async (req, res) => {
    try {
        const users = await usersDB.read();
        
        // Remove passwords from response
        const usersWithoutPasswords = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });

        res.json({
            success: true,
            count: users.length,
            users: usersWithoutPasswords
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get all orders (admin only)
router.get('/orders/all', protect, authorize('admin'), async (req, res) => {
    try {
        const orders = await ordersDB.read();
        
        // Sort by date (newest first)
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get sales analytics
router.get('/analytics', protect, authorize('admin'), async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const orders = await ordersDB.read();
        
        // Filter orders by period
        const now = new Date();
        let filteredOrders = [];
        
        if (period === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredOrders = orders.filter(order => new Date(order.createdAt) > weekAgo);
        } else if (period === 'month') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filteredOrders = orders.filter(order => new Date(order.createdAt) > monthAgo);
        } else if (period === 'year') {
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            filteredOrders = orders.filter(order => new Date(order.createdAt) > yearAgo);
        } else {
            filteredOrders = orders;
        }

        // Calculate analytics
        const totalSales = filteredOrders.reduce((sum, order) => sum + order.total, 0);
        const averageOrderValue = filteredOrders.length > 0 ? totalSales / filteredOrders.length : 0;
        
        // Group by status
        const ordersByStatus = filteredOrders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});

        // Group by day for chart data
        const salesByDay = filteredOrders.reduce((acc, order) => {
            const date = new Date(order.createdAt).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + order.total;
            return acc;
        }, {});

        res.json({
            success: true,
            analytics: {
                period,
                totalOrders: filteredOrders.length,
                totalSales: parseFloat(totalSales.toFixed(2)),
                averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
                ordersByStatus,
                salesByDay: Object.entries(salesByDay).map(([date, sales]) => ({
                    date,
                    sales: parseFloat(sales.toFixed(2))
                })).sort((a, b) => new Date(a.date) - new Date(b.date))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;