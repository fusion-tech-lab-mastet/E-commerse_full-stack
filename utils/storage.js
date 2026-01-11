const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class JSONStorage {
    constructor(filename) {
        this.filename = path.join(__dirname, '..', 'data', filename);
        this.init();
    }

    async init() {
        try {
            await fs.access(this.filename);
        } catch {
            // File doesn't exist, create with empty array
            await this.write([]);
        }
    }

    async read() {
        try {
            const data = await fs.readFile(this.filename, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading ${this.filename}:`, error);
            return [];
        }
    }

    async write(data) {
        try {
            await fs.mkdir(path.dirname(this.filename), { recursive: true });
            await fs.writeFile(this.filename, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error(`Error writing ${this.filename}:`, error);
            throw error;
        }
    }

    // Generate ID without uuid package
    generateId() {
        return crypto.randomBytes(16).toString('hex');
    }

    async findAll(filter = {}) {
        const data = await this.read();
        if (Object.keys(filter).length === 0) return data;
        
        return data.filter(item => {
            return Object.entries(filter).every(([key, value]) => {
                return item[key] === value;
            });
        });
    }

    async findById(id) {
        const data = await this.read();
        return data.find(item => item.id === id);
    }

    async findOne(filter) {
        const data = await this.read();
        return data.find(item => {
            return Object.entries(filter).every(([key, value]) => {
                return item[key] === value;
            });
        });
    }

    async create(item) {
        const data = await this.read();
        const newItem = {
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...item
        };
        data.push(newItem);
        await this.write(data);
        return newItem;
    }

    async update(id, updates) {
        const data = await this.read();
        const index = data.findIndex(item => item.id === id);
        
        if (index === -1) return null;
        
        data[index] = {
            ...data[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        await this.write(data);
        return data[index];
    }

    async delete(id) {
        const data = await this.read();
        const index = data.findIndex(item => item.id === id);
        
        if (index === -1) return false;
        
        data.splice(index, 1);
        await this.write(data);
        return true;
    }

    async count(filter = {}) {
        const items = await this.findAll(filter);
        return items.length;
    }

    async exists(filter) {
        const item = await this.findOne(filter);
        return !!item;
    }
}

// Create specific storage instances
const usersDB = new JSONStorage('users.json');
const productsDB = new JSONStorage('products.json');
const ordersDB = new JSONStorage('orders.json');
const categoriesDB = new JSONStorage('categories.json');
const cartsDB = new JSONStorage('carts.json');
const reviewsDB = new JSONStorage('reviews.json');

module.exports = {
    usersDB,
    productsDB,
    ordersDB,
    categoriesDB,
    cartsDB,
    reviewsDB,
    JSONStorage
};