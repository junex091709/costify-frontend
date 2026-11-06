# Costify Frontend

Responsive frontend starter for a personal Product Costing & Pricing Manager, using PHP currency (PHP ₱), Bootstrap 5, vanilla JavaScript and Chart.js.

## Features
- Dashboard overview and cost-versus-price chart
- Product CRUD demo (add, edit, duplicate, delete)
- Product search and category filtering
- Live product cost calculator with markup and margin pricing
- Materials and inventory overview screens
- Pricing, orders, reports and settings placeholders
- CSV export
- Centralized API service placeholder for future Laravel/PHP integration

## Run locally
Use VS Code Live Server, or run `python -m http.server 5500` in this folder and open http://localhost:5500.

## Project structure
- `index.html` — application shell and views
- `css/styles.css` — responsive styles
- `js/app.js` — UI behavior and calculator
- `js/data.js` — demo data
- `js/api.js` — future API integration layer

## Backend plan
Set `window.COSTIFY_API_BASE_URL` and connect the API methods in `js/api.js` to Laravel endpoints such as `/api/products`, `/api/materials`, `/api/inventory`, and `/api/orders`.

> Prototype note: demo records currently live in browser memory and are not saved to a database. Materials, stock adjustment and order workflows are UI placeholders.
