const { body, param, query, validationResult } = require('express-validator');

exports.validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        res.status(400).json({
            success: false,
            errors: errors.array()
        });
    };
};

// Common validation rules
exports.productRules = [
    body('name').notEmpty().trim().isLength({ min: 3, max: 100 }),
    body('description').notEmpty().trim().isLength({ min: 10, max: 1000 }),
    body('price').isFloat({ min: 0 }),
    body('stock').isInt({ min: 0 }),
    body('category').notEmpty().trim()
];

exports.userRules = [
    body('name').notEmpty().trim().isLength({ min: 2, max: 50 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
];

exports.orderRules = [
    body('items').isArray({ min: 1 }),
    body('items.*.productId').notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('shippingAddress').notEmpty(),
    body('paymentMethod').isIn(['cash', 'card', 'paypal'])
];