const express = require('express');
const router = express.Router();
const { categoriesDB, productsDB } = require('../utils/storage');

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await categoriesDB.read();
        
        // Count products in each category
        const products = await productsDB.read();
        const categoriesWithCount = categories.map(category => ({
            ...category,
            count: products.filter(p => p.category === category.name).length
        }));

        res.json({
            success: true,
            categories: categoriesWithCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Create category (admin only)
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        // Check if category already exists
        const existingCategory = await categoriesDB.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category already exists'
            });
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        
        const category = await categoriesDB.create({
            name,
            slug,
            description,
            createdAt: new Date().toISOString()
        });

        res.status(201).json({
            success: true,
            category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;