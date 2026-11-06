import { initialProducts, initialMaterials } from "./data.js";
const PRODUCTS_STORAGE_KEY = "costify_products_v1";
const MATERIALS_STORAGE_KEY = "costify_materials_v1";
const MOVEMENTS_STORAGE_KEY = "costify_stock_movements_v1";
const COSTINGS_STORAGE_KEY = "costify_costing_drafts_v1";
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
function loadMaterials() {
  try {
    const saved = localStorage.getItem(MATERIALS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.warn("Could not load saved materials:", error);
  }
  return [...initialMaterials];
}
function loadCostingDrafts() {
  try { const saved = localStorage.getItem(COSTINGS_STORAGE_KEY); if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) return parsed; } }
  catch (error) { console.warn("Could not load costing drafts:", error); }
  return [];
}
function draftSuggestedPrice(draft) {
  const cost = Number(draft.totalCost) || 0, pct = Number(draft.targetPercent) || 0;
  return draft.pricingMethod === "margin" ? (pct >= 100 ? 0 : cost / (1 - pct / 100)) : cost * (1 + pct / 100);
}
function loadMovements() {
  try {
    const saved = localStorage.getItem(MOVEMENTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.warn("Could not load stock movements:", error);
  }
  return [];
}
let products = loadProducts(),
  materials = loadMaterials(),
  stockMovements = loadMovements(),
  costingDrafts = loadCostingDrafts();
function saveProducts() {
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    return true;
  } catch (error) {
    console.error("Could not save products:", error);
    notify("Unable to save products in this browser");
    return false;
  }
}
function saveMaterials(nextMaterials = materials) {
  try {
    const serialized = JSON.stringify(nextMaterials);
    localStorage.setItem(MATERIALS_STORAGE_KEY, serialized);
    if (localStorage.getItem(MATERIALS_STORAGE_KEY) !== serialized) {
      throw new Error("Material storage verification failed");
    }
    return true;
  } catch (error) {
    console.error("Could not save materials:", error);
    return false;
  }
}
function saveInventoryState(nextMaterials, nextMovements) {
  const previousMaterials = localStorage.getItem(MATERIALS_STORAGE_KEY);
  const previousMovements = localStorage.getItem(MOVEMENTS_STORAGE_KEY);
  try {
    const materialJSON = JSON.stringify(nextMaterials);
    const movementJSON = JSON.stringify(nextMovements);
    localStorage.setItem(MATERIALS_STORAGE_KEY, materialJSON);
    localStorage.setItem(MOVEMENTS_STORAGE_KEY, movementJSON);
    if (
      localStorage.getItem(MATERIALS_STORAGE_KEY) !== materialJSON ||
      localStorage.getItem(MOVEMENTS_STORAGE_KEY) !== movementJSON
    ) throw new Error("Inventory save verification failed");
    materials = nextMaterials;
    stockMovements = nextMovements;
    return true;
  } catch (error) {
    console.error("Could not save inventory transaction:", error);
    try {
      if (previousMaterials === null) localStorage.removeItem(MATERIALS_STORAGE_KEY);
      else localStorage.setItem(MATERIALS_STORAGE_KEY, previousMaterials);
      if (previousMovements === null) localStorage.removeItem(MOVEMENTS_STORAGE_KEY);
      else localStorage.setItem(MOVEMENTS_STORAGE_KEY, previousMovements);
    } catch (rollbackError) {
      console.error("Inventory rollback failed:", rollbackError);
    }
    return false;
  }
}
const $ = (s) => document.querySelector(s);
const money = (n) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    Number(n) || 0,
  );
const modal = new bootstrap.Modal($("#productModal")),
  materialModal = new bootstrap.Modal($("#materialModal")),
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
        `<tr><td><strong>${safe(m.name)}</strong></td><td>${safe(m.sku)}</td><td>${safe(m.unit)}</td><td>${money(m.cost)}</td><td>${m.stock}</td><td><span class="pill">${m.stock <= m.reorder ? "Low stock" : "In stock"}</span></td><td><button class="btn btn-sm btn-light" data-material-edit="${safe(m.id)}" aria-label="Edit ${safe(m.name)}"><i class="bi bi-pencil"></i></button> <button class="btn btn-sm btn-light text-danger" data-material-delete="${safe(m.id)}" aria-label="Delete ${safe(m.name)}"><i class="bi bi-trash"></i></button></td></tr>`,
    )
    .join("");
  $("#inventoryTable").innerHTML = materials
    .map(
      (m) =>
        `<tr><td><strong>${safe(m.name)}</strong></td><td>Raw material</td><td>${m.stock} ${safe(m.unit)}</td><td>${m.reorder} ${safe(m.unit)}</td><td><span class="pill">${m.stock <= m.reorder ? "Low stock" : "Healthy"}</span></td></tr>`,
    )
    .join("");
  const lowStock = materials.filter((m) => Number(m.stock) <= Number(m.reorder));
  $("#inventoryLowCount").textContent = lowStock.length;
  $("#inventoryMaterialCount").textContent = materials.length;
  $("#inventoryMovementCount").textContent = stockMovements.length;
  $("#inventoryTotalUnits").textContent = materials.reduce((sum, m) => sum + Number(m.stock || 0), 0).toLocaleString("en-PH");
  $("#stockMovementTable").innerHTML = stockMovements.slice(0, 30).map((move) => {
    const material = materials.find((m) => m.id === move.materialId);
    const signed = move.type === "Stock out" ? -Number(move.quantity) : move.type === "Adjustment" ? Number(move.after) - Number(move.before) : Number(move.quantity);
    const date = new Date(move.createdAt);
    return `<tr><td>${date.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</td><td>${safe(move.materialName)}</td><td>${safe(move.type)}</td><td class="${signed < 0 ? "text-danger" : "positive"}">${signed > 0 ? "+" : ""}${signed} ${safe(move.unit)}</td><td>${move.before} → ${move.after}</td><td>${safe(move.note || "—")}</td></tr>`;
  }).join("");
  $("#stockMovementEmpty").classList.toggle("d-none", stockMovements.length > 0);
  if (typeof refreshCostingMaterialOptions === "function") refreshCostingMaterialOptions();
}
function openMaterial(material = null) {
  $("#materialForm").reset();
  $("#editMaterialId").value = material?.id || "";
  $("#materialModalTitle").textContent = material ? "Edit material" : "Add material";
  $("#materialName").value = material?.name || "";
  $("#materialUnit").value = material?.unit || "piece";
  $("#materialCost").value = material?.cost ?? 0;
  $("#materialStock").value = material?.stock ?? 0;
  $("#materialReorder").value = material?.reorder ?? 0;
  materialModal.show();
}
$("#materialForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = $("#editMaterialId").value;
  const existing = materials.find((item) => item.id === id);
  const material = {
    id: id || `mat_${Date.now()}`,
    name: $("#materialName").value.trim(),
    sku: existing?.sku || `MAT-${String(Date.now()).slice(-6)}`,
    unit: $("#materialUnit").value,
    cost: Number($("#materialCost").value),
    stock: Number($("#materialStock").value),
    reorder: Number($("#materialReorder").value),
  };
  const updatedMaterials = id
    ? materials.map((item) => (item.id === id ? material : item))
    : [material, ...materials];
  if (!saveMaterials(updatedMaterials)) {
    notify("Material was not saved. Check your browser storage and try again.");
    return;
  }
  materials = updatedMaterials;
  renderMaterials();
  materialModal.hide();
  notify(id ? "Material updated" : "Material added");
});
document.addEventListener("click", (e) => {
  const editButton = e.target.closest("[data-material-edit]");
  const deleteButton = e.target.closest("[data-material-delete]");
  if (editButton) {
    const material = materials.find((item) => item.id === editButton.dataset.materialEdit);
    if (material) openMaterial(material);
  }
  if (deleteButton) {
    const material = materials.find((item) => item.id === deleteButton.dataset.materialDelete);
    if (material && confirm(`Delete ${material.name}?`)) {
      const updatedMaterials = materials.filter((item) => item.id !== material.id);
      if (!saveMaterials(updatedMaterials)) {
        notify("Material could not be deleted because browser storage failed.");
        return;
      }
      materials = updatedMaterials;
      renderMaterials();
      notify("Material deleted");
    }
  }
});
function populateCostingDraftSelect(selectedId = "") {
  const select = $("#productCostingDraft");
  select.innerHTML = '<option value="">Manual cost entry (no draft)</option>' + costingDrafts.map((draft) => {
    const date = new Date(draft.createdAt).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
    return `<option value="${safe(draft.id)}" ${draft.id === selectedId ? "selected" : ""}>${date} — Cost ${money(draft.totalCost)} — Price ${money(draftSuggestedPrice(draft))}</option>`;
  }).join("");
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
$("#productCostingDraft").addEventListener("change", () => {
  const draft = costingDrafts.find((item) => item.id === $("#productCostingDraft").value);
  if (draft) { $("#productCost").value = Number(draft.totalCost || 0).toFixed(2); $("#productPrice").value = draftSuggestedPrice(draft).toFixed(2); }
});
$("#productForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = $("#editProductId").value;
  const previous = products.find((x) => x.id === id);
  const selectedDraft = costingDrafts.find((item) => item.id === $("#productCostingDraft").value);
  const p = {
    id: id || `prd_${Date.now()}`,
    name: $("#productName").value.trim(),
    sku: previous?.sku || `NEW-${products.length + 1}`,
    category: $("#productCategory").value,
    cost: Number($("#productCost").value),
    price: Number($("#productPrice").value),
    status: $("#productStatus").value,
    description: $("#productDescription").value,
    costingDraftId: selectedDraft?.id || "",
    costingDetails: selectedDraft ? { materials: selectedDraft.materials || [], expenses: selectedDraft.expenses || {}, pricingMethod: selectedDraft.pricingMethod, targetPercent: selectedDraft.targetPercent, linkedAt: new Date().toISOString() } : previous?.costingDetails || null
  };
  const nextProducts = id ? products.map((x) => (x.id === id ? p : x)) : [p, ...products];
  const previousProducts = products; products = nextProducts;
  if (!saveProducts()) { products = previousProducts; notify("Product was not saved. Check browser storage and try again."); return; }
  renderProducts(); modal.hide(); notify(id ? "Product updated" : "Product added");
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
function materialLine(qty = 1, selectedId = "") {
  const options = materials.length
    ? materials.map((m) => `<option value="${safe(m.id)}" ${m.id === selectedId ? "selected" : ""}>${safe(m.name)} — ${safe(m.unit)} (${money(m.cost)})</option>`).join("")
    : '<option value="">No materials available — add one in Materials</option>';
  const selected = materials.find((m) => m.id === selectedId) || materials[0];
  const unitCost = selected ? Number(selected.cost) || 0 : 0;
  return `<div class="material-line"><div><label class="form-label">Material</label><select class="form-select material-select" required>${options}</select></div><div><label class="form-label">Qty (${safe(selected?.unit || "unit")})</label><input class="form-control material-qty" type="number" min="0" step=".01" value="${qty}"></div><div><label class="form-label">Unit cost (₱)</label><input class="form-control material-cost" type="number" min="0" step=".01" value="${unitCost}"></div><button class="remove-row" type="button" aria-label="Remove material"><i class="bi bi-x"></i></button></div>`;
}
function refreshCostingMaterialOptions() {
  document.querySelectorAll(".material-line").forEach((row) => {
    const select = row.querySelector(".material-select");
    const previousId = select.value;
    const previousMaterial = materials.find((m) => m.id === previousId);
    const previousCost = row.querySelector(".material-cost").value;
    const options = materials.map((m) => `<option value="${safe(m.id)}" ${m.id === previousId ? "selected" : ""}>${safe(m.name)} — ${safe(m.unit)} (${money(m.cost)})</option>`).join("");
    select.innerHTML = options || '<option value="">No materials available — add one in Materials</option>';
    const selected = materials.find((m) => m.id === select.value);
    if (!previousMaterial && selected) row.querySelector(".material-cost").value = Number(selected.cost) || 0;
    row.querySelector("label:nth-of-type(2)").textContent = `Qty (${selected?.unit || "unit"})`;
    if (!selected) row.querySelector(".material-cost").value = 0;
  });
}
$("#materialRows").innerHTML = materialLine(1);
$("#addMaterialRow").addEventListener("click", () => {
  $("#materialRows").insertAdjacentHTML("beforeend", materialLine(1));
  calculate();
});
$("#materialRows").addEventListener("change", (e) => {
  if (e.target.matches(".material-select")) {
    const row = e.target.closest(".material-line");
    const selected = materials.find((m) => m.id === e.target.value);
    row.querySelector(".material-cost").value = selected ? Number(selected.cost) || 0 : 0;
    row.querySelector("label:nth-of-type(2)").textContent = `Qty (${selected?.unit || "unit"})`;
    calculate();
  }
});
$("#materialRows").addEventListener("input", calculate);
$("#materialRows").addEventListener("click", (e) => {
  if (e.target.closest(".remove-row")) {
    e.target.closest(".material-line").remove();
    calculate();
  }
});
document.querySelectorAll(".calc-input,#targetPercent,#pricingMethod").forEach((el) => el.addEventListener("input", calculate));
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
$("#saveCosting").addEventListener("click", () => {
  const draft = {
    id: `cost_${Date.now()}`,
    createdAt: new Date().toISOString(),
    materials: [...document.querySelectorAll(".material-line")].map((row) => {
      const material = materials.find((m) => m.id === row.querySelector(".material-select").value);
      return {
        materialId: material?.id || "",
        materialName: material?.name || "Unselected material",
        unit: material?.unit || "unit",
        quantity: Number(row.querySelector(".material-qty").value) || 0,
        unitCost: Number(row.querySelector(".material-cost").value) || 0
      };
    }),
    expenses: {
      labor: Number($("#laborCost").value) || 0,
      machine: Number($("#machineCost").value) || 0,
      packaging: Number($("#packagingCost").value) || 0,
      other: Number($("#otherCost").value) || 0
    },
    pricingMethod: $("#pricingMethod").value,
    targetPercent: Number($("#targetPercent").value) || 0,
    totalCost: [...document.querySelectorAll(".material-line")].reduce((sum, row) =>
      sum + (Number(row.querySelector(".material-qty").value) || 0) * (Number(row.querySelector(".material-cost").value) || 0), 0)
      + ["laborCost", "machineCost", "packagingCost", "otherCost"].reduce((sum, id) => sum + (Number($("#" + id).value) || 0), 0),
    suggestedPrice: 0
  };
  draft.suggestedPrice = draftSuggestedPrice(draft);
  try {
    const saved = JSON.parse(localStorage.getItem(COSTINGS_STORAGE_KEY) || "[]");
    saved.unshift(draft);
    localStorage.setItem(COSTINGS_STORAGE_KEY, JSON.stringify(saved));
    if (localStorage.getItem(COSTINGS_STORAGE_KEY) !== JSON.stringify(saved)) throw new Error("Save verification failed");
    costingDrafts = saved;
    notify("Costing draft saved in this browser. Inventory was not deducted.");
  } catch (error) {
    console.error("Could not save costing draft:", error);
    notify("Could not save costing draft. Check browser storage and try again.");
  }
});
$("#addMaterialBtn").addEventListener("click", () => openMaterial());
function openStockMovement() {
  $("#stockMovementForm").reset();
  $("#stockMovementMaterial").innerHTML = materials.map((m) => `<option value="${safe(m.id)}">${safe(m.name)} (Current: ${m.stock} ${safe(m.unit)})</option>`).join("");
  $("#stockMovementType").value = "Stock in";
  $("#stockMovementQuantity").value = 1;
  $("#stockMovementNote").value = "";
  $("#stockMovementModalTitle").textContent = "Record stock movement";
  stockMovementModal.show();
}
const stockMovementModal = new bootstrap.Modal($("#stockMovementModal"));
$("#stockAction").addEventListener("click", () => {
  if (!materials.length) {
    notify("Add a material first before recording stock.");
    return;
  }
  openStockMovement();
});
$("#stockMovementForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const materialId = $("#stockMovementMaterial").value;
  const type = $("#stockMovementType").value;
  const quantity = Number($("#stockMovementQuantity").value);
  const note = $("#stockMovementNote").value.trim();
  const material = materials.find((m) => m.id === materialId);
  if (!material || !Number.isFinite(quantity) || quantity <= 0) {
    notify("Choose a material and enter a quantity greater than zero.");
    return;
  }
  const before = Number(material.stock) || 0;
  const after = type === "Stock in"
    ? before + quantity
    : type === "Stock out"
      ? before - quantity
      : quantity;
  if (after < 0) {
    notify("Insufficient stock. Stock out cannot make inventory negative.");
    return;
  }
  const updatedMaterials = materials.map((m) => m.id === materialId ? { ...m, stock: after } : m);
  const movement = {
    id: `mov_${Date.now()}`,
    materialId,
    materialName: material.name,
    unit: material.unit,
    type,
    quantity,
    before,
    after,
    note,
    createdAt: new Date().toISOString(),
  };
  const updatedMovements = [movement, ...stockMovements];
  if (!saveInventoryState(updatedMaterials, updatedMovements)) {
    notify("Stock movement was not saved. Check browser storage and try again.");
    return;
  }
  renderMaterials();
  stockMovementModal.hide();
  notify(`${type} recorded successfully`);
});
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
