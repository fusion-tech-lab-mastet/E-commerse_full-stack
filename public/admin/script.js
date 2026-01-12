
        // Global variables
        let currentUser = null;
        let currentProductId = null;
        let currentPage = 1;
        const itemsPerPage = 10;

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', () => {
            checkAuth();
            setupEventListeners();
        });

        // Check authentication
        function checkAuth() {
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');
            
            if (!token || !user) {
                window.location.href = '/login';
                return;
            }
            
            try {
                currentUser = JSON.parse(user);
                updateUserInfo();
                loadDashboardData();
                loadCategories();
                loadProducts();
                loadOrders();
            } catch (error) {
                console.error('Error parsing user data:', error);
                logout();
            }
        }

        // Update user info in header
        function updateUserInfo() {
            if (currentUser) {
                document.getElementById('userName').textContent = currentUser.name;
                document.getElementById('userInitials').textContent = currentUser.name.charAt(0).toUpperCase();
            }
        }

        // Setup event listeners
        function setupEventListeners() {
            // Navigation
            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const section = item.dataset.section;
                    showSection(section);
                });
            });

            // Tabs
            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    
                    document.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.remove('active');
                    });
                    
                    document.getElementById(tab.dataset.tab).classList.add('active');
                });
            });

            // Search
            document.getElementById('productSearch')?.addEventListener('input', debounce(searchProducts, 300));
            document.getElementById('orderSearch')?.addEventListener('input', debounce(searchOrders, 300));
            
            // Filters
            document.getElementById('categoryFilter')?.addEventListener('change', loadProducts);
            document.getElementById('sortProducts')?.addEventListener('change', loadProducts);
            document.getElementById('orderStatusFilter')?.addEventListener('change', loadOrders);
            
            // Charts period
            document.getElementById('salesPeriod')?.addEventListener('change', updateSalesChart);
        }

        // Show section
        function showSection(section) {
            // Update active nav item
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.section === section) {
                    item.classList.add('active');
                }
            });

            // Hide all sections
            document.querySelectorAll('.section').forEach(sec => {
                sec.style.display = 'none';
            });

            // Show selected section
            const sectionElement = document.getElementById(section + 'Section');
            if (sectionElement) {
                sectionElement.style.display = 'block';
                document.getElementById('pageTitle').textContent = getSectionTitle(section);
                document.getElementById('pageSubtitle').textContent = getSectionSubtitle(section);
                
                // Load section data
                switch(section) {
                    case 'products':
                        loadProducts();
                        break;
                    case 'orders':
                        loadOrders();
                        break;
                    case 'customers':
                        loadCustomers();
                        break;
                    case 'categories':
                        loadCategories();
                        break;
                    case 'dashboard':
                        loadDashboardData();
                        break;
                }
            }

            // Close sidebar on mobile
            if (window.innerWidth < 1024) {
                document.querySelector('.sidebar').classList.remove('active');
            }
        }

        function getSectionTitle(section) {
            const titles = {
                'dashboard': 'Dashboard',
                'products': 'Products',
                'orders': 'Orders',
                'customers': 'Customers',
                'categories': 'Categories',
                'analytics': 'Analytics',
                'settings': 'Settings'
            };
            return titles[section] || section;
        }

        function getSectionSubtitle(section) {
            const subtitles = {
                'dashboard': 'Welcome back, Admin',
                'products': 'Manage your product catalog',
                'orders': 'View and manage customer orders',
                'customers': 'Manage customer accounts',
                'categories': 'Organize product categories',
                'analytics': 'View business analytics',
                'settings': 'Configure your shop settings'
            };
            return subtitles[section] || '';
        }

        // Toggle sidebar on mobile
        function toggleSidebar() {
            document.querySelector('.sidebar').classList.toggle('active');
        }

        // Show alert message
        function showAlert(message, type = 'success') {
            const alertDiv = document.getElementById(`alert${type.charAt(0).toUpperCase() + type.slice(1)}`);
            alertDiv.textContent = message;
            alertDiv.style.display = 'block';
            
            setTimeout(() => {
                alertDiv.style.display = 'none';
            }, 5000);
        }

        // Load dashboard data
        async function loadDashboardData() {
            try {
                const response = await fetch('/api/admin/stats', {
                    headers: getAuthHeaders()
                });
                
                if (!response.ok) throw new Error('Failed to load dashboard data');
                
                const data = await response.json();
                
                // Update stats
                document.getElementById('totalSales').textContent = `$${data.totalSales.toFixed(2)}`;
                document.getElementById('totalOrders').textContent = data.totalOrders;
                document.getElementById('totalProducts').textContent = data.totalProducts;
                document.getElementById('totalCustomers').textContent = data.totalCustomers;
                
                // Load recent orders
                loadRecentOrders();
                
                // Load low stock products
                loadLowStockProducts();
                
                // Initialize charts
                setTimeout(() => {
                    initCharts(data);
                }, 100);
            } catch (error) {
                console.error('Error loading dashboard:', error);
                showAlert('Failed to load dashboard data', 'error');
            }
        }

        // Load recent orders
        async function loadRecentOrders() {
            try {
                const response = await fetch('/api/orders?limit=5', {
                    headers: getAuthHeaders()
                });
                
                if (!response.ok) throw new Error('Failed to load orders');
                
                const data = await response.json();
                renderRecentOrders(data.orders);
            } catch (error) {
                console.error('Error loading recent orders:', error);
            }
        }

        function renderRecentOrders(orders) {
            const tbody = document.querySelector('#recentOrdersTable tbody');
            tbody.innerHTML = '';
            
            orders.forEach(order => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${order.orderNumber}</td>
                    <td>${order.shippingAddress?.name || 'N/A'}</td>
                    <td>${formatDate(order.createdAt)}</td>
                    <td>$${order.total.toFixed(2)}</td>
                    <td><span class="status ${order.status}">${order.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="viewOrder('${order.id}')">
                            View
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        // Load low stock products
        async function loadLowStockProducts() {
            try {
                const response = await fetch('/api/products?stockMax=10&limit=5', {
                    headers: getAuthHeaders()
                });
                
                if (!response.ok) throw new Error('Failed to load products');
                
                const data = await response.json();
                renderLowStockProducts(data.products);
            } catch (error) {
                console.error('Error loading low stock products:', error);
            }
        }

        function renderLowStockProducts(products) {
            const tbody = document.querySelector('#lowStockTable tbody');
            tbody.innerHTML = '';
            
            products.forEach(product => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${product.name}</td>
                    <td>${product.sku || 'N/A'}</td>
                    <td>${product.stock}</td>
                    <td>${product.category}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editProduct('${product.id}')">
                            Restock
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        // Initialize charts
        function initCharts(data) {
            // Sales Chart
            const salesCtx = document.getElementById('salesChart').getContext('2d');
            new Chart(salesCtx, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Sales',
                        data: [1200, 1900, 1500, 2500, 2200, 3000, 2800],
                        borderColor: '#4f46e5',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });

            // Categories Chart
            const categoriesCtx = document.getElementById('categoriesChart').getContext('2d');
            new Chart(categoriesCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Electronics', 'Clothing', 'Home', 'Books', 'Sports'],
                    datasets: [{
                        data: [30, 25, 20, 15, 10],
                        backgroundColor: [
                            '#4f46e5',
                            '#10b981',
                            '#f59e0b',
                            '#3b82f6',
                            '#8b5cf6'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Update sales chart based on period
        function updateSalesChart() {
            // Implement chart update based on selected period
            console.log('Update chart for:', document.getElementById('salesPeriod').value);
        }

        // Load products
        async function loadProducts(page = 1) {
            try {
                const search = document.getElementById('productSearch')?.value || '';
                const category = document.getElementById('categoryFilter')?.value || '';
                const sort = document.getElementById('sortProducts')?.value || 'newest';
                
                let url = `/api/products?page=${page}&limit=${itemsPerPage}`;
                if (search) url += `&search=${encodeURIComponent(search)}`;
                if (category) url += `&category=${encodeURIComponent(category)}`;
                if (sort) url += `&sort=${sort}`;
                
                const response = await fetch(url, {
                    headers: getAuthHeaders()
                });
                
                if (!response.ok) throw new Error('Failed to load products');
                
                const data = await response.json();
                renderProducts(data.products);
                renderProductsPagination(data.total, page);
            } catch (error) {
                console.error('Error loading products:', error);
                showAlert('Failed to load products', 'error');
            }
        }

        function renderProducts(products) {
            const tbody = document.querySelector('#productsTable tbody');
            tbody.innerHTML = '';
            
            products.forEach(product => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 40px; height: 40px; background: #e5e7eb; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                                ${product.images?.[0] ? 
                                    `<img src="${product.images[0].url}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : 
                                    `<i class="fas fa-box" style="color: #6b7280;"></i>`
                                }
                            </div>
                            <div>
                                <div style="font-weight: 500;">${product.name}</div>
                                <div style="font-size: 0.75rem; color: #6b7280;">${product.sku || 'No SKU'}</div>
                            </div>
                        </div>
                    </td>
                    <td>${product.category}</td>
                    <td>$${product.price.toFixed(2)}</td>
                    <td>
                        <span class="${product.stock < 10 ? 'status warning' : 'status delivered'}" style="padding: 0.25rem 0.5rem;">
                            ${product.stock}
                        </span>
                    </td>
                    <td>
                        <span class="status ${product.stock > 0 ? 'delivered' : 'cancelled'}">
                            ${product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                    </td>
                    <td>
                        <label class="switch">
                            <input type="checkbox" ${product.featured ? 'checked' : ''} 
                                   onchange="toggleFeatured('${product.id}', this.checked)">
                            <span class="slider"></span>
                        </label>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editProduct('${product.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        // Toggle product featured status
        async function toggleFeatured(productId, featured) {
            try {
                const response = await fetch(`/api/products/${productId}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ featured })
                });
                
                if (!response.ok) throw new Error('Failed to update product');
                
                showAlert('Product updated successfully');
            } catch (error) {
                console.error('Error toggling featured:', error);
                showAlert('Failed to update product', 'error');
            }
        }

        // Load categories for dropdown
        async function loadCategories() {
            try {
                const response = await fetch('/api/categories', {
                    headers: getAuthHeaders()
                });
                
                if (!response.ok) throw new Error('Failed to load categories');
                
                const data = await response.json();
                
                // Update category filter
                const categoryFilter = document.getElementById('categoryFilter');
                const productCategory = document.getElementById('productCategory');
                
                if (categoryFilter) {
                    categoryFilter.innerHTML = '<option value="">All Categories</option>';
                    data.categories.forEach(category => {
                        categoryFilter.innerHTML += `<option value="${category.name}">${category.name}</option>`;
                    });
                }
                
                if (productCategory) {
                    productCategory.innerHTML = '<option value="">Select Category</option>';
                    data.categories.forEach(category => {
                        productCategory.innerHTML += `<option value="${category.name}">${category.name}</option>`;
                    });
                }
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        }

        // Show add product modal
        function showAddProductModal() {
            document.getElementById('modalTitle').textContent = 'Add New Product';
            document.getElementById('productForm').reset();
            document.getElementById('productId').value = '';
            document.getElementById('productModal').style.display = 'flex';
        }

        // Edit product
        async function editProduct(productId) {
            try {
                const response = await fetch(`/api/products/${productId}`, {
                    headers: getAuthHeaders()
                });
                
                if (!response.ok) throw new Error('Failed to load product');
                
                const data = await response.json();
                const product = data.product;
                
                document.getElementById('modalTitle').textContent = 'Edit Product';
                document.getElementById('productId').value = product.id;
                document.getElementById('productName').value = product.name;
                document.getElementById('productDescription').value = product.description;
                document.getElementById('productPrice').value = product.price;
                document.getElementById('productComparePrice').value = product.comparePrice || '';
                document.getElementById('productCategory').value = product.category;
                document.getElementById('productStock').value = product.stock;
                document.getElementById('productSKU').value = product.sku || '';
                document.getElementById('productTags').value = product.tags?.join(', ') || '';
                document.getElementById('productFeatured').checked = product.featured || false;
                
                document.getElementById('productModal').style.display = 'flex';
            } catch (error) {
                console.error('Error loading product:', error);
                showAlert('Failed to load product', 'error');
            }
        }

        // Save product
        async function saveProduct() {
            const productId = document.getElementById('productId').value;
            const productData = {
                name: document.getElementById('productName').value,
                description: document.getElementById('productDescription').value,
                price: parseFloat(document.getElementById('productPrice').value),
                comparePrice: document.getElementById('productComparePrice').value ? 
                    parseFloat(document.getElementById('productComparePrice').value) : undefined,
                category: document.getElementById('productCategory').value,
                stock: parseInt(document.getElementById('productStock').value),
                sku: document.getElementById('productSKU').value,
                tags: document.getElementById('productTags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
                featured: document.getElementById('productFeatured').checked
            };

            try {
                const url = productId ? `/api/products/${productId}` : '/api/products';
                const method = productId ? 'PUT' : 'POST';
                
                const response = await fetch(url, {
                    method,
                    headers: getAuthHeaders(),
                    body: JSON.stringify(productData)
                });
                
                if (!response.ok) throw new Error('Failed to save product');
                
                closeModal();
                showAlert(`Product ${productId ? 'updated' : 'created'} successfully`);
                loadProducts();
                loadDashboardData();
            } catch (error) {
                console.error('Error saving product:', error);
                showAlert('Failed to save product', 'error');
            }
        }

        // Delete product
        async function deleteProduct(productId) {
            if (!confirm('Are you sure you want to delete this product?')) return;
            
            try {
                const response = await fetch(`/api/products/${productId}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                });
                
                if (!response.ok) throw new Error('Failed to delete product');
                
                showAlert('Product deleted successfully');
                loadProducts();
                loadDashboardData();
            } catch (error) {
                console.error('Error deleting product:', error);
                showAlert('Failed to delete product', 'error');
            }
        }

        // Load orders
        async function loadOrders() {
            try {
                const search = document.getElementById('orderSearch')?.value || '';
                const status = document.getElementById('orderStatusFilter')?.value || '';
                const dateFrom = document.getElementById('orderDateFrom')?.value || '';
                const dateTo = document.getElementById('orderDateTo')?.value || '';
                
                let url = `/api/orders?limit=${itemsPerPage}`;
                if (search) url += `&search=${encodeURIComponent(search)}`;
                if (status) url += `&status=${status}`;
                
                const response = await fetch(url, {
                    headers: getAuthHeaders()
                });
                
                if (!response.ok) throw new Error('Failed to load orders');
                
                const data = await response.json();
                renderOrders(data.orders);
            } catch (error) {
                console.error('Error loading orders:', error);
                showAlert('Failed to load orders', 'error');
            }
        }

        function renderOrders(orders) {
            const tbody = document.querySelector('#ordersTable tbody');
            tbody.innerHTML = '';
            
            orders.forEach(order => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${order.orderNumber}</td>
                    <td>${order.shippingAddress?.name || 'N/A'}</td>
                    <td>${formatDate(order.createdAt)}</td>
                    <td>${order.items.length} items</td>
                    <td>$${order.total.toFixed(2)}</td>
                    <td>
                        <select class="form-control" style="width: 120px; padding: 0.25rem;" 
                                onchange="updateOrderStatus('${order.id}', this.value)">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="viewOrder('${order.id}')">
                            View
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        // View order details
        async function viewOrder(orderId) {
            try {
                const response = await fetch(`/api/orders/${orderId}`, {
                    headers: getAuthHeaders()
                });
                
                if (!response.ok) throw new Error('Failed to load order');
                
                const data = await response.json();
                showOrderModal(data.order);
            } catch (error) {
                console.error('Error loading order:', error);
                showAlert('Failed to load order details', 'error');
            }
        }

        function showOrderModal(order) {
            const details = document.getElementById('orderDetails');
            details.innerHTML = `
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 0.5rem;">Order Information</h3>
                    <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                    <p><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
                    <p><strong>Status:</strong> <span class="status ${order.status}">${order.status}</span></p>
                    <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                    <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 0.5rem;">Customer Information</h3>
                    <p><strong>Name:</strong> ${order.shippingAddress?.name || 'N/A'}</p>
                    <p><strong>Address:</strong> ${order.shippingAddress?.street || ''}, ${order.shippingAddress?.city || ''}</p>
                    <p><strong>Phone:</strong> ${order.shippingAddress?.phone || 'N/A'}</p>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 0.5rem;">Order Items</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f3f4f6;">
                                <th style="padding: 0.5rem; text-align: left;">Product</th>
                                <th style="padding: 0.5rem; text-align: center;">Quantity</th>
                                <th style="padding: 0.5rem; text-align: right;">Price</th>
                                <th style="padding: 0.5rem; text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr style="border-bottom: 1px solid #e5e7eb;">
                                    <td style="padding: 0.5rem;">${item.name}</td>
                                    <td style="padding: 0.5rem; text-align: center;">${item.quantity}</td>
                                    <td style="padding: 0.5rem; text-align: right;">$${item.price.toFixed(2)}</td>
                                    <td style="padding: 0.5rem; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div style="border-top: 2px solid #e5e7eb; padding-top: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Subtotal:</span>
                        <span>$${order.subtotal.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Shipping:</span>
                        <span>$${order.shipping.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Tax:</span>
                        <span>$${order.tax.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.125rem;">
                        <span>Total:</span>
                        <span>$${order.total.toFixed(2)}</span>
                    </div>
                </div>
            `;
            
            document.getElementById('orderModal').style.display = 'flex';
        }

        // Update order status
        async function updateOrderStatus(orderId, status) {
            try {
                const response = await fetch(`/api/orders/${orderId}/status`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ status })
                });
                
                if (!response.ok) throw new Error('Failed to update order status');
                
                showAlert('Order status updated successfully');
                loadOrders();
                loadDashboardData();
            } catch (error) {
                console.error('Error updating order status:', error);
                showAlert('Failed to update order status', 'error');
            }
        }

        // Close modal
        function closeModal() {
            document.getElementById('productModal').style.display = 'none';
            document.getElementById('orderModal').style.display = 'none';
        }

        // Search products with debounce
        function searchProducts() {
            loadProducts(1);
        }

        function searchOrders() {
            loadOrders();
        }

        // Load customers
        async function loadCustomers() {
            // Implement customer loading
            console.log('Loading customers...');
        }

        // Render pagination
        function renderProductsPagination(totalItems, currentPage) {
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            const pagination = document.getElementById('productsPagination');
            
            if (totalPages <= 1) {
                pagination.innerHTML = '';
                return;
            }
            
            let html = '';
            
            // Previous button
            html += `<button class="btn btn-secondary" ${currentPage === 1 ? 'disabled' : ''} 
                     onclick="loadProducts(${currentPage - 1})">
                     <i class="fas fa-chevron-left"></i>
                     </button>`;
            
            // Page numbers
            for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                    html += `<button class="btn ${i === currentPage ? 'btn-primary' : 'btn-secondary'}" 
                             onclick="loadProducts(${i})">${i}</button>`;
                } else if (i === currentPage - 3 || i === currentPage + 3) {
                    html += '<span>...</span>';
                }
            }
            
            // Next button
            html += `<button class="btn btn-secondary" ${currentPage === totalPages ? 'disabled' : ''} 
                     onclick="loadProducts(${currentPage + 1})">
                     <i class="fas fa-chevron-right"></i>
                     </button>`;
            
            pagination.innerHTML = html;
        }

        // Utility functions
        function getAuthHeaders() {
            const token = localStorage.getItem('token');
            return {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        }

        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        // Logout
        function logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }

        // Toggle user menu
        function toggleUserMenu() {
            // Implement user menu toggle
            console.log('Toggle user menu');
        }

        // Add CSS for toggle switch
        const style = document.createElement('style');
        style.textContent = `
            .switch {
                position: relative;
                display: inline-block;
                width: 50px;
                height: 24px;
            }
            
            .switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #ccc;
                transition: .4s;
                border-radius: 24px;
            }
            
            .slider:before {
                position: absolute;
                content: "";
                height: 16px;
                width: 16px;
                left: 4px;
                bottom: 4px;
                background-color: white;
                transition: .4s;
                border-radius: 50%;
            }
            
            input:checked + .slider {
                background-color: #4f46e5;
            }
            
            input:checked + .slider:before {
                transform: translateX(26px);
            }
        `;
        document.head.appendChild(style);