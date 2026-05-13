# Mejore Furniture MES — Proof of Concept

## What This Is
A full-stack Manufacturing Execution System (MES) MVP connecting:
- PYTHA (CAD → BOM export via XML/CSV)
- Order Time (Inventory, Work Orders, BOM via REST API at services.ordertime.com/api)
- QuickBooks Online (Finance, Job Costing via Intuit REST API + OAuth2)
- Custom MES App (Tablet React PWA for factory floor)

## Stack
- Backend: Node.js + Express + PostgreSQL
- Frontend: React (Vite PWA) + Tailwind CSS
- Integrations: Order Time REST API, QB Online API (OAuth2), PYTHA XML parser

## How to Run (Dev)
# 1. Install deps
cd backend && npm install
cd ../frontend && npm install

# 2. Setup environment
cp backend/.env.example backend/.env
# Fill in your OT API key, QB credentials, DB URL

# 3. Run DB migrations
cd backend && npm run migrate

# 4. Start backend (port 3001)
cd backend && npm run dev

# 5. Start frontend (port 5173)
cd frontend && npm run dev

## API Proof Points (from official docs)
| System | Base URL | Auth Method | Key Endpoints Used |
|--------|----------|-------------|-------------------|
| Order Time | https://services.ordertime.com/api | Header: apiKey + email + password | /workorder, /bom, /bomcomponent, /partitem, /filllineitem |
| QuickBooks Online | https://quickbooks.api.intuit.com/v3/company/{realmId} | OAuth2 Bearer Token | /invoice, /customer, /query |
| PYTHA | Local file export | File system watcher | XML/CSV BOM parse → OT import |

## Key Architecture Decisions
1. OT is source of truth for inventory & work orders — MES reads/writes via REST API
2. PYTHA has no REST API — Uses its built-in XML export + a file-watcher service that auto-imports into OT
3. QB syncs via OT's native QB integration — We call QB directly only for invoice/payment status reads
4. Offline mode — Frontend caches scans in IndexedDB, syncs when back online
