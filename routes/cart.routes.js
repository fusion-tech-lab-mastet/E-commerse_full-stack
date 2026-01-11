const express = require('express');
const router = express.Router();
const { cartsDB, productsDB } = require('../utils/storage');
const { protect } = require('../middleware/auth');

// Get user's cart
router.get('/', protect, async (req, res) => {
    try {
        let cart = await cartsDB.findOne({ userId: req.user.id });
        
        if (!cart) {
            // Create empty cart if doesn't exist
            cart = await cartsDB.create({
                userId: req.user.id,
                items: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }

        // Enrich cart items with product details
        const enrichedItems = await Promise.all(
            cart.items.map(async (item) => {
                const product = await productsDB.findById(item.productId);
                return {
                    ...item,
                    product: product ? {
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        images: product.images,
                        stock: product.stock
                    } : null
                };
            })
        );

        // Calculate totals
        const subtotal = enrichedItems.reduce((sum, item) => {
            return sum + (item.product?.price || 0) * item.quantity;
        }, 0);

        res.json({
            success: true,
            cart: {
                ...cart,
                items: enrichedItems,
                summary: {
                    subtotal,
                    shipping: subtotal > 50 ? 0 : 5.99,
                    tax: subtotal * 0.08,
                    total: subtotal + (subtotal > 50 ? 0 : 5.99) + (subtotal * 0.08)
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Add item to cart
router.post('/add', protect, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        // Check product exists and has stock
        const product = await productsDB.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock'
            });
        }

        // Get or create cart
        let cart = await cartsDB.findOne({ userId: req.user.id });
        if (!cart) {
            cart = await cartsDB.create({
                userId: req.user.id,
                items: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }

        // Check if item already in cart
        const itemIndex = cart.items.findIndex(item => item.productId === productId);
        
        if (itemIndex > -1) {
            // Update quantity
            cart.items[itemIndex].quantity += quantity;
        } else {
            // Add new item
            cart.items.push({
                productId,
                quantity,
                addedAt: new Date().toISOString()
            });
        }

        // Update cart
        const updatedCart = await cartsDB.update(cart.id, {
            items: cart.items,
            updatedAt: new Date().toISOString()
        });

        res.json({
            success: true,
            message: 'Item added to cart',
            cart: updatedCart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Update cart item quantity
router.put('/update/:productId', protect, async (req, res) => {
    try {
        const { quantity } = req.body;
        const productId = req.params.productId;

        if (quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1'
            });
        }

        // Check product stock
        const product = await productsDB.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock'
            });
        }

        // Get cart
        const cart = await cartsDB.findOne({ userId: req.user.id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Find and update item
        const itemIndex = cart.items.findIndex(item => item.productId === productId);
        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        cart.items[itemIndex].quantity = quantity;

        const updatedCart = await cartsDB.update(cart.id, {
            items: cart.items,
            updatedAt: new Date().toISOString()
        });

        res.json({
            success: true,
            message: 'Cart updated',
            cart: updatedCart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Remove item from cart
router.delete('/remove/:productId', protect, async (req, res) => {
    try {
        const productId = req.params.productId;

        const cart = await cartsDB.findOne({ userId: req.user.id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Filter out the item
        cart.items = cart.items.filter(item => item.productId !== productId);

        const updatedCart = await cartsDB.update(cart.id, {
            items: cart.items,
            updatedAt: new Date().toISOString()
        });

        res.json({
            success: true,
            message: 'Item removed from cart',
            cart: updatedCart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Clear cart
router.delete('/clear', protect, async (req, res) => {
    try {
        const cart = await cartsDB.findOne({ userId: req.user.id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const updatedCart = await cartsDB.update(cart.id, {
            items: [],
            updatedAt: new Date().toISOString()
        });

        res.json({
            success: true,
            message: 'Cart cleared',
            cart: updatedCart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;