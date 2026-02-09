// ================================
// Catalog App – FINAL STABLE VERSION
// LocalStorage + HTMX + Mini Cart
// ================================

const PRODUCTS_KEY = "products";
const CART_KEY = "cart";

/* ================================
   Catalog UI state
================================ */
const catalogState = {
  search: "",
  sort: ""
};

let editingProductId = null;

/* ================================
   Utils
================================ */
function formatPrice(value) {
  return Number(value).toLocaleString("en-US");
}

/* ================================
   Storage helpers
================================ */
function getProducts() {
  return JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
}

function saveProducts(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

// Ініціалізація продуктів
if (!localStorage.getItem("products")) {
  saveProducts([
    {
      id: "p1",
      name: "Aureus Chronograph",
      price: 185.5,
      image: "img/watch-1.png"
    },
    {
      id: "p2",
      name: "Lunar Horizon",
      price: 190,
      image: "img/watch-2.png"
    },
    {
      id: "p3",
      name: "Midnight Meridian",
      price: 200,
      image: "img/watch-3.png"
    },
    {
      id: "p4",
      name: "Veyra Atlas",
      price: 145.5,
      image: "img/watch-4.png"
    }
  ]);
}

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCounter();
}

/* ================================
   CRUD
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
  saveProducts(getProducts().filter(p => p.id !== id));
}

/* ================================
   Modal logic (Add / Edit)
================================ */
function openModal(product = null) {
  const modal = document.getElementById("productModal");
  if (!modal) return;

  const form = modal.querySelector(".modal__form");

  modal.hidden = false;

  if (product) {
    // Edit mode
    editingProductId = product.id;
    form.name.value = product.name;
    form.price.value = product.price;
    form.image.value = product.image;
  } else {
    // Add mode
    editingProductId = null;
    form.reset();
  }
}

function closeModal() {
  const modal = document.getElementById("productModal");
  if (modal) modal.hidden = true;
}


/* ================================
   Notification (toast)
================================ */
function showNotification(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.hidden = false;
  toast.classList.add("show");

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => (toast.hidden = true), 300);
  }, 2000);
}

/* ================================
   Rendering – Catalog
================================ */
function renderProducts(products) {
  const grid = document.querySelector(".catalog__grid");
  if (!grid) return;

  grid.innerHTML = "";

  products.forEach(p => {
    grid.insertAdjacentHTML(
      "beforeend",
      `
      <article class="product">
        <div class="product__image-wrapper">
          <img src="${p.image}" alt="${p.name}">
        </div>

        <h3 class="product__name">${p.name}</h3>
        <div class="product__price">$${formatPrice(p.price)}</div>

        <div class="product__actions">
          <button class="product__buy" data-id="${p.id}">Buy Now</button>
          <button class="product__edit" data-id="${p.id}">Edit</button>
          <button class="product__delete" data-id="${p.id}">Delete</button>
        </div>
      </article>
      `
    );
  });

  updateCatalogTotal(products);
}

/* ================================
   Rendering – Mini Cart
================================ */
function renderCartPopup() {
  const popup = document.querySelector(".cart-popup");
  if (!popup) return;

  const listEl = popup.querySelector(".cart-popup__list");
  const totalEl = popup.querySelector(".cart-popup__total");
  if (!listEl || !totalEl) return;

  const cart = getCart();
  listEl.innerHTML = "";

  if (cart.length === 0) {
    listEl.innerHTML = "<p>Cart is empty</p>";
    totalEl.textContent = "Total: $0 USD";
    return;
  }

  let total = 0;

  cart.forEach((item, index) => {
    total += Number(item.price);

    listEl.insertAdjacentHTML(
      "beforeend",
      `
      <div class="cart-popup__item">
        <span>${item.name}</span>
        <span>
          $${formatPrice(item.price)}
          <button class="cart-popup__remove" data-index="${index}">✕</button>
        </span>
      </div>
      `
    );
  });

  totalEl.textContent = `Total: $${formatPrice(total)} USD`;
}

function openCartPopup() {
  const popup = document.querySelector(".cart-popup");
  if (!popup) return;

  popup.hidden = false;
  requestAnimationFrame(renderCartPopup);
}

/* ================================
   Toolbar logic
================================ */
function updateCatalogTotal(products) {
  const el = document.querySelector(".catalog-toolbar__total-value");
  if (!el) return;

  const total = products.reduce((sum, p) => sum + Number(p.price), 0);
  el.textContent = `$${formatPrice(total)}`;
}

function applySearchAndSort() {
  let products = getProducts();

  if (catalogState.search) {
    const q = catalogState.search.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(q));
  }

  if (catalogState.sort === "price-asc") {
    products.sort((a, b) => a.price - b.price);
  }

  if (catalogState.sort === "price-desc") {
    products.sort((a, b) => b.price - a.price);
  }

  if (catalogState.sort === "name") {
    products.sort((a, b) => a.name.localeCompare(b.name));
  }

  renderProducts(products);
}

/* ================================
   Cart logic
================================ */
function addToCart(product) {
  if (!product) return;
  const cart = getCart();
  cart.push(product);
  saveCart(cart);
}

function updateCartCounter() {
  const el = document.querySelector(".header__cart-count");
  if (el) el.textContent = getCart().length;
}

/* ================================
   Global event delegation
================================ */
document.addEventListener("click", e => {
  // Buy Now (FIXED)
  const buyBtn = e.target.closest(".product__buy");
  if (buyBtn) {
    const id = buyBtn.dataset.id;
    const product = getProducts().find(p => p.id === id);

    if (!product) {
      alert("Product not found");
      return;
    }

    addToCart(product);
    
    showNotification(`${product.name} added to cart`);
    return;
  }

  // Edit
  const editBtn = e.target.closest(".product__edit");
  if (editBtn) {
    const product = getProducts().find(p => p.id === editBtn.dataset.id);
    if (product) openModal(product);
    return;
  }

  // Delete
  const deleteBtn = e.target.closest(".product__delete");
  if (deleteBtn) {
    deleteProduct(deleteBtn.dataset.id);
    applySearchAndSort();
    return;
  }

  // Remove from cart
  if (e.target.classList.contains("cart-popup__remove")) {
    const index = Number(e.target.dataset.index);
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderCartPopup();
    return;
  }

  // Toggle cart popup
  const cartBtn = e.target.closest(".header__cart-btn");
  const popup = document.querySelector(".cart-popup");

  if (cartBtn && popup) {
    popup.hidden = !popup.hidden;
    if (!popup.hidden) renderCartPopup();
    return;
  }

  // Close cart popup on outside click
  if (popup && !popup.contains(e.target) && !cartBtn) {
    popup.hidden = true;
  }
  
  // Add new product
  const addBtn = e.target.closest(".catalog-toolbar__add");
  if (addBtn) {
  openModal();
  return;
  }

  if (
  e.target.classList.contains("modal__close") ||
  e.target.classList.contains("modal__overlay")
  ) {
  closeModal();
  return;
}

});

/* ================================
   Search & Sort listeners
================================ */
document.addEventListener("input", e => {
  if (e.target.classList.contains("catalog-toolbar__search")) {
    catalogState.search = e.target.value;
    applySearchAndSort();
  }
});

document.addEventListener("change", e => {
  if (e.target.classList.contains("catalog-toolbar__sort")) {
    catalogState.sort = e.target.value;
    applySearchAndSort();
  }
});

/* ================================
   HTMX integration
================================ */
document.addEventListener("htmx:afterSwap", () => {
  applySearchAndSort();
  updateCartCounter();
});

/* ================================
   Modal form submit
================================ */
document.addEventListener("submit", e => {
  if (!e.target.classList.contains("modal__form")) return;

  e.preventDefault();

  const form = e.target;

  const product = {
    id: editingProductId ?? crypto.randomUUID(),
    name: form.name.value.trim(),
    price: Number(form.price.value),
    image: form.image.value.trim()
  };

  if (!product.name || !product.price || !product.image) return;

  if (editingProductId) {
    updateProduct(product);
    showNotification("Product updated");
  } else {
    addProduct(product);
    showNotification("Product added");
  }

  closeModal();
  applySearchAndSort();
});
