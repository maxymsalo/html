// ================================
// Catalog App – FINAL VERSION
// LocalStorage + HTMX + Toolbar
// ================================

const PRODUCTS_KEY = "products";
const CART_KEY = "cart";

/* ================================
   Storage helpers
================================ */
function getProducts() {
  return JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
}

function saveProducts(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCounter();
}

/* ================================
   CRUD operations
================================ */
function addProduct(product) {
  const products = getProducts();
  products.push(product);
  saveProducts(products);
}

function updateProduct(updatedProduct) {
  const products = getProducts().map(p =>
    p.id === updatedProduct.id ? updatedProduct : p
  );
  saveProducts(products);
}

function deleteProduct(id) {
  const products = getProducts().filter(p => p.id !== id);
  saveProducts(products);
}

/* ================================
   Rendering (Catalog)
================================ */
function renderProducts(products) {
  const grid = document.querySelector(".catalog__grid");
  if (!grid) return;

  grid.innerHTML = "";

  products.forEach(product => {
    const card = document.createElement("article");
    card.className = "product";

    card.innerHTML = `
      <div class="product__image-wrapper">
        ${product.isSale ? `<span class="product__badge">Sale</span>` : ""}
        <img src="${product.image || ""}" alt="${product.name}">
      </div>

      <h3 class="product__name">${product.name}</h3>

      <div class="product__price">
        ${
          product.oldPrice
            ? `<span class="product__price--old">$${product.oldPrice}USD</span>`
            : ""
        }
        $${product.price}USD
      </div>

      <div class="product__actions">
        <button class="product__buy" data-id="${product.id}">Buy Now</button>
        <button class="product__delete" data-id="${product.id}">Delete</button>
      </div>
    `;

    grid.appendChild(card);
  });

  updateCatalogTotal(products);
}

/* ================================
   Catalog toolbar logic
================================ */
function updateCatalogTotal(products) {
  const totalEl = document.querySelector(".catalog-toolbar__total-value");
  if (!totalEl) return;

  const total = products.reduce((sum, p) => sum + p.price, 0);
  totalEl.textContent = `$${total}`;
}

function applySearchAndSort() {
  const searchInput = document.querySelector(".catalog-toolbar__search");
  const sortSelect = document.querySelector(".catalog-toolbar__sort");

  let products = getProducts();

  if (searchInput && searchInput.value.trim()) {
    const query = searchInput.value.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(query)
    );
  }

  if (sortSelect) {
    const value = sortSelect.value;

    if (value === "price-asc") {
      products.sort((a, b) => a.price - b.price);
    }
    if (value === "price-desc") {
      products.sort((a, b) => b.price - a.price);
    }
    if (value === "name") {
      products.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  renderProducts(products);
}

/* ================================
   Cart logic
================================ */
function addToCart(product) {
  const cart = getCart();
  cart.push(product);
  saveCart(cart);

  const popup = document.querySelector(".cart-popup");
  if (popup && !popup.hidden) {
    renderCartPopup();
  }
}

function updateCartCounter() {
  const counter = document.querySelector(".header__cart-count");
  if (!counter) return;

  counter.textContent = getCart().length;
}

/* ================================
   Cart popup rendering
================================ */
function renderCartPopup() {
  const popup = document.querySelector(".cart-popup");
  if (!popup) return;

  const listEl = popup.querySelector(".cart-popup__list");
  const totalEl = popup.querySelector(".cart-popup__total");

  const cart = getCart();
  listEl.innerHTML = "";

  if (cart.length === 0) {
    listEl.innerHTML = "<p>Cart is empty</p>";
    totalEl.textContent = "Total: $0 USD";
    return;
  }

  let total = 0;

  cart.forEach((item, index) => {
    total += item.price;

    const row = document.createElement("div");
    row.className = "cart-popup__item";

    row.innerHTML = `
      <span>${item.name}</span>
      <span>
        $${item.price}
        <button class="cart-popup__remove" data-index="${index}">✕</button>
      </span>
    `;

    listEl.appendChild(row);
  });

  totalEl.textContent = `Total: $${total} USD`;
}

/* ================================
   Global event delegation
================================ */
document.addEventListener("click", event => {
  // Buy Now
  const buyBtn = event.target.closest(".product__buy");
  if (buyBtn) {
    const id = buyBtn.dataset.id;
    const product = getProducts().find(p => p.id === id);
    if (product) addToCart(product);
    return;
  }

  // Delete product
  const deleteBtn = event.target.closest(".product__delete");
  if (deleteBtn) {
    deleteProduct(deleteBtn.dataset.id);
    applySearchAndSort();
    return;
  }

  // Cart popup toggle
  const cartBtn = event.target.closest(".header__cart-btn");
  const popup = document.querySelector(".cart-popup");

  if (cartBtn && popup) {
    popup.hidden = !popup.hidden;
    if (!popup.hidden) renderCartPopup();
    return;
  }

  // Remove from popup
  if (event.target.classList.contains("cart-popup__remove")) {
    const index = Number(event.target.dataset.index);
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderCartPopup();
    return;
  }

  // Click outside popup
  if (popup && !popup.contains(event.target) && !cartBtn) {
    popup.hidden = true;
  }
});

document.addEventListener("input", event => {
  if (
    event.target.classList.contains("catalog-toolbar__search")
  ) {
    applySearchAndSort();
  }
});

document.addEventListener("change", event => {
  if (
    event.target.classList.contains("catalog-toolbar__sort")
  ) {
    applySearchAndSort();
  }
});

/* ================================
   Init demo data
================================ */
if (getProducts().length === 0) {
  saveProducts([
    {
      id: "watch-001",
      name: "Aureus Chronograph",
      type: "mechanical",
      price: 185500,
      oldPrice: null,
      isSale: false,
      image: "img/watch-1.png"
    },
    {
      id: "watch-002",
      name: "Lunar Horizon",
      type: "mechanical",
      price: 190000,
      oldPrice: null,
      isSale: false,
      image: "img/watch-2.png"
    },
    {
      id: "watch-003",
      name: "Midnight Meridian",
      type: "mechanical",
      price: 200000,
      oldPrice: 250000,
      isSale: true,
      image: "img/watch-3.png"
    },
    {
      id: "watch-004",
      name: "Veyra Atlas",
      type: "mechanical",
      price: 145500,
      oldPrice: null,
      isSale: false,
      image: "img/watch-4.png"
    }
  ]);
}

/* ================================
   HTMX integration
================================ */
document.addEventListener("htmx:afterSwap", () => {
  applySearchAndSort();
  updateCartCounter();
});
