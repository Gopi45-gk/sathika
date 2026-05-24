// ============================================================
// firestore.js - Replaced with REST API calls for DynamoDB Backend
// ============================================================
// Depends on: firebase-config.js (must be loaded first for auth token)
// ============================================================

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api' 
    : 'https://sathika.onrender.com/api';

async function getAuthHeaders(isFormData = false) {
    const user = typeof firebase !== 'undefined' ? firebase.auth().currentUser : null;
    if (!user) return isFormData ? {} : { 'Content-Type': 'application/json' };
    const token = await user.getIdToken();
    const headers = { 'Authorization': `Bearer ${token}` };
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
}

// ====== PRODUCTS ======

async function getAllProducts() {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    const products = await response.json();
    return products.map(p => ({ ...p, id: p.productId }));
}

async function getProductById(id) {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch product');
    }
    const product = await response.json();
    return { ...product, id: product.productId };
}

async function getProductsByCategory(category) {
    const response = await fetch(`${API_BASE_URL}/products?category=${encodeURIComponent(category)}`);
    if (!response.ok) throw new Error('Failed to fetch products');
    const products = await response.json();
    return products.map(p => ({ ...p, id: p.productId }));
}

async function addProduct(productData) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers,
        body: JSON.stringify(productData)
    });
    if (!response.ok) throw new Error('Failed to add product');
    const product = await response.json();
    return product.productId;
}

async function updateProduct(id, data) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update product');
}

async function deleteProduct(id) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers
    });
    if (!response.ok) throw new Error('Failed to delete product');
}

// ====== ORDERS ======

async function createOrder(orderData) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
    });
    if (!response.ok) throw new Error('Failed to create order');
    const order = await response.json();
    return order.orderId;
}

async function getOrdersByUser(userId) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/orders`, { headers });
    if (!response.ok) throw new Error('Failed to fetch orders');
    const orders = await response.json();
    return orders.map(o => ({ ...o, id: o.orderId }));
}

async function getAllOrders() {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/orders`, { headers });
    if (!response.ok) throw new Error('Failed to fetch orders');
    const orders = await response.json();
    return orders.map(o => ({ ...o, id: o.orderId }));
}

async function updateOrderStatus(orderId, status) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update order status');
}

// ====== REVIEWS ======

async function addReview(reviewData) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers,
        body: JSON.stringify(reviewData)
    });
    if (!response.ok) throw new Error('Failed to add review');
    const review = await response.json();
    return review.reviewId;
}

async function getReviewsByProduct(productId) {
    const response = await fetch(`${API_BASE_URL}/reviews/${productId}`);
    if (!response.ok) throw new Error('Failed to fetch reviews');
    const reviews = await response.json();
    return reviews.map(r => ({ ...r, id: r.reviewId }));
}

async function getAllReviews() {
    return [];
}

async function deleteReview(id) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/reviews/${id}`, {
        method: 'DELETE',
        headers
    });
    if (!response.ok) throw new Error('Failed to delete review');
}

// ====== WISHLIST ======

async function getWishlist() {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/wishlist`, { headers });
    if (!response.ok) throw new Error('Failed to fetch wishlist');
    return await response.json();
}

async function addToWishlist(productId) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/wishlist`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ productId })
    });
    if (!response.ok) throw new Error('Failed to add to wishlist');
}

async function removeFromWishlist(wishlistId) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/wishlist/${wishlistId}`, {
        method: 'DELETE',
        headers
    });
    if (!response.ok) throw new Error('Failed to delete from wishlist');
}

// ====== CART (Backend integration) ======
// Note: If you want to keep the local cart logic for unregistered users, you can use the previous logic.
// The user asked to use the backend API: `GET /api/cart` and `POST /api/cart`

let _cachedCart = [];

async function getCart() {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/cart`, { headers });
        if (response.ok) {
            const rawCart = await response.json();
            // Client-side join to fetch product details
            _cachedCart = await Promise.all(rawCart.map(async item => {
                try {
                    const prodRes = await fetch(`${API_BASE_URL}/products/${item.productId}`);
                    if (prodRes.ok) {
                        const product = await prodRes.json();
                        return { 
                            ...item, 
                            name: product.name, 
                            price: product.price, 
                            originalPrice: product.originalPrice || product.price,
                            image: product.images ? product.images[0] : product.imageUrl || product.image,
                            category: product.category 
                        };
                    }
                } catch(e) {}
                return item;
            }));
        }
    } catch (e) {
        // Fallback to local storage if not logged in
        _cachedCart = JSON.parse(localStorage.getItem('vastra_cart') || '[]');
    }
    return _cachedCart;
}

function getLocalCart() {
    return _cachedCart;
}

async function addToCart(product, quantity = 1) {
    try {
        const headers = await getAuthHeaders();
        if (headers.Authorization) {
            const response = await fetch(`${API_BASE_URL}/cart`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ productId: product.id, quantity })
            });
            if (response.ok) {
                await getCart();
                updateCartBadge();
                return _cachedCart;
            }
        }
    } catch(e) {}
    
    // Fallback to local
    let cart = JSON.parse(localStorage.getItem('vastra_cart') || '[]');
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice || product.price,
            image: product.images ? product.images[0] : product.imageUrl || product.image,
            category: product.category,
            quantity
        });
    }
    localStorage.setItem('vastra_cart', JSON.stringify(cart));
    _cachedCart = cart;
    updateCartBadge();
    return cart;
}

async function removeFromCart(cartIdOrProductId) {
    try {
        const headers = await getAuthHeaders();
        if (headers.Authorization) {
            const item = _cachedCart.find(i => i.cartId === cartIdOrProductId || i.productId === cartIdOrProductId);
            if (item && item.cartId) {
                await fetch(`${API_BASE_URL}/cart/${item.cartId}`, {
                    method: 'DELETE',
                    headers
                });
                await getCart();
                updateCartBadge();
                return _cachedCart;
            }
        }
    } catch(e) {}

    let cart = JSON.parse(localStorage.getItem('vastra_cart') || '[]');
    cart = cart.filter(item => item.productId !== cartIdOrProductId);
    localStorage.setItem('vastra_cart', JSON.stringify(cart));
    _cachedCart = cart;
    updateCartBadge();
    return cart;
}

async function updateCartQuantity(productId, quantity) {
    const item = _cachedCart.find(i => i.productId === productId);
    if (!item) return;

    try {
        const headers = await getAuthHeaders();
        if (headers.Authorization && item.cartId) {
            await fetch(`${API_BASE_URL}/cart/${item.cartId}`, {
                method: 'PUT',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ quantity })
            });
            await getCart();
            updateCartBadge();
            return _cachedCart;
        }
    } catch(e) {}

    // Fallback to local
    let cart = JSON.parse(localStorage.getItem('vastra_cart') || '[]');
    const localItem = cart.find(i => i.productId === productId);
    if (localItem) {
        localItem.quantity = quantity;
        localStorage.setItem('vastra_cart', JSON.stringify(cart));
        _cachedCart = cart;
        updateCartBadge();
    }
    return _cachedCart;
}

function getCartTotal() {
    return _cachedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function getCartCount() {
    return _cachedCart.reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const count = getCartCount();
    badges.forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    });
}

// ====== UPLOAD ======

async function uploadFile(file, path) {
    const headers = await getAuthHeaders(true); // true = isFormData
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers,
        body: formData
    });
    
    if (!response.ok) throw new Error('Failed to upload file');
    const result = await response.json();
    return result.imageUrl;
}

// Automatically fetch cart and update UI on page load / auth change
if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged(async (user) => {
        if (typeof getCart === 'function') {
            await getCart();
        }
        if (typeof updateCartBadge === 'function') updateCartBadge();
        if (typeof renderCart === 'function') renderCart();
        if (typeof renderCheckoutItems === 'function') renderCheckoutItems();
    });
}
