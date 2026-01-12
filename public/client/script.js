
        // Global variables
        let currentUser = null;
        let products = [];
        let currentPage = 1;
        const productsPerPage = 12;
        let isLoading = false;
        let cart = [];

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', () => {
            checkAuth();
            loadCategories();
            loadProducts();
            setupEventListeners();
        });

        // Check authentication
        function checkAuth() {
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');
            
            if (!token || !user) {
                window.location.href = '/login?redirect=/shop';
                return;
            }
            
            try {
                currentUser = JSON.parse(user);
                updateUserInfo();
                loadCart();
                loadWishlist();
            } catch (error) {
                console.error('Error parsing user data:', error);
                logout();
            }
        }

        // Update user info
        function updateUserInfo() {
            if (currentUser) {
                document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
            }
        }

        // Setup event listeners
        function setupEventListeners() {
            // Search
            const searchInput = document.getElementById('searchInput');
            searchInput.addEventListener('input', debounce(() => {
                searchProducts(searchInput.value);
            }, 300));

            // Navigation
            document.querySelectorAll('.nav a').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const category = link.dataset.category;
                    if (category) {
                        filterByCategory(category);
                    }
                });
            });

            // Close modals on outside click
            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.style.display = 'none';
                    }
                });
            });
        }

        // Show alert
        function showAlert(message, type = 'success') {
            const alert = document.getElementById('alert');
            alert.className = `alert alert-${type}`;
            alert.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
            `;
            alert.classList.add('show');
            
            setTimeout(() => {
                alert.classList.remove('show');
            }, 3000);
        }

        // Load categories
        async function loadCategories() {
            try {
                const response = await fetch('/api/categories');
                if (!response.ok) throw new Error('Failed to load categories');
                
                const data = await response.json();
                renderCategories(data.categories);
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        }

        function renderCategories(categories) {
            const grid = document.getElementById('categoriesGrid');
            grid.innerHTML = '';
            
            categories.forEach(category => {
                const categoryCard = document.createElement('a');
                categoryCard.href = '#';
                categoryCard.className = 'category-card';
                categoryCard.dataset.category = category.slug;
                categoryCard.onclick = (e) => {
                    e.preventDefault();
                    filterByCategory(category.slug);
                };
                
                categoryCard.innerHTML = `
                    <div class="category-icon">
                        <i class="${getCategoryIcon(category.name)}"></i>
                    </div>
                    <div class="category-name">${category.name}</div>
                    <div class="category-count">${category.count || 0} products</div>
                `;
                
                grid.appendChild(categoryCard);
            });
        }

        function getCategoryIcon(categoryName) {
            const icons = {
                'Electronics': 'fas fa-laptop',
                'Clothing': 'fas fa-tshirt',
                'Home & Garden': 'fas fa-home',
                'Books': 'fas fa-book',
                'Sports': 'fas fa-running'
            };
            return icons[categoryName] || 'fas fa-box';
        }

        // Load products
        async function loadProducts(page = 1, category = '') {
            if (isLoading) return;
            
            isLoading = true;
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            
            try {
                let url = `/api/products?page=${page}&limit=${productsPerPage}`;
                if (category) url += `&category=${encodeURIComponent(category)}`;
                
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to load products');
                
                const data = await response.json();
                
                if (page === 1) {
                    products = data.products;
                    renderProducts(products);
                    renderFeaturedProducts(data.products.filter(p => p.featured));
                } else {
                    products = [...products, ...data.products];
                    renderProducts(products);
                }
                
                currentPage = page;
                
                // Update load more button
                if (data.products.length < productsPerPage) {
                    loadMoreBtn.style.display = 'none';
                } else {
                    loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Load More';
                    loadMoreBtn.style.display = 'block';
                }
            } catch (error) {
                console.error('Error loading products:', error);
                showAlert('Failed to load products', 'error');
            } finally {
                isLoading = false;
            }
        }

        function renderProducts(productsToRender) {
            const grid = document.getElementById('productsGrid');
            
            // Clear grid if it's the first page
            if (currentPage === 1) {
                grid.innerHTML = '';
            }
            
            productsToRender.forEach(product => {
                const productCard = createProductCard(product);
                grid.appendChild(productCard);
            });
        }

        function renderFeaturedProducts(featuredProducts) {
            const grid = document.getElementById('featuredProducts');
            grid.innerHTML = '';
            
            featuredProducts.slice(0, 4).forEach(product => {
                const productCard = createProductCard(product);
                grid.appendChild(productCard);
            });
        }

        function createProductCard(product) {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            card.innerHTML = `
                <div class="product-image">
                    ${product.images?.[0] ? 
                        `<img src="${product.images[0].url}" alt="${product.name}">` : 
                        `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #e5e7eb;">
                            <i class="fas fa-box" style="font-size: 3rem; color: #9ca3af;"></i>
                        </div>`
                    }
                    ${product.comparePrice ? 
                        `<div class="product-badge">Sale</div>` : ''}
                    <button class="wishlist-btn" onclick="toggleWishlist('${product.id}')">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category}</div>
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">
                        <span class="price-current">$${product.price.toFixed(2)}</span>
                        ${product.comparePrice ? 
                            `<span class="price-old">$${product.comparePrice.toFixed(2)}</span>` : ''}
                    </div>
                    <div class="product-rating">
                        <div class="stars">
                            ${getStarRating(product.ratings?.average || 0)}
                        </div>
                        <span class="rating-count">(${product.ratings?.count || 0})</span>
                    </div>
                    <button class="add-to-cart" onclick="addToCart('${product.id}')">
                        <i class="fas fa-cart-plus"></i>
                        Add to Cart
                    </button>
                </div>
            `;
            
            // Add click event to view product details
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.wishlist-btn') && !e.target.closest('.add-to-cart')) {
                    viewProductDetails(product.id);
                }
            });
            
            return card;
        }

        function getStarRating(rating) {
            let stars = '';
            const fullStars = Math.floor(rating);
            const hasHalfStar = rating % 1 >= 0.5;
            
            for (let i = 0; i < 5; i++) {
                if (i < fullStars) {
                    stars += '<i class="fas fa-star"></i>';
                } else if (i === fullStars && hasHalfStar) {
                    stars += '<i class="fas fa-star-half-alt"></i>';
                } else {
                    stars += '<i class="far fa-star"></i>';
                }
            }
            
            return stars;
        }

        // Load more products
        function loadMoreProducts() {
            loadProducts(currentPage + 1);
        }

        // Search products
        function searchProducts(query) {
            if (query.length < 2) {
                loadProducts(1);
                return;
            }
            
            // Implement search
            console.log('Searching for:', query);
        }

        // Filter by category
        function filterByCategory(category) {
            currentPage = 1;
            loadProducts(1, category);
            
            // Update active nav link
            document.querySelectorAll('.nav a').forEach(link => {
                link.classList.remove('active');
                if (link.dataset.category === category) {
                    link.classList.add('active');
                }
            });
        }

        // Add to cart
        async function addToCart(productId) {
            try {
                const response = await fetch('/api/cart/add', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ productId, quantity: 1 })
                });
                
                if (!response.ok) throw new Error('Failed to add to cart');
                
                const data = await response.json();
                cart = data.cart.items;
                updateCartCount();
                showAlert('Product added to cart successfully');
                
                // Update wishlist button if in wishlist
                const wishlistBtn = document.querySelector(`[onclick="toggleWishlist('${productId}')"]`);
                if (wishlistBtn) {
                    wishlistBtn.innerHTML = '<i class="fas fa-heart"></i>';
                    wishlistBtn.classList.add('active');
                }
            } catch (error) {
                console.error('Error adding to cart:', error);
                showAlert('Failed to add product to cart', 'error');
            }
        }

        // Load cart
        async function loadCart() {
            try {
                const response = await fetch('/api/cart', {
                    headers: getAuthHeaders()
                });
                
                if (!response.ok) throw new Error('Failed to load cart');
                
                const data = await response.json();
                cart = data.cart.items;
                updateCartCount();
            } catch (error) {
                console.error('Error loading cart:', error);
            }
        }

        function updateCartCount() {
            const count = cart.reduce((total, item) => total + item.quantity, 0);
            document.getElementById('cartCount').textContent = count;
        }

        // Show cart modal
        async function showCart() {
            await loadCart();
            renderCartItems();
            document.getElementById('cartModal').style.display = 'flex';
        }

        function hideCart() {
            document.getElementById('cartModal').style.display = 'none';
        }

        function renderCartItems() {
            const container = document.getElementById('cartItems');
            container.innerHTML = '';
            
            if (cart.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 2rem;">
                        <i class="fas fa-shopping-cart" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i>
                        <p>Your cart is empty</p>
                    </div>
                `;
                updateCartTotals(0);
                return;
            }
            
            let subtotal = 0;
            
            cart.forEach(item => {
                const itemTotal = item.product?.price * item.quantity || 0;
                subtotal += itemTotal;
                
                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                itemElement.innerHTML = `
                    <div class="cart-item-image">
                        ${item.product?.images?.[0] ? 
                            `<img src="${item.product.images[0].url}" alt="${item.product.name}">` :
                            `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #e5e7eb;">
                                <i class="fas fa-box" style="color: #9ca3af;"></i>
                            </div>`
                        }
                    </div>
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.product?.name || 'Product'}</div>
                        <div class="cart-item-price">$${item.product?.price?.toFixed(2) || '0.00'}</div>
                        <div class="cart-item-actions">
                            <button class="quantity-btn" onclick="updateCartQuantity('${item.productId}', ${item.quantity - 1})">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="text" class="quantity-input" value="${item.quantity}" 
                                   onchange="updateCartQuantity('${item.productId}', this.value)">
                            <button class="quantity-btn" onclick="updateCartQuantity('${item.productId}', ${item.quantity + 1})">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button class="remove-btn" onclick="removeFromCart('${item.productId}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                
                container.appendChild(itemElement);
            });
            
            updateCartTotals(subtotal);
        }

        async function updateCartQuantity(productId, quantity) {
            if (quantity < 1) {
                removeFromCart(productId);
                return;
            }
            
            try {
                const response = await fetch(`/api/cart/update/${productId}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ quantity: parseInt(quantity) })
                });
                
                if (!response.ok) throw new Error('Failed to update cart');
                
                const data = await response.json();
                cart = data.cart.items;
                renderCartItems();
                updateCartCount();
            } catch (error) {
                console.error('Error updating cart:', error);
                showAlert('Failed to update cart', 'error');
            }
        }

        async function removeFromCart(productId) {
            try {
                const response = await fetch(`/api/cart/remove/${productId}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                });
                
                if (!response.ok) throw new Error('Failed to remove from cart');
                
                const data = await response.json();
                cart = data.cart.items;
                renderCartItems();
                updateCartCount();
                showAlert('Item removed from cart');
            } catch (error) {
                console.error('Error removing from cart:', error);
                showAlert('Failed to remove item from cart', 'error');
            }
        }

        function updateCartTotals(subtotal) {
            const shipping = subtotal > 50 ? 0 : 5.99;
            const tax = subtotal * 0.08;
            const total = subtotal + shipping + tax;
            
            document.getElementById('cartSubtotal').textContent = `$${subtotal.toFixed(2)}`;
            document.getElementById('cartShipping').textContent = `$${shipping.toFixed(2)}`;
            document.getElementById('cartTax').textContent = `$${tax.toFixed(2)}`;
            document.getElementById('cartTotal').textContent = `$${total.toFixed(2)}`;
        }

        // Checkout
        function checkout() {
            if (cart.length === 0) {
                showAlert('Your cart is empty', 'error');
                return;
            }
            
            // Navigate to checkout page (to be implemented)
            showAlert('Checkout functionality coming soon!');
        }

        // View product details
        async function viewProductDetails(productId) {
            try {
                const response = await fetch(`/api/products/${productId}`);
                if (!response.ok) throw new Error('Failed to load product');
                
                const data = await response.json();
                showProductModal(data.product);
            } catch (error) {
                console.error('Error loading product:', error);
                showAlert('Failed to load product details', 'error');
            }
        }

        function showProductModal(product) {
            const content = document.getElementById('productModalContent');
            content.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <div class="product-image">
                        ${product.images?.[0] ? 
                            `<img src="${product.images[0].url}" alt="${product.name}" style="width: 100%; border-radius: 8px;">` : 
                            `<div style="width: 100%; height: 300px; display: flex; align-items: center; justify-content: center; background: #e5e7eb; border-radius: 8px;">
                                <i class="fas fa-box" style="font-size: 4rem; color: #9ca3af;"></i>
                            </div>`
                        }
                    </div>
                    <div>
                        <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">${product.name}</h3>
                        <div style="color: #6b7280; margin-bottom: 1rem;">${product.category}</div>
                        
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                            <span style="font-size: 1.75rem; font-weight: 700;">$${product.price.toFixed(2)}</span>
                            ${product.comparePrice ? 
                                `<span style="color: #9ca3af; text-decoration: line-through;">$${product.comparePrice.toFixed(2)}</span>` : ''}
                        </div>
                        
                        <div class="product-rating" style="margin-bottom: 1.5rem;">
                            ${getStarRating(product.ratings?.average || 0)}
                            <span style="color: #6b7280; margin-left: 0.5rem;">
                                (${product.ratings?.count || 0} reviews)
                            </span>
                        </div>
                        
                        <div style="margin-bottom: 1.5rem;">
                            <div style="font-weight: 600; margin-bottom: 0.5rem;">Description:</div>
                            <p>${product.description}</p>
                        </div>
                        
                        <div style="margin-bottom: 1.5rem;">
                            <div style="font-weight: 600; margin-bottom: 0.5rem;">Stock:</div>
                            <span class="${product.stock > 0 ? 'status delivered' : 'status cancelled'}" style="padding: 0.25rem 0.75rem;">
                                ${product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                            </span>
                        </div>
                        
                        <button class="add-to-cart" onclick="addToCart('${product.id}'); hideProductModal();" 
                                style="width: 100%; padding: 1rem;" ${product.stock === 0 ? 'disabled' : ''}>
                            <i class="fas fa-cart-plus"></i>
                            ${product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                    </div>
                </div>
            `;
            
            document.getElementById('productModal').style.display = 'flex';
        }

        function hideProductModal() {
            document.getElementById('productModal').style.display = 'none';
        }

        // Wishlist functionality
        async function toggleWishlist(productId) {
            try {
                const response = await fetch(`/api/users/wishlist/${productId}`, {
                    method: 'POST',
                    headers: getAuthHeaders()
                });
                
                if (!response.ok) throw new Error('Failed to update wishlist');
                
                const data = await response.json();
                
                // Update button
                const button = document.querySelector(`[onclick="toggleWishlist('${productId}')"]`);
                if (button) {
                    const isInWishlist = data.message === 'Added to wishlist';
                    button.innerHTML = `<i class="fas fa-heart"></i>`;
                    button.classList.toggle('active', isInWishlist);
                }
                
                showAlert(data.message);
            } catch (error) {
                console.error('Error toggling wishlist:', error);
                showAlert('Failed to update wishlist', 'error');
            }
        }

        async function loadWishlist() {
            // Wishlist loading would be implemented here
        }

        function showWishlist() {
            document.getElementById('wishlistModal').style.display = 'flex';
        }

        function hideWishlist() {
            document.getElementById('wishlistModal').style.display = 'none';
        }

        // Profile and orders
        function showProfile() {
            // Implement profile view
            showAlert('Profile page coming soon!');
        }

        function showOrders() {
            // Implement orders view
            showAlert('Orders page coming soon!');
        }

        // Utility functions
        function getAuthHeaders() {
            const token = localStorage.getItem('token');
            return {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
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