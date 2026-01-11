const express = require('express');
const router = express.Router();
const { productsDB, categoriesDB } = require('../utils/storage');
const { protect, authorize } = require('../middleware/auth');

// Get all products with filtering
router.get('/', async (req, res) => {
    try {
        const {
            category,
            minPrice,
            maxPrice,
            search,
            featured,
            limit = 20,
            page = 1,
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query;

        let products = await productsDB.read();

        // Apply filters
        if (category) {
            products = products.filter(p => p.category === category);
        }

        if (minPrice) {
            products = products.filter(p => p.price >= parseFloat(minPrice));
        }

        if (maxPrice) {
            products = products.filter(p => p.price <= parseFloat(maxPrice));
        }

        if (search) {
            const searchTerm = search.toLowerCase();
            products = products.filter(p => 
                p.name.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm) ||
                p.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        if (featured === 'true') {
            products = products.filter(p => p.featured);
        }

        // Sort products
        products.sort((a, b) => {
            if (order === 'asc') {
                return a[sortBy] > b[sortBy] ? 1 : -1;
            } else {
                return a[sortBy] < b[sortBy] ? 1 : -1;
            }
        });

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedProducts = products.slice(startIndex, endIndex);

        // Get categories for filter options
        const categories = await categoriesDB.read();

        res.json({
            success: true,
            total: products.length,
            page: parseInt(page),
            totalPages: Math.ceil(products.length / limit),
            products: paginatedProducts,
            filters: {
                categories: categories.map(c => ({ id: c.id, name: c.name })),
                priceRange: {
                    min: Math.min(...products.map(p => p.price)),
                    max: Math.max(...products.map(p => p.price))
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

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const product = await productsDB.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Create product (admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const productData = req.body;
        
        const product = await productsDB.create({
            ...productData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ratings: {
                average: 0,
                count: 0
            },
            reviews: []
        });

        res.status(201).json({
            success: true,
            product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Update product (admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const product = await productsDB.update(req.params.id, req.body);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Delete product (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const deleted = await productsDB.delete(req.params.id);
        
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Search products
router.get('/search/:query', async (req, res) => {
    try {
        const query = req.params.query.toLowerCase();
        const products = await productsDB.read();
        
        const results = products.filter(product => 
            product.name.toLowerCase().includes(query) ||
            product.description.toLowerCase().includes(query) ||
            product.tags?.some(tag => tag.toLowerCase().includes(query))
        );

        res.json({
            success: true,
            query,
            count: results.length,
            products: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;