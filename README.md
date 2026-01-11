# 📦 **Personal Shop API - Amazon Clone** v1.0.0

![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey)
![License](https://img.shields.io/badge/License-MIT-blue)
![Status](https://img.shields.io/badge/Status-Stable-brightgreen)

A full-featured e-commerce platform built with Node.js and Express.js. Perfect for personal shops and small businesses with no database required - uses JSON file storage!

## ✨ **Features**

| Feature | Status | Description |
|---------|--------|-------------|
| 🔐 **User Authentication** | ✅ Live | JWT-based auth with roles (admin/customer) |
| 🛍️ **Product Management** | ✅ Live | CRUD operations with categories & filters |
| 🛒 **Shopping Cart** | ✅ Live | Add/remove items, quantity management |
| 📦 **Order Processing** | ✅ Live | Complete order workflow with status tracking |
| 👑 **Admin Dashboard** | ✅ Live | Full admin interface for managing shop |
| ⭐ **Product Reviews** | ✅ Live | Rating and review system |
| 📱 **Responsive UI** | ✅ Live | Separate interfaces for customers & admin |
| 💾 **No Database Required** | ✅ Live | JSON file storage - simple setup! |

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 16+ 
- npm or yarn

### **Installation in 3 Steps**

```bash
# 1. Clone and install
git clone <your-repo-url>
cd amazon-clone
npm install

# 2. Setup environment
npm run setup

# 3. Start the server
npm run dev
```

**Visit:** `http://localhost:5000`

## 📁 **Project Structure**

```
amazon-clone/
├── public/              # Frontend interfaces
│   ├── admin/          # 🎛️ Admin Dashboard
│   ├── client/         # 🛍️ Customer Shop
│   └── auth/           # 🔐 Login/Register
├── data/               # 💾 JSON Database
│   ├── users.json      # 👥 User accounts
│   ├── products.json   # 📦 Product catalog
│   └── orders.json     # 📊 Order history
├── routes/             # 🚦 API Endpoints
└── utils/              # 🔧 Utilities
```

## 📁 **Full Project Structure**

├── public/              # Frontend static files
│   ├── admin/          # Admin dashboard
│   ├── auth/           # Authentication pages
│   └── client/         # Customer shop interface
├── routes/             # API route handlers
│   ├── admin.routes.js
│   ├── auth.routes.js
│   ├── cart.routes.js
│   ├── category.routes.js
│   ├── order.routes.js
│   ├── product.routes.js
├── middleware/         # Custom middleware
│   ├── auth.js        # Authentication middleware
│   └── validation.js  # Input validation
├── utils/             # Utility functions
│   ├── storage.js     # JSON file storage system
│   └── seed.js        # Database seeding
├── data/              # JSON data files
│   ├── users.json
│   ├── products.json
│   ├── categories.json
│   ├── orders.json
│   ├── carts.json
│   └── reviews.json
├── server.js          # Main application entry
├── package.json       # Dependencies
└── .env              # Environment variables

## 🔌 **API Documentation**

### **Authentication**
```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/profile
```

### **Products**
```http
GET    /api/products           # List all products
GET    /api/products/:id       # Product details
POST   /api/products          # Create (admin)
PUT    /api/products/:id      # Update (admin)
DELETE /api/products/:id      # Delete (admin)
```

### **Orders & Cart**
```http
POST /api/orders              # Create order
GET  /api/orders             # User's orders
GET  /api/cart               # Shopping cart
POST /api/cart/add           # Add to cart
```

## 🎯 **Demo Accounts**

| Role | Email | Password | Access |
|------|-------|----------|---------|
| 👑 **Admin** | `admin@shop.com` | `admin123` | Full access |
| 👤 **Customer** | `customer@shop.com` | `customer123` | Shop only |

## 🖥️ **Interfaces**

### **🛍️ Customer Shop** (`/shop`)
- Browse products with filters
- Shopping cart management
- Order history
- Product reviews

### **🎛️ Admin Dashboard** (`/admin`)
- Product management
- Order processing
- Customer overview
- Sales analytics

## ⚙️ **Configuration**

Create `.env` file:

```env
PORT=5000
JWT_SECRET=your_generated_secret_here
JWT_EXPIRE=7d
NODE_ENV=development
UPLOAD_PATH=./data/images/
```

**Generate secure secrets:**
```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

## 🛠️ **Available Scripts**

```bash
npm start              # Start production server
npm run dev           # Start development server
npm run seed          # Seed database with demo data
npm run setup         # First-time setup (creates .env + seeds)
```

## 🐛 **Troubleshooting**

| Issue | Solution |
|-------|----------|
| "Port already in use" | Change PORT in .env or run: `kill -9 $(lsof -t -i:5000)` |
| "Module not found" | Run `npm install` again |
| "Invalid token" | Clear browser localStorage and login again |
| "Data not loading" | Run `npm run seed` to reset data |

## 🤝 **Contributing**

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 **License**

Distributed under the MIT License. See `LICENSE` for more information.

## 🙏 **Acknowledgments**

- Built with ❤️ for personal shops
- Inspired by modern e-commerce platforms
- Thanks to all contributors

## 🔗 **Links**

- [Report Bug](https://github.com/fusion-tech-lab-mastet/amazon-clone/issues)
- [Request Feature](https://github.com/fusion-tech-lab-mastet/amazon-clone/issues)
- [Changelog](CHANGELOG.md)

---

**Made with Node.js & Express** • **Version 1.0.0** • **Ready for Production** 🚀

---

## 📋 **What's Next?**

Check out [CHANGELOG.md](CHANGELOG.md) for version history and upcoming features!

**Need help?** Open an issue or check the troubleshooting section above.

**Happy Shopping!** 🛒✨