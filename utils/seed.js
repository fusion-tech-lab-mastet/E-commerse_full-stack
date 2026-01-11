const { 
    usersDB, 
    productsDB, 
    categoriesDB, 
    ordersDB 
} = require('./storage');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function seedDatabase() {
    console.log('🌱 Seeding database...');

    // Clear existing data
    await usersDB.write([]);
    await productsDB.write([]);
    await categoriesDB.write([]);
    await ordersDB.write([]);

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await usersDB.create({
        name: 'Admin User',
        email: 'admin@shop.com',
        password: adminPassword,
        role: 'admin',
        address: {
            street: '123 Admin St',
            city: 'Admin City',
            state: 'AC',
            zipCode: '12345',
            country: 'Adminland'
        },
        phone: '+1234567890'
    });

    // Create customer user
    const customerPassword = await bcrypt.hash('customer123', 10);
    const customer = await usersDB.create({
        name: 'John Customer',
        email: 'customer@shop.com',
        password: customerPassword,
        role: 'customer',
        address: {
            street: '456 Customer Ave',
            city: 'Customer City',
            state: 'CC',
            zipCode: '67890',
            country: 'Customerland'
        },
        phone: '+0987654321'
    });

    // Create categories
    const categories = [
        { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and accessories' },
        { name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel' },
        { name: 'Home & Garden', slug: 'home-garden', description: 'Home improvement and garden supplies' },
        { name: 'Books', slug: 'books', description: 'Books and magazines' },
        { name: 'Sports', slug: 'sports', description: 'Sports equipment and accessories' }
    ];

    for (const category of categories) {
        await categoriesDB.create(category);
    }

    // Create sample products
    const products = [
        {
            name: 'Wireless Bluetooth Headphones',
            description: 'High-quality wireless headphones with noise cancellation',
            price: 89.99,
            comparePrice: 129.99,
            category: 'electronics',
            tags: ['audio', 'wireless', 'bluetooth'],
            images: [
                { url: '/images/headphones.jpg', altText: 'Wireless Headphones' }
            ],
            stock: 50,
            sku: 'ELEC-001',
            featured: true,
            ratings: { average: 4.5, count: 120 }
        },
        {
            name: 'Cotton T-Shirt',
            description: '100% cotton comfortable t-shirt',
            price: 19.99,
            comparePrice: 24.99,
            category: 'clothing',
            tags: ['clothing', 'tshirt', 'cotton'],
            images: [
                { url: '/images/tshirt.jpg', altText: 'Cotton T-Shirt' }
            ],
            stock: 100,
            sku: 'CLOTH-001',
            featured: true,
            ratings: { average: 4.2, count: 85 }
        },
        {
            name: 'Garden Tool Set',
            description: 'Complete garden tool set for all your gardening needs',
            price: 49.99,
            comparePrice: 69.99,
            category: 'home-garden',
            tags: ['garden', 'tools', 'outdoor'],
            images: [
                { url: '/images/garden-tools.jpg', altText: 'Garden Tool Set' }
            ],
            stock: 30,
            sku: 'HOME-001',
            featured: false,
            ratings: { average: 4.7, count: 45 }
        },
        {
            name: 'JavaScript Programming Book',
            description: 'Learn JavaScript from beginner to advanced',
            price: 29.99,
            comparePrice: 39.99,
            category: 'books',
            tags: ['books', 'programming', 'javascript'],
            images: [
                { url: '/images/js-book.jpg', altText: 'JavaScript Book' }
            ],
            stock: 75,
            sku: 'BOOK-001',
            featured: true,
            ratings: { average: 4.8, count: 210 }
        },
        {
            name: 'Yoga Mat',
            description: 'Non-slip yoga mat for all exercises',
            price: 24.99,
            comparePrice: 34.99,
            category: 'sports',
            tags: ['sports', 'yoga', 'fitness'],
            images: [
                { url: '/images/yoga-mat.jpg', altText: 'Yoga Mat' }
            ],
            stock: 60,
            sku: 'SPORT-001',
            featured: false,
            ratings: { average: 4.3, count: 95 }
        }
    ];

    for (const product of products) {
        await productsDB.create(product);
    }

    // Create sample order
    const allProducts = await productsDB.read();
    const orderItems = allProducts.slice(0, 2).map(product => ({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 2,
        image: product.images?.[0]?.url || null,
        total: product.price * 2
    }));

    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    const shipping = 5.99;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    // Generate order number without uuid
    const orderNumber = 'ORD-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    await ordersDB.create({
        orderNumber: orderNumber,
        userId: customer.id,
        items: orderItems,
        shippingAddress: customer.address,
        billingAddress: customer.address,
        paymentMethod: 'card',
        status: 'delivered',
        paymentStatus: 'paid',
        subtotal,
        shipping,
        tax,
        total,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() // 6 days ago
    });

    console.log('✅ Database seeded successfully!');
    console.log('👤 Admin credentials: admin@shop.com / admin123');
    console.log('👤 Customer credentials: customer@shop.com / customer123');

    // Show statistics
    const userCount = await usersDB.count();
    const productCount = await productsDB.count();
    const categoryCount = await categoriesDB.count();
    const orderCount = await ordersDB.count();

    console.log('\n📊 Database Statistics:');
    console.log(`Users: ${userCount}`);
    console.log(`Products: ${productCount}`);
    console.log(`Categories: ${categoryCount}`);
    console.log(`Orders: ${orderCount}`);
}

// Run seeding if called directly
if (require.main === module) {
    seedDatabase().catch(console.error);
}

module.exports = seedDatabase;