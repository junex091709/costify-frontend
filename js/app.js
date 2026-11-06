import { initialProducts, initialMaterials } from "./data.js";
const PRODUCTS_STORAGE_KEY = "costify_products_v1";
function loadProducts() {
  try {
    const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.warn("Could not load saved products:", error);
  }
  return [...initialProducts];
}
let products = loadProducts(),
  materials = [...initialMaterials];
function saveProducts() {
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  } catch (error) {
    console.error("Could not save products:", error);
    notify("Unable to save products in this browser");
  }
}
const $ = (s) => document.querySelector(s);
const money = (n) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    Number(n) || 0,
  );
const modal = new bootstrap.Modal($("#productModal")),
  toast = new bootstrap.Toast($("#appToast"));
function notify(message) {
  $("#toastMessage").textContent = message;
  toast.show();
}
function safe(s = "") {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function productRow(p) {
  return `<tr><td><strong>${safe(p.name)}</strong><small class="d-block text-secondary">${safe(p.sku)}</small></td><td>${safe(p.category)}</td><td>${money(p.cost)}</td><td>${money(p.price)}</td><td class="positive">${money(p.price - p.cost)}</td><td><button class="btn btn-sm btn-light" data-edit="${p.id}"><i class="bi bi-pencil"></i></button> <button class="btn btn-sm btn-light" data-duplicate="${p.id}"><i class="bi bi-copy"></i></button> <button class="btn btn-sm btn-light text-danger" data-delete="${p.id}"><i class="bi bi-trash"></i></button></td></tr>`;
}
function renderProducts() {
  const rows = products.map(productRow).join("");
  $("#productsTable").innerHTML = rows;
  $("#pricingTable").innerHTML = products
    .map(
      (p) =>
        `<tr><td>${safe(p.name)}</td><td>${money(p.cost)}</td><td>${money(p.price)}</td><td class="positive">${money(p.price - p.cost)}</td><td>${p.price ? (((p.price - p.cost) / p.price) * 100).toFixed(1) : 0}%</td></tr>`,
    )
    .join("");
  $("#recentProducts").innerHTML = products
    .slice(0, 5)
    .map(
      (p) =>
        `<tr><td>${safe(p.name)}</td><td>${safe(p.category)}</td><td>${money(p.cost)}</td><td>${money(p.price)}</td><td class="positive">${money(p.price - p.cost)}</td></tr>`,
    )
    .join("");
  $("#statProducts").textContent = products.length;
  $("#productNavCount").textContent = products.length;
}
function renderMaterials() {
  $("#materialsTable").innerHTML = materials
    .map(
      (m) =>
        `<tr><td>${safe(m.name)}</td><td>${m.sku}</td><td>${m.unit}</td><td>${money(m.cost)}</td><td>${m.stock}</td><td><span class="pill">${m.stock <= m.reorder ? "Low stock" : "In stock"}</span></td></tr>`,
    )
    .join("");
  $("#inventoryTable").innerHTML = materials
    .map(
      (m) =>
        `<tr><td>${safe(m.name)}</td><td>Raw material</td><td>${m.stock} ${m.unit}</td><td>${m.reorder} ${m.unit}</td><td>${m.stock <= m.reorder ? "Reorder" : "Healthy"}</td></tr>`,
    )
    .join("");
}
function openProduct(p = null) {
  $("#productForm").reset();
  $("#editProductId").value = p?.id || "";
  $("#productModalTitle").textContent = p ? "Edit product" : "Add new product";
  $("#productName").value = p?.name || "";
  $("#productCategory").value = p?.category || "Personalized";
  $("#productCost").value = p?.cost ?? 0;
  $("#productPrice").value = p?.price ?? 0;
  $("#productStatus").value = p?.status || "Active";
  $("#productDescription").value = p?.description || "";
  modal.show();
}
document
  .querySelectorAll("[data-open-product]")
  .forEach((b) => b.addEventListener("click", () => openProduct()));
$("#productForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = $("#editProductId").value;
  const p = {
    id: id || `prd_${Date.now()}`,
    name: $("#productName").value.trim(),
    sku: id
      ? products.find((x) => x.id === id)?.sku || ""
      : `NEW-${products.length + 1}`,
    category: $("#productCategory").value,
    cost: Number($("#productCost").value),
    price: Number($("#productPrice").value),
    status: $("#productStatus").value,
    description: $("#productDescription").value,
  };
  products = id ? products.map((x) => (x.id === id ? p : x)) : [p, ...products];
  saveProducts();
  renderProducts();
  modal.hide();
  notify(id ? "Product updated" : "Product added");
});
document.addEventListener("click", (e) => {
  const edit = e.target.closest("[data-edit]"),
    del = e.target.closest("[data-delete]"),
    dup = e.target.closest("[data-duplicate]");
  if (edit) openProduct(products.find((p) => p.id === edit.dataset.edit));
  if (del) {
    const p = products.find((x) => x.id === del.dataset.delete);
    if (p && confirm(`Delete ${p.name}?`)) {
      products = products.filter((x) => x.id !== p.id);
      saveProducts();
      renderProducts();
      notify("Product deleted");
    }
  }
  if (dup) {
    const p = products.find((x) => x.id === dup.dataset.duplicate);
    if (p) {
      products.unshift({
        ...p,
        id: `prd_${Date.now()}`,
        sku: `COPY-${Date.now().toString().slice(-4)}`,
        name: `${p.name} (Copy)`,
      });
      saveProducts();
      renderProducts();
      notify("Product duplicated");
    }
  }
});
function navigate(page) {
  document
    .querySelectorAll(".page-view")
    .forEach((v) => v.classList.toggle("active", v.id === `view-${page}`));
  document
    .querySelectorAll(".side-nav .nav-link")
    .forEach((a) => a.classList.toggle("active", a.dataset.page === page));
  $("#pageCrumb").textContent = page[0].toUpperCase() + page.slice(1);
  $("#sidebar").classList.remove("open");
}
document.querySelectorAll("[data-page]").forEach((a) =>
  a.addEventListener("click", (e) => {
    e.preventDefault();
    navigate(a.dataset.page);
    history.replaceState(null, "", `#${a.dataset.page}`);
  }),
);
$("#menuToggle").addEventListener("click", () =>
  $("#sidebar").classList.toggle("open"),
);
function filterProducts() {
  const q = $("#productSearch").value.toLowerCase(),
    cat = $("#categoryFilter").value;
  $("#productsTable").innerHTML = products
    .filter(
      (p) =>
        (!cat || p.category === cat) &&
        `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(q),
    )
    .map(productRow)
    .join("");
}
$("#productSearch").addEventListener("input", filterProducts);
$("#categoryFilter").addEventListener("change", filterProducts);
$("#globalSearch").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    navigate("products");
    $("#productSearch").value = e.target.value;
    filterProducts();
  }
});
function materialLine(qty = 1, cost = 5) {
  return `<div class="material-line"><div><label class="form-label">Material</label><select class="form-select"><option>Photo paper</option><option>Magnet sheet</option><option>Ink</option><option>Packaging</option><option>Sticker paper</option></select></div><div><label class="form-label">Qty</label><input class="form-control material-qty" type="number" min="0" step=".01" value="${qty}"></div><div><label class="form-label">Unit cost</label><input class="form-control material-cost" type="number" min="0" step=".01" value="${cost}"></div><button class="remove-row" type="button"><i class="bi bi-x"></i></button></div>`;
}
$("#materialRows").innerHTML =
  materialLine(1, 5) +
  materialLine(1, 8) +
  materialLine(1, 3) +
  materialLine(1, 4);
$("#addMaterialRow").addEventListener("click", () => {
  $("#materialRows").insertAdjacentHTML("beforeend", materialLine());
  calculate();
});
$("#materialRows").addEventListener("input", calculate);
$("#materialRows").addEventListener("click", (e) => {
  if (e.target.closest(".remove-row")) {
    e.target.closest(".material-line").remove();
    calculate();
  }
});
document
  .querySelectorAll(".calc-input,#targetPercent,#pricingMethod")
  .forEach((el) => el.addEventListener("input", calculate));
function calculate() {
  const material = [...document.querySelectorAll(".material-line")].reduce(
      (s, r) =>
        s +
        Number(r.querySelector(".material-qty").value || 0) *
          Number(r.querySelector(".material-cost").value || 0),
      0,
    ),
    expenses = [
      "laborCost",
      "machineCost",
      "packagingCost",
      "otherCost",
    ].reduce((s, id) => s + Number($("#" + id).value || 0), 0),
    total = material + expenses,
    pct = Number($("#targetPercent").value),
    price =
      $("#pricingMethod").value === "markup"
        ? total * (1 + pct / 100)
        : pct >= 100
          ? 0
          : total / (1 - pct / 100);
  $("#materialsTotal").textContent = money(material);
  $("#expensesTotal").textContent = money(expenses);
  $("#totalCost").textContent = money(total);
  $("#targetPercentLabel").textContent = `${pct}%`;
  $("#suggestedPrice").textContent = money(price);
  $("#estimatedProfit").textContent = money(price - total);
}
function exportCsv() {
  const csv = [
      "Name,SKU,Category,Unit Cost,Selling Price,Profit",
      ...products.map((p) =>
        [p.name, p.sku, p.category, p.cost, p.price, p.price - p.cost]
          .map((v) => `"${String(v).replaceAll('"', '""')}"`)
          .join(","),
      ),
    ].join("\n"),
    a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "costify-products.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}
$("#exportCsv").addEventListener("click", exportCsv);
$("#exportCsv2").addEventListener("click", exportCsv);
$("#saveCosting").addEventListener("click", () =>
  notify("Costing draft calculated. Database save is not connected yet."),
);
$("#addMaterialBtn").addEventListener("click", () =>
  notify("Material creation will be added in a future phase."),
);
$("#stockAction").addEventListener("click", () =>
  notify("Stock adjustment workflow is planned for a future phase."),
);
$("#newOrder").addEventListener("click", () =>
  notify("Order workflow is planned for a future phase."),
);
function initChart() {
  const c = $("#overviewChart");
  if (!window.Chart || !c) return;
  new Chart(c, {
    type: "bar",
    data: {
      labels: products.slice(0, 5).map((p) => p.name),
      datasets: [
        {
          label: "Cost",
          data: products.slice(0, 5).map((p) => p.cost),
          backgroundColor: "#bdcec4",
          borderRadius: 5,
        },
        {
          label: "Selling price",
          data: products.slice(0, 5).map((p) => p.price),
          backgroundColor: "#245b4d",
          borderRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: { y: { beginAtZero: true } },
    },
  });
}
renderProducts();
renderMaterials();
calculate();
initChart();
const hash = location.hash.slice(1);
if (hash && $("#view-" + hash)) navigate(hash);
