// Backend-ready API layer. Configure window.COSTIFY_API_BASE_URL when Laravel endpoints are available.
const API_BASE_URL = window.COSTIFY_API_BASE_URL || "/api";
async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  if (response.status === 204) return null;
  return response.json();
}
export const api = {
  getProducts: () => request("/products"),
  createProduct: (payload) =>
    request("/products", { method: "POST", body: JSON.stringify(payload) }),
  updateProduct: (id, payload) =>
    request(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),
  getMaterials: () => request("/materials"),
  createMaterial: (payload) =>
    request("/materials", { method: "POST", body: JSON.stringify(payload) }),
  getInventory: () => request("/inventory"),
};
