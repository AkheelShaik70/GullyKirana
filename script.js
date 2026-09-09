/* script.js */
let cart = [];
let isSignUpMode = false;
let activeSelectedStore = null;

function getProducts() {
    const stored = localStorage.getItem('gully_products');
    return stored ? JSON.parse(stored) : [];
}

function saveProducts(products) {
    localStorage.setItem('gully_products', JSON.stringify(products));
}

function getOrders() {
    return JSON.parse(localStorage.getItem('gully_orders')) || [];
}

function saveOrders(orders) {
    localStorage.setItem('gully_orders', JSON.stringify(orders));
}

// Use sessionStorage so each browser tab can maintain its own independent login
function getCurrentUser() {
    const stored = sessionStorage.getItem('gully_current_user');
    return stored ? JSON.parse(stored) : null;
}

function setCurrentUser(user) {
    if (user) {
        sessionStorage.setItem('gully_current_user', JSON.stringify(user));
    } else {
        sessionStorage.removeItem('gully_current_user');
    }
}

// DOM Elements
const authContainer = document.getElementById('authContainer');
const authForm = document.getElementById('authForm');
const authSubtitle = document.getElementById('authSubtitle');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const nameGroup = document.getElementById('nameGroup');
const storeNameGroup = document.getElementById('storeNameGroup');
const switchText = document.getElementById('switchText');
const toggleAuthMode = document.getElementById('toggleAuthMode');
const authRole = document.getElementById('authRole');

const customerView = document.getElementById('customerView');
const sellerView = document.getElementById('sellerView');
const storeSelectionSection = document.getElementById('storeSelectionSection');
const storeProductsSection = document.getElementById('storeProductsSection');
const storeCardGrid = document.getElementById('storeCardGrid');
const selectedStoreTitle = document.getElementById('selectedStoreTitle');
const backToStoresBtn = document.getElementById('backToStoresBtn');

const productGrid = document.getElementById('productGrid');
const addProductForm = document.getElementById('addProductForm');
const searchInput = document.getElementById('searchInput');
const cartBtn = document.getElementById('cartBtn');
const cartCountDisplay = document.getElementById('cartCount');
const cartModal = document.getElementById('cartModal');
const closeCart = document.getElementById('closeCart');
const cartItemsList = document.getElementById('cartItemsList');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const customerOrdersList = document.getElementById('customerOrdersList');
const sellerOrdersList = document.getElementById('sellerOrdersList');
const storeBadge = document.getElementById('storeBadge');
const sellerDashboardTitle = document.getElementById('sellerDashboardTitle');

authRole.addEventListener('change', (e) => {
    if (e.target.value === 'seller') {
        storeNameGroup.style.display = 'block';
        document.getElementById('authStoreName').required = true;
    } else {
        storeNameGroup.style.display = 'none';
        document.getElementById('authStoreName').required = false;
    }
});

function checkUserSession() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        authContainer.classList.add('hidden');
        updateNavbarForUser(currentUser);
    } else {
        authContainer.classList.remove('hidden');
    }
}

if (toggleAuthMode) {
    toggleAuthMode.addEventListener('click', (e) => {
        e.preventDefault();
        isSignUpMode = !isSignUpMode;
        if (isSignUpMode) {
            authSubtitle.textContent = "Create a new GullyKirana account";
            authSubmitBtn.textContent = "Sign Up";
            nameGroup.style.display = "block";
            if (authRole.value === 'seller') storeNameGroup.style.display = "block";
            switchText.textContent = "Already have an account?";
            toggleAuthMode.textContent = "Log In";
        } else {
            authSubtitle.textContent = "Please log in to continue";
            authSubmitBtn.textContent = "Log In";
            nameGroup.style.display = "none";
            storeNameGroup.style.display = "none";
            switchText.textContent = "Don't have an account?";
            toggleAuthMode.textContent = "Sign Up";
        }
    });
}

if (authForm) {
    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('authEmail').value.trim();
        const password = document.getElementById('authPassword').value;
        let users = JSON.parse(localStorage.getItem('gully_users')) || [];

        if (isSignUpMode) {
            const name = document.getElementById('authName').value.trim();
            const role = authRole.value;
            const storeName = role === 'seller' ? document.getElementById('authStoreName').value.trim() : null;

            if (users.some(u => u.email === email)) {
                alert('User with this email already exists!');
                return;
            }

            if (role === 'seller' && !storeName) {
                alert('Please provide a store name.');
                return;
            }

            users.push({ name, email, password, role, storeName });
            localStorage.setItem('gully_users', JSON.stringify(users));
            alert('Account created successfully! Please log in.');
            isSignUpMode = false;
            toggleAuthMode.click();
        } else {
            const user = users.find(u => u.email === email && u.password === password);
            if (!user) {
                alert('Invalid email or password.');
                return;
            }
            setCurrentUser(user);
            authContainer.classList.add('hidden');
            updateNavbarForUser(user);
        }
    });
}

function updateNavbarForUser(user) {
    let logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) {
        logoutBtn = document.createElement('button');
        logoutBtn.id = 'logoutBtn';
        logoutBtn.className = 'btn secondary-btn';
        logoutBtn.textContent = 'Log Out';
        logoutBtn.addEventListener('click', () => {
            setCurrentUser(null);
            location.reload();
        });
        document.querySelector('.nav-controls').appendChild(logoutBtn);
    }

    if (user.role === 'seller') {
        sellerView.classList.remove('hidden');
        sellerView.classList.add('active');
        storeBadge.style.display = 'inline-block';
        storeBadge.textContent = `Store: ${user.storeName || 'My Store'}`;
        sellerDashboardTitle.textContent = `Seller Dashboard - ${user.storeName}`;
        renderSellerDashboard(user.storeName);
    } else {
        customerView.classList.remove('hidden');
        customerView.classList.add('active');
        cartBtn.style.display = 'inline-block';
        renderStoreCards();
        renderCustomerOrders();
    }
}

function renderStoreCards() {
    const products = getProducts();
    const stores = [...new Set(products.map(p => p.storeName))].filter(Boolean);
    
    storeCardGrid.innerHTML = '';
    
    if (stores.length === 0) {
        storeCardGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#666;">No active stores available yet. Sellers need to add products first!</p>`;
        return;
    }

    stores.forEach(storeName => {
        const storeProducts = products.filter(p => p.storeName === storeName);
        const card = document.createElement('div');
        card.className = 'store-card';
        card.innerHTML = `
            <h3>🏪 ${storeName}</h3>
            <p>${storeProducts.length} item(s) available</p>
            <span style="color: var(--primary); font-weight: 600; margin-top: 0.5rem;">Explore Store →</span>
        `;
        card.addEventListener('click', () => {
            openStore(storeName);
        });
        storeCardGrid.appendChild(card);
    });
}

function openStore(storeName) {
    activeSelectedStore = storeName;
    storeSelectionSection.classList.add('hidden');
    storeProductsSection.classList.remove('hidden');
    selectedStoreTitle.textContent = `Products from ${storeName}`;
    
    const products = getProducts().filter(p => p.storeName === storeName);
    renderProducts(products);
}

backToStoresBtn.addEventListener('click', () => {
    activeSelectedStore = null;
    storeProductsSection.classList.add('hidden');
    storeSelectionSection.classList.remove('hidden');
    renderStoreCards();
});

function renderProducts(productsToDisplay) {
    if (!productGrid) return;
    productGrid.innerHTML = '';
    if (productsToDisplay.length === 0) {
        productGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#666;">No products found in this store.</p>`;
        return;
    }

    productsToDisplay.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-img" onerror="this.src='https://via.placeholder.com/400?text=No+Image'">
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3>${product.name}</h3>
                <div class="product-price">₹${product.price}</div>
                <button class="btn primary-btn" onclick="addToCart(${product.id})">Add to Cart</button>
            </div>
        `;
        productGrid.appendChild(card);
    });
}

window.addToCart = function(productId) {
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (cart.length > 0 && cart[0].storeName !== product.storeName) {
        if (!confirm(`Your cart contains items from ${cart[0].storeName}. Clear cart to start a new order with ${product.storeName}?`)) {
            return;
        }
        cart = [];
    }

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    updateCartCount();
    alert(`${product.name} added to cart!`);
};

function updateCartCount() {
    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCountDisplay.textContent = totalCount;
}

if (cartBtn) {
    cartBtn.addEventListener('click', () => {
        renderCartModalItems();
        cartModal.classList.remove('hidden');
    });
}

if (closeCart) {
    closeCart.addEventListener('click', () => cartModal.classList.add('hidden'));
}

function renderCartModalItems() {
    cartItemsList.innerHTML = '';
    if (cart.length === 0) {
        cartItemsList.innerHTML = `<p style="text-align:center; color:#666;">Your cart is empty.</p>`;
        cartTotal.textContent = '0';
        return;
    }

    let total = 0;
    cart.forEach(item => {
        total += item.price * item.qty;
        const row = document.createElement('div');
        row.className = 'cart-item-row';
        row.innerHTML = `
            <span>${item.name} (x${item.qty})</span>
            <strong>₹${item.price * item.qty}</strong>
        `;
        cartItemsList.appendChild(row);
    });
    cartTotal.textContent = total;
}

if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        const currentUser = getCurrentUser();
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const targetStore = cart[0].storeName;

        const newOrder = {
            id: 'ORD-' + Date.now().toString().slice(-6),
            customerName: currentUser.name,
            customerEmail: currentUser.email,
            storeName: targetStore,
            items: [...cart],
            total: totalAmount,
            payment: paymentMethod,
            status: 'Waiting for seller acceptation',
            date: new Date().toLocaleTimeString()
        };

        const orders = getOrders();
        orders.push(newOrder);
        saveOrders(orders);

        cart = [];
        updateCartCount();
        cartModal.classList.add('hidden');

        alert(`Order placed successfully with ${targetStore}! Waiting for seller acceptation.`);
        renderCustomerOrders();
    });
}

function renderCustomerOrders() {
    if (!customerOrdersList) return;
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const orders = getOrders().filter(o => o.customerEmail === currentUser.email);

    customerOrdersList.innerHTML = '';
    if (orders.length === 0) {
        customerOrdersList.innerHTML = `<p style="color:#666;">No active orders found.</p>`;
        return;
    }

    orders.forEach(order => {
        const card = document.createElement('div');
        card.className = `order-card ${order.status.includes('accepted') ? 'accepted' : order.status.includes('rejected') ? 'rejected' : ''}`;
        card.innerHTML = `
            <div><strong>Order ID:</strong> ${order.id} | <strong>Store:</strong> ${order.storeName}</div>
            <div><strong>Items:</strong> ${order.items.map(i => `${i.name} (x${i.qty})`).join(', ')}</div>
            <div><strong>Total:</strong> ₹${order.total} (${order.payment})</div>
            <div style="margin-top:0.5rem; font-weight:bold; color: var(--primary);">Status: ${order.status}</div>
        `;
        customerOrdersList.appendChild(card);
    });
}

if (addProductForm) {
    addProductForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentUser = getCurrentUser();
        const name = document.getElementById('prodName').value;
        const price = Number(document.getElementById('prodPrice').value);
        const category = document.getElementById('prodCategory').value;
        const image = document.getElementById('prodImage').value;

        const products = getProducts();
        products.push({ id: Date.now(), name, price, category, storeName: currentUser.storeName, image });
        saveProducts(products);

        alert('Product added successfully! Your store is now live for customers.');
        addProductForm.reset();
        renderSellerDashboard(currentUser.storeName);
    });
}

function renderSellerDashboard(storeName) {
    if (!sellerOrdersList) return;
    const orders = getOrders().filter(o => o.storeName === storeName);

    sellerOrdersList.innerHTML = '';
    if (orders.length === 0) {
        sellerOrdersList.innerHTML = `<p style="color:#666;">No incoming orders for your store yet.</p>`;
        return;
    }

    orders.forEach(order => {
        const card = document.createElement('div');
        card.className = `order-card ${order.status.includes('accepted') ? 'accepted' : order.status.includes('rejected') ? 'rejected' : ''}`;
        card.innerHTML = `
            <div><strong>Order ID:</strong> ${order.id} | <strong>Customer:</strong> ${order.customerName}</div>
            <div><strong>Items:</strong> ${order.items.map(i => `${i.name} (x${i.qty})`).join(', ')}</div>
            <div><strong>Total:</strong> ₹${order.total} (${order.payment})</div>
            <div style="margin-top:0.5rem; font-weight:bold;">Status: ${order.status}</div>
            ${order.status === 'Waiting for seller acceptation' ? `
                <div class="order-actions">
                    <button class="btn primary-btn" onclick="updateOrderStatus('${order.id}', 'Accepted by seller')">Accept</button>
                    <button class="btn secondary-btn" onclick="updateOrderStatus('${order.id}', 'Rejected by seller')" style="background-color:#ffcdd2; color:#b71c1c;">Reject</button>
                </div>
            ` : ''}
        `;
        sellerOrdersList.appendChild(card);
    });
}

window.updateOrderStatus = function(orderId, newStatus) {
    let orders = getOrders();
    orders = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    saveOrders(orders);
    
    const currentUser = getCurrentUser();
    renderSellerDashboard(currentUser.storeName);
    alert(`Order ${orderId} marked as: ${newStatus}`);
};

setInterval(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
        if (currentUser.role === 'customer') {
            renderCustomerOrders();
            // Refresh store list view if on card selection screen
            if (!storeSelectionSection.classList.contains('hidden')) {
                renderStoreCards();
            }
        }
        if (currentUser.role === 'seller') {
            renderSellerDashboard(currentUser.storeName);
        }
    }
}, 2000);

checkUserSession();