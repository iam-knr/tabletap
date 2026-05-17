// Minimal client-side prototype for Tabletap
// No build step needed – uses plain JS and DOM APIs.

const MOCK_FOOD_COURT = {
  id: 1,
  name: "Tabletap Food Court",
  shops: [
    { id: 1, name: "Burger Bay", code: "BB", prepTime: "15-20 min", type: "Non-veg" },
    { id: 2, name: "Veggie Villa", code: "VV", prepTime: "10-15 min", type: "Veg" },
    { id: 3, name: "Pizza Point", code: "PP", prepTime: "20-25 min", type: "Veg / Non-veg" },
    { id: 4, name: "Chaai Stories", code: "CS", prepTime: "5-10 min", type: "Snacks" },
  ],
};

const MOCK_MENUS = {
  1: [
    { id: 11, name: "Classic Burger", price: 150 },
    { id: 12, name: "Cheese Burst Burger", price: 190 },
    { id: 13, name: "French Fries", price: 90 },
  ],
  2: [
    { id: 21, name: "Paneer Bowl", price: 180 },
    { id: 22, name: "Veg Thali", price: 220 },
  ],
  3: [
    { id: 31, name: "Margherita Pizza", price: 250 },
    { id: 32, name: "Farmhouse Pizza", price: 320 },
  ],
  4: [
    { id: 41, name: "Masala Chai", price: 30 },
    { id: 42, name: "Cold Coffee", price: 120 },
    { id: 43, name: "Samosa", price: 25 },
  ],
};

let state = {
  screen: "shops", // shops | menu | cart | checkout | confirmation
  selectedShopId: null,
  cart: {}, // { shopId: { shop, items: { menuItemId: { item, qty } } } }
  checkoutDetails: {
    name: "",
    phone: "",
    table: "",
  },
  tokens: [],
};

const app = document.getElementById("app");

function setState(partial) {
  state = { ...state, ...partial };
  render();
}

function formatCurrency(v) {
  return `₹${v.toFixed(2)}`;
}

function getCartTotals() {
  let grand = 0;
  const perShop = [];
  Object.values(state.cart).forEach((shopEntry) => {
    let total = 0;
    Object.values(shopEntry.items).forEach((i) => {
      total += i.item.price * i.qty;
    });
    grand += total;
    perShop.push({ shop: shopEntry.shop, total });
  });
  return { grand, perShop };
}

function addToCart(shopId, item) {
  const shop = MOCK_FOOD_COURT.shops.find((s) => s.id === shopId);
  const cart = { ...state.cart };
  const shopEntry = cart[shopId] || { shop, items: {} };
  const current = shopEntry.items[item.id] || { item, qty: 0 };
  current.qty += 1;
  shopEntry.items[item.id] = current;
  cart[shopId] = shopEntry;
  setState({ cart });
}

function updateQty(shopId, itemId, delta) {
  const cart = { ...state.cart };
  const shopEntry = cart[shopId];
  if (!shopEntry) return;
  const current = shopEntry.items[itemId];
  if (!current) return;
  current.qty += delta;
  if (current.qty <= 0) {
    delete shopEntry.items[itemId];
  }
  if (Object.keys(shopEntry.items).length === 0) {
    delete cart[shopId];
  }
  setState({ cart });
}

function clearCart() {
  setState({ cart: {} });
}

function generateTokens() {
  const tokens = [];
  Object.values(state.cart).forEach((shopEntry) => {
    const random = Math.floor(100 + Math.random() * 900);
    tokens.push({ shop: shopEntry.shop, token: `${shopEntry.shop.code}-${random}` });
  });
  return tokens;
}

function goToShop(shopId) {
  setState({ screen: "menu", selectedShopId: shopId });
}

function goHome() {
  setState({ screen: "shops", selectedShopId: null });
}

function goToCart() {
  setState({ screen: "cart" });
}

function goToCheckout() {
  setState({ screen: "checkout" });
}

function submitCheckout(e) {
  e.preventDefault();
  const form = e.target;
  const details = {
    name: form.name.value.trim(),
    phone: form.phone.value.trim(),
    table: form.table.value.trim(),
  };
  state.checkoutDetails = details;
  const tokens = generateTokens();
  setState({ screen: "confirmation", tokens });
  clearCart();
}

function renderShopsScreen() {
  const cartCount = Object.values(state.cart).reduce((acc, shopEntry) => {
    return (
      acc + Object.values(shopEntry.items).reduce((a, i) => a + i.qty, 0)
    );
  }, 0);

  return `
    <div class="card">
      <h1>${MOCK_FOOD_COURT.name}</h1>
      <p class="text-sm text-muted">Scan QR → choose your shop → order from multiple counters in one go.</p>

      <h2 class="mt-3">Shops</h2>
      <ul class="list mt-2">
        ${MOCK_FOOD_COURT.shops
          .map(
            (shop) => `
              <li class="list-item">
                <div>
                  <div>${shop.name}</div>
                  <div class="row mt-1">
                    <span class="chip">${shop.type}</span>
                    <span class="chip">Prep: ${shop.prepTime}</span>
                  </div>
                </div>
                <button class="button" data-shop-id="${shop.id}">View menu</button>
              </li>
            `,
          )
          .join("")}
      </ul>
      <div class="footer-bar">
        <button class="button secondary" id="view-cart" ${
          cartCount === 0 ? "disabled" : ""
        }>
          Cart · ${cartCount} item${cartCount === 1 ? "" : "s"}
        </button>
      </div>
    </div>
  `;
}

function bindShopsScreen() {
  MOCK_FOOD_COURT.shops.forEach((shop) => {
    const btn = document.querySelector(`button[data-shop-id="${shop.id}"]`);
    if (btn) btn.onclick = () => goToShop(shop.id);
  });
  const viewCart = document.getElementById("view-cart");
  if (viewCart) viewCart.onclick = () => goToCart();
}

function renderMenuScreen() {
  const shop = MOCK_FOOD_COURT.shops.find((s) => s.id === state.selectedShopId);
  const menu = MOCK_MENUS[shop.id] || [];

  return `
    <div class="card">
      <button class="button secondary" id="back-to-shops">← All shops</button>
      <h2 class="mt-3">${shop.name}</h2>
      <p class="text-sm text-muted">Tap + to add items. You can switch shops anytime.</p>
      <ul class="list mt-2">
        ${menu
          .map(
            (item) => `
              <li class="list-item">
                <div>
                  <div>${item.name}</div>
                  <div class="text-sm text-muted mt-1">${formatCurrency(
                    item.price,
                  )}</div>
                </div>
                <button class="button" data-add-item="${item.id}">+ Add</button>
              </li>
            `,
          )
          .join("")}
      </ul>
      <div class="footer-bar row space-between mt-3">
        <button class="button secondary" id="go-home">Food court</button>
        <button class="button" id="go-cart">View cart</button>
      </div>
    </div>
  `;
}

function bindMenuScreen() {
  document.getElementById("back-to-shops").onclick = () => goHome();
  document.getElementById("go-home").onclick = () => goHome();
  document.getElementById("go-cart").onclick = () => goToCart();

  const shopId = state.selectedShopId;
  const menu = MOCK_MENUS[shopId] || [];
  menu.forEach((item) => {
    const btn = document.querySelector(`button[data-add-item="${item.id}"]`);
    if (btn) btn.onclick = () => addToCart(shopId, item);
  });
}

function renderCartScreen() {
  const { grand, perShop } = getCartTotals();

  const hasItems = perShop.length > 0;

  return `
    <div class="card">
      <button class="button secondary" id="back-from-cart">← Back</button>
      <h2 class="mt-3">Your cart</h2>
      ${
        !hasItems
          ? '<p class="mt-2 text-muted text-sm">No items yet. Add from any shop.</p>'
          : `
        <div class="mt-2">
          ${perShop
            .map((s) => {
              const shopEntry = state.cart[s.shop.id];
              const lines = Object.values(shopEntry.items)
                .map(
                  (i) => `
                    <li class="list-item">
                      <div>
                        <div>${i.item.name}</div>
                        <div class="text-xs text-muted mt-1">${formatCurrency(
                          i.item.price,
                        )} × ${i.qty}</div>
                      </div>
                      <div class="text-right">
                        <div class="text-sm">${formatCurrency(
                          i.item.price * i.qty,
                        )}</div>
                        <div class="row mt-1">
                          <button class="button secondary text-xs" data-dec="${
                            s.shop.id
                          }:${i.item.id}">−</button>
                          <button class="button text-xs" data-inc="${
                            s.shop.id
                          }:${i.item.id}">+</button>
                        </div>
                      </div>
                    </li>
                  `,
                )
                .join("");

              return `
                <div class="mt-3">
                  <div class="row space-between">
                    <h3>${s.shop.name}</h3>
                    <span class="badge-pill">${formatCurrency(s.total)}</span>
                  </div>
                  <ul class="list mt-1">${lines}</ul>
                </div>
              `;
            })
            .join("")}
        </div>
      `
      }

      <div class="footer-bar mt-4">
        <div class="row space-between text-sm text-muted">
          <span>Grand total</span>
          <span>${formatCurrency(grand)}</span>
        </div>
        <button class="button mt-3" id="go-checkout" ${
          !hasItems ? "disabled" : ""
        }>Checkout</button>
      </div>
    </div>
  `;
}

function bindCartScreen() {
  document.getElementById("back-from-cart").onclick = () => goHome();
  const { perShop } = getCartTotals();
  perShop.forEach((s) => {
    const shopEntry = state.cart[s.shop.id];
    Object.values(shopEntry.items).forEach((i) => {
      const dec = document.querySelector(
        `button[data-dec="${s.shop.id}:${i.item.id}"]`,
      );
      const inc = document.querySelector(
        `button[data-inc="${s.shop.id}:${i.item.id}"]`,
      );
      if (dec) dec.onclick = () => updateQty(s.shop.id, i.item.id, -1);
      if (inc) inc.onclick = () => updateQty(s.shop.id, i.item.id, 1);
    });
  });

  const goCheckout = document.getElementById("go-checkout");
  if (goCheckout) goCheckout.onclick = () => goToCheckout();
}

function renderCheckoutScreen() {
  const { grand, perShop } = getCartTotals();

  return `
    <div class="card">
      <button class="button secondary" id="back-from-checkout">← Cart</button>
      <h2 class="mt-3">Checkout</h2>
      <p class="text-sm text-muted">Review per-counter amounts and enter your details.</p>
      <div class="mt-2">
        ${perShop
          .map(
            (s) => `
              <div class="row space-between mt-1 text-sm">
                <span>${s.shop.name}</span>
                <span>${formatCurrency(s.total)}</span>
              </div>
            `,
          )
          .join("")}
      </div>
      <div class="row space-between mt-3 text-sm">
        <span>Total payable</span>
        <span>${formatCurrency(grand)}</span>
      </div>

      <form id="checkout-form" class="mt-4">
        <div class="mt-2">
          <label for="name">Name</label>
          <input id="name" name="name" type="text" required />
        </div>
        <div class="mt-2">
          <label for="phone">Mobile</label>
          <input id="phone" name="phone" type="tel" required />
        </div>
        <div class="mt-2">
          <label for="table">Table / Pickup</label>
          <input id="table" name="table" type="text" required />
        </div>
        <button class="button mt-3" type="submit">Pay & generate tokens</button>
      </form>
    </div>
  `;
}

function bindCheckoutScreen() {
  document.getElementById("back-from-checkout").onclick = () => goToCart();
  const form = document.getElementById("checkout-form");
  form.onsubmit = submitCheckout;
}

function renderConfirmationScreen() {
  const details = state.checkoutDetails;
  const tokens = state.tokens;

  return `
    <div class="card">
      <h2>Order placed</h2>
      <p class="text-sm text-muted mt-1">Share these tokens at each counter when your order is called.</p>

      <div class="mt-3 text-sm">
        <div><strong>Name:</strong> ${details.name || "Guest"}</div>
        <div class="mt-1"><strong>Table/Pickup:</strong> ${
          details.table || "N/A"
        }</div>
      </div>

      <div class="mt-3">
        ${tokens
          .map(
            (t) => `
              <div class="row space-between mt-2">
                <div>
                  <div class="text-sm">${t.shop.name}</div>
                  <div class="text-xs text-muted mt-1">Show this at the counter</div>
                </div>
                <div class="badge-pill">Token: ${t.token}</div>
              </div>
            `,
          )
          .join("")}
      </div>

      <div class="footer-bar mt-4">
        <button class="button" id="new-order">New order</button>
      </div>
    </div>
  `;
}

function bindConfirmationScreen() {
  document.getElementById("new-order").onclick = () => {
    setState({
      screen: "shops",
      selectedShopId: null,
      cart: {},
      checkoutDetails: { name: "", phone: "", table: "" },
      tokens: [],
    });
  };
}

function render() {
  let html = "";
  if (state.screen === "shops") html = renderShopsScreen();
  if (state.screen === "menu") html = renderMenuScreen();
  if (state.screen === "cart") html = renderCartScreen();
  if (state.screen === "checkout") html = renderCheckoutScreen();
  if (state.screen === "confirmation") html = renderConfirmationScreen();

  app.innerHTML = html;

  if (state.screen === "shops") bindShopsScreen();
  if (state.screen === "menu") bindMenuScreen();
  if (state.screen === "cart") bindCartScreen();
  if (state.screen === "checkout") bindCheckoutScreen();
  if (state.screen === "confirmation") bindConfirmationScreen();
}

render();
