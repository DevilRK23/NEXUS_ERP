# 🖥️ NEXUS Enterprise ERP — Frontend Web Application Handover Guide

Welcome to the **NEXUS Enterprise ERP Frontend Package**. This package contains the entire interactive client application, interactive ERP Cockpit modules, Temporal Saga simulator, LangGraph AI Copilot studio, and multi-tenant IAM authorization modals.

---

## 🚀 Quick Start (1-Click Run)

### Option 1: Double-Click (Windows)
* Double-click **`start_frontend.bat`**. It will automatically start the local web server on port `8080` and open your default web browser.

### Option 2: PowerShell
```powershell
powershell -ExecutionPolicy Bypass -File .\start_frontend.ps1 -Port 8080
```

### Option 3: Node / npm
```bash
npx -y serve . -l 8080
```

* **Frontend URL**: `http://localhost:8080/`
* **Default Backend Target**: `http://localhost:3000/`

---

## ⚙️ How to Connect with the Backend Engineer's API

All API calls throughout the frontend are centralized via **`js/config.js`**:

```javascript
// File: js/config.js
window.API_BASE = window.API_BASE || 'http://localhost:3000';
```

If the backend is hosted on a remote server, Docker container, or cloud staging environment (e.g. `http://api.nexus-erp.internal:3000` or `http://192.168.1.50:3000`), simply update the URL in `js/config.js`. All 10 UI modules will automatically communicate with the new endpoint!

---

## 📁 Frontend Directory Architecture

```
frontend/
├── index.html                  # Main Enterprise Application Entrypoint
├── start_frontend.bat          # 1-Click Windows Batch Launcher
├── start_frontend.ps1          # Standalone High-Speed Static HTTP Server
├── package.json                # Project & Script Manifest
├── README.md                   # This handover documentation
├── css/
│   ├── design-system.css       # HSL Design Tokens, Cybernetic Glow, Colors & Typography
│   ├── layout.css              # Grid system, header, navigation, and section layouts
│   ├── components.css          # Buttons, Badges, Modals, Tables, Forms, and Toasts
│   ├── modules-showcase.css    # Interactive ERP Cockpit component styling
│   ├── architecture-viz.css    # DDD Microservices architecture diagram & Saga visualizer
│   └── responsive.css          # Fluid mobile/tablet breakpoints
├── js/
│   ├── config.js               # Central API Gateway configuration & endpoint registry
│   ├── app.js                  # Global application lifecycle, metrics counter & theme toggle
│   ├── auth-modal.js           # Multi-tenant Signup modal & IAM SSO authentication flow
│   ├── erp-modules-demo.js     # FM-03 General Ledger, SCM-04 Inventory & AP-02 Purchasing demos
│   ├── saga-simulator.js       # Temporal.io 4-step Order-to-Cash saga execution & rollback simulator
│   ├── ai-copilot-demo.js      # LangGraph AI Copilot with custom Q&A and 5-stage Data Lineage graph
│   ├── command-palette.js      # Ctrl+K global enterprise quick-action search
│   ├── roi-calculator.js       # Enterprise ROI & ERP migration savings calculator
│   ├── lead-capture.js         # Architecture consultation & demo request form
│   └── alive-animations.js    # Cybernetic background particle mesh canvas
└── assets/                     # SVG icons, system architecture diagrams & visual assets
```

---

## 🎮 Key Interactive Modules & How to Demo

1. **Multi-Tenant Provisioning Modal (`js/auth-modal.js`)**:
   - Click **"Start Free Trial"** in top navbar.
   - Enter Company Name, Email, Entity Count, and Deployment Tier.
   - Sends `POST /api/v1/auth/signup` to provision a dedicated tenant workspace.

2. **IAM SSO Sign-In (`js/auth-modal.js`)**:
   - Click **"Sign In"** in top navbar.
   - Sends `POST /api/v1/auth/signin` and sets the PostgreSQL tenant session context (`SET app.tenant_id = '...'`).

3. **General Ledger Module FM-03 (`js/erp-modules-demo.js`)**:
   - Click **"Post to Immutable Ledger"**.
   - Sends `POST /api/v1/accounting/journals/post` to validate double-entry balance and prepend gapless entry `JE-2026-000143`.

4. **Supply Chain Inventory Module SCM-04 (`js/erp-modules-demo.js`)**:
   - Adjust on-hand / reserved sliders.
   - Sends `POST /api/v1/inventory/availability/check` and renders sub-300ms Available-to-Promise & FIFO layers.

5. **Purchasing & 3-Way Match Module AP-02 (`js/erp-modules-demo.js`)**:
   - Adjust price variance tolerance slider.
   - Sends `POST /api/v1/purchasing/match-evaluate` comparing PO vs GRN vs Vendor Invoice.

6. **Distributed Saga Simulator (`js/saga-simulator.js`)**:
   - Run Happy Path 4-step commit or toggle "Simulate Accounting Ledger Fault" to execute reverse compensations via `POST /api/v1/workflows/o2c/execute`.

7. **AI Copilot Studio (`js/ai-copilot-demo.js`)**:
   - Type ANY custom question in the input box and press Enter.
   - Sends `POST /api/v1/ai/query` to stream real-time data lake analysis and 5-stage explainable lineage graphs.
