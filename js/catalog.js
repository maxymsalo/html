// ================================
// Catalog App – FINAL HTMX-SAFE
// ================================

const PRODUCTS_KEY = "products";
const CART_KEY = "cart";

/* ================================
   Catalog state (search / sort)
================================ */
const catalogState = {
  search: "",
  sort: ""
};

let editingProductId = null;

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
   Rendering
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
        <div class="product__price">$${p.price}</div>

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
   Toolbar logic
================================ */
function updateCatalogTotal(products) {
  const el = document.querySelector(".catalog-toolbar__total-value");
  if (!el) return;

  const total = products.reduce((sum, p) => sum + p.price, 0);
  el.textContent = `$${total}`;
}

function applySearchAndSort() {
  let products = getProducts();

  // SEARCH
  if (catalogState.search) {
    const q = catalogState.search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q)
    );
  }

  // SORT
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
   Cart
================================ */
function addToCart(product) {
  const cart = getCart();
  cart.push(product);
  saveCart(cart);
}

function updateCartCounter() {
  const el = document.querySelector(".header__cart-count");
  if (el) el.textContent = getCart().length;
}

/* ================================
   Modal helpers (HTMX-safe)
================================ */
function getModal() {
  const modal = document.getElementById("productModal");
  if (!modal) return null;

  return {
    modal,
    form: modal.querySelector(".modal__form"),
    overlay: modal.querySelector(".modal__overlay")
  };
}

function openModal(product = null) {
  const m = getModal();
  if (!m) return;

  m.modal.hidden = false;

  if (product) {
    m.form.name.value = product.name;
    m.form.price.value = product.price;
    m.form.image.value = product.image;
    editingProductId = product.id;
  } else {
    m.form.reset();
    editingProductId = null;
  }
}

function closeModal() {
  const m = getModal();
  if (!m) return;

  m.modal.hidden = true;
  m.form.reset();
  editingProductId = null;
}

/* ================================
   Global event delegation
================================ */
document.addEventListener("click", e => {
  // Add new product
  if (e.target.classList.contains("catalog-toolbar__add")) {
    openModal();
    return;
  }

  // Buy
  if (e.target.classList.contains("product__buy")) {
    const product = getProducts().find(p => p.id === e.target.dataset.id);
    if (product) addToCart(product);
    return;
  }

  // Edit
  if (e.target.classList.contains("product__edit")) {
    const product = getProducts().find(p => p.id === e.target.dataset.id);
    if (product) openModal(product);
    return;
  }

  // Delete
  if (e.target.classList.contains("product__delete")) {
    deleteProduct(e.target.dataset.id);
    applySearchAndSort();
    return;
  }

  // Close modal
  if (
    e.target.classList.contains("modal__overlay") ||
    e.target.classList.contains("modal__close")
  ) {
    closeModal();
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
   Modal submit
================================ */
document.addEventListener("submit", e => {
  if (!e.target.classList.contains("modal__form")) return;

  e.preventDefault();

  const { name, price, image } = e.target;

  if (editingProductId) {
    updateProduct({
      id: editingProductId,
      name: name.value.trim(),
      price: Number(price.value),
      image: image.value.trim()
    });
  } else {
    addProduct({
      id: Date.now().toString(),
      name: name.value.trim(),
      price: Number(price.value),
      image: image.value.trim()
    });
  }

  closeModal();
  applySearchAndSort();
});

/* ================================
   HTMX integration
================================ */
document.addEventListener("htmx:afterSwap", () => {
  applySearchAndSort();
  updateCartCounter();
});
