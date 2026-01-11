const express = require('express');
const router = express.Router();
const { ordersDB, productsDB, usersDB } = require('../utils/storage');
const { protect } = require('../middleware/auth');

// Create new order
router.post('/', protect, async (req, res) => {
    try {
        const { items, shippingAddress, paymentMethod, notes } = req.body;
        const userId = req.user.id;

        // Validate items
        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items in order'
            });
        }

        let orderItems = [];
        let totalAmount = 0;

        // Process each item
        for (const item of items) {
            const product = await productsDB.findById(item.productId);
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${item.productId}`
                });
            }

            // Check stock
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}`
                });
            }

            const itemTotal = product.price * item.quantity;
            orderItems.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                image: product.images?.[0] || null,
                total: itemTotal
            });

            totalAmount += itemTotal;

            // Update stock
            await productsDB.update(product.id, {
                stock: product.stock - item.quantity
            });
        }

        // Calculate shipping (free over $50)
        const shippingCost = totalAmount > 50 ? 0 : 5.99;
        const tax = totalAmount * 0.08; // 8% tax
        const grandTotal = totalAmount + shippingCost + tax;

        // Generate order number
        const orderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();

        // Create order
        const order = await ordersDB.create({
            orderNumber,
            userId,
            items: orderItems,
            shippingAddress,
            billingAddress: shippingAddress, // Same as shipping for simplicity
            paymentMethod,
            status: 'pending',
            paymentStatus: 'pending',
            subtotal: totalAmount,
            shipping: shippingCost,
            tax: tax,
            total: grandTotal,
            notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        // Update user's orders
        const user = await usersDB.findById(userId);
        if (user) {
            await usersDB.update(userId, {
                orders: [...(user.orders || []), order.id]
            });
        }

        res.status(201).json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get user's orders
router.get('/my-orders', protect, async (req, res) => {
    try {
        const orders = await ordersDB.findAll({ userId: req.user.id });
        
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

// Get single order
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await ordersDB.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if user owns this order or is admin
        if (order.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this order'
            });
        }

        res.json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Update order status (admin only)
router.put('/:id/status', protect, async (req, res) => {
    try {
        const { status } = req.body;
        
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const order = await ordersDB.update(req.params.id, {
            status,
            updatedAt: new Date().toISOString()
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Cancel order
router.post('/:id/cancel', protect, async (req, res) => {
    try {
        const order = await ordersDB.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if user owns this order
        if (order.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this order'
            });
        }

        // Only allow cancellation if order is pending
        if (order.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Order cannot be cancelled at this stage'
            });
        }

        // Restore product stock
        for (const item of order.items) {
            const product = await productsDB.findById(item.productId);
            if (product) {
                await productsDB.update(product.id, {
                    stock: product.stock + item.quantity
                });
            }
        }

        // Update order status
        const updatedOrder = await ordersDB.update(order.id, {
            status: 'cancelled',
            updatedAt: new Date().toISOString()
        });

        res.json({
            success: true,
            order: updatedOrder
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;