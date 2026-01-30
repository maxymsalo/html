// ================================
// Catalog App – LocalStorage CRUD
// ================================

const STORAGE_KEY = "products";

// ----------------
// Storage helpers
// ----------------
function getProducts() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

// ----------------
// CRUD operations
// ----------------
function addProduct(product) {
  const products = getProducts();
  products.push(product);
  saveProducts(products);
}

function updateProduct(updatedProduct) {
  const products = getProducts().map(product =>
    product.id === updatedProduct.id ? updatedProduct : product
  );
  saveProducts(products);
}

function deleteProduct(id) {
  const products = getProducts().filter(product => product.id !== id);
  saveProducts(products);
}

// ----------------
// Search & Sort
// ----------------
function searchProducts(query) {
  return getProducts().filter(product =>
    product.name.toLowerCase().includes(query.toLowerCase())
  );
}

function sortByPrice(order = "asc") {
  return [...getProducts()].sort((a, b) =>
    order === "asc" ? a.price - b.price : b.price - a.price
  );
}

// ----------------
// Calculations
// ----------------
function getTotalPrice() {
  return getProducts().reduce((sum, product) => sum + product.price, 0);
}

// ----------------
// Rendering
// ----------------
const catalogGrid = document.querySelector(".catalog__grid");

function renderProducts(products) {
  if (!catalogGrid) return;

  catalogGrid.innerHTML = "";

  products.forEach(product => {
    const article = document.createElement("article");
    article.className = "product";

    article.innerHTML = `
      <div class="product__image-wrapper">
        ${product.isSale ? '<span class="product__badge">Sale</span>' : ''}
        <img src="${product.image || ''}" alt="${product.name}">
      </div>
      <h3 class="product__name">${product.name}</h3>
      <div class="product__price">
        ${product.oldPrice ? `<span class="product__price--old">$${product.oldPrice}USD</span>` : ''}
        $${product.price}USD
      </div>
      <button class="product__buy" data-id="${product.id}">Buy Now</button>
    `;

    catalogGrid.appendChild(article);
  });
}

// ----------------
// Cart logic (LocalStorage)
// ----------------
const CART_KEY = "cart";

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCounter();
}

function addToCart(product) {
  const cart = getCart();
  cart.push(product);
  saveCart(cart);
}

function updateCartCounter() {
  const counter = document.querySelector(".header__cart-count");
  if (!counter) return;
  counter.textContent = getCart().length;
}

document.addEventListener("click", event => {
  if (event.target.classList.contains("product__buy")) {
    const id = event.target.dataset.id;
    const product = getProducts().find(p => p.id === id);
    if (product) {
      addToCart(product);
    }
  }
});

// ----------------
// Init demo data
// ----------------
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

// Initial render
renderProducts(getProducts());
updateCartCounter();
