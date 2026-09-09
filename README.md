# Hostel Mess Operations Agent (`agentic-hostel-mess`)

> **Project 3**: A standing operations agent that plans the hostel's weekly menu, watches wholesale mandi budgets, and learns from what students actually eat — running every week of the semester.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8)](https://tailwindcss.com/)
[![MCP](https://img.shields.io/badge/Model%20Context%20Protocol-FastMCP-purple)](https://modelcontextprotocol.io/)
[![ICMR RDA](https://img.shields.io/badge/Nutritional%20Standard-ICMR%20Adult%20RDA-emerald)](https://www.icmr.nic.in/)

---

## 📌 Problem Scenario
University hostel messes with 500+ residents suffer from high plate waste (20–35%), budget overruns from seasonal vegetable price spikes, repetitive menus leading to student dissatisfaction, and nutritional imbalances.

Rather than a one-shot menu generator, this is a **standing operations agent** that runs cyclically every week of the semester:
1. Ingests current pantry inventory to enforce a strict **Leftover-First rule** for Monday/Tuesday meals.
2. Dispatches a parallel evaluation swarm (**Nutrition-Agent**, **Budget-Agent**, **Variety-Agent**).
3. Arbitrates multi-agent deadlocks via the **Menu-Coordinator**.
4. Interacts with wholesale suppliers and inventory via a **Model Context Protocol (MCP)** server.
5. Halts any order exceeding the monthly/weekly budget ceiling at a **Human-in-the-Loop Mess Committee Approval Gate** with an immutable SHA-256 hash-chained audit ledger.

---

## 🏗️ Architecture & Orchestration

```
                      +-----------------------------+
                      |   Datasets & Memory Store   |
                      | USDA Nutrient DB / APMC Mandi|
                      |   Kaggle Indian Food 101    |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |    MCP Server (JSON-RPC)    |
                      | mess://vendor-prices        |
                      | mess://inventory            |
                      | mock_ordering_api           |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |   Menu-Coordinator Agent    |
                      | Enforces Leftover-First Rule|
                      +--------------+--------------+
                                     |
           +-------------------------+-------------------------+
           |                         |                         |
           v                         v                         v
+--------------------+    +--------------------+    +--------------------+
|  Nutrition-Agent   |    |    Budget-Agent    |    |   Variety-Agent    |
| ICMR 68g protein   |    | Max ₹165/day/cap   |    | Max 3 Potato rule  |
| 2,200-2,500 kcal   |    | Bulk mandi pricing |    | Plate waste penalty|
+--------------------+    +--------------------+    +--------------------+
           |                         |                         |
           +-------------------------+-------------------------+
                                     |
                                     v
                      +-----------------------------+
                      |  Consensus Arbitration      |
                      | Resolves Agent Clashes      |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      | Budget Ceiling Check        |
                      | Requisition > ₹5,77,500?    |
                      +-------+-------------+-------+
                              |             |
                         No   |             | Yes (Breach)
                              v             v
                +---------------+      +-------------------------+
                | Auto-Approved |      | Committee Approval Gate |
                | Issue Mock PO |      | 2/3 Quorum Sign-off     |
                +-------+-------+      +------------+------------+
                        |                           |
                        +-------------+-------------+
                                      |
                                      v
                      +-----------------------------+
                      | SHA-256 Hash-Chained Audit  |
                      |     Long-Term Memory Log    |
                      +-----------------------------+
```

---

## 🛠️ Datasets & Tools

### Datasets
- **USDA FoodData Central**: Calibrated nutritional mapping per standard mess portion serving (calories, protein, carbs, fat, fiber, iron, calcium).
- **Kaggle Indian Food 101**: Curated authentic Indian culinary dataset covering regional staples, preparation/cooking times, diets, and flavor profiles.
- **Synthetic APMC Mandi Vendor Catalog**: Real-world wholesale commodity price catalog with volume discount tiers, shelf lives, and supplier contracts.
- **Pantry Inventory Table**: Real-time raw material stock with batch lot IDs and expiration countdowns.

### Operational Tools
1. `nutrient_lookup(dish)`: Queries USDA and Indian culinary database for portion macros.
2. `cost_estimator(ingredients, students)`: Computes batch ingredient costs and per-student plate cost based on wholesale quotes.
3. `leftover_checker(inventory)`: Scans pantry stock to identify items with $\le 3\text{ days}$ remaining shelf life.
4. `vendor_price(item, quantity)`: Resolves spot prices and bulk volume discounts.

---

## 🖥️ Multi-Page Monochromatic Frontend

Built with **Next.js 14**, **Tailwind CSS**, and **TypeScript** adhering to shadcn UI project structure:

- **`/` (Hero Landing)**: Spacious, full-height monochromatic hero featuring the self-writing SVG font animation component (`HandwritingText`), KPI overview, and quick-launch module buttons.
- **`/menu`**: 7-Day Menu Matrix across 4 meal slots (Breakfast, Lunch, Snacks, Dinner) with nutrient badges and Leftover-First priority tags.
- **`/swarm`**: Parallel swarm critique logs and Menu-Coordinator conflict arbitration records.
- **`/governance`**: Human-in-the-Loop Mess Committee Approval Gate simulating a Diwali banquet budget breach (+₹56,909.16 over ceiling) with electronic voting and live SHA-256 audit ledger.
- **`/pantry`**: Real-time pantry stock tracking lot numbers and shelf-life countdowns.
- **`/mcp`**: Interactive test console to execute live MCP queries.
- **`/docs`**: Central browser for all 8 technical project deliverables.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js v18+ and npm
- Python 3.9+

### 2. Python Backend & Swarm Test
```bash
# Test backend tools, swarm, and governance
python3 src/tools.py
PYTHONPATH=. python3 src/swarm.py
PYTHONPATH=. python3 run_agent.py
```

### 3. Model Context Protocol (MCP) Server
```bash
# Start standalone MCP server
python3 mcp/server.py
```

### 4. Next.js Frontend
```bash
cd frontend
npm install
npm run build
npm run start
```
Visit **`http://localhost:3000`** in your browser.

---

## 📁 Repository Structure

```
agentic-hostel-mess/
├── data/                       # Datasets (USDA, Indian Food 101, Vendor Prices, Inventory)
│   ├── indian_food_101.json
│   ├── mess_inventory.json
│   ├── usda_nutrients.json
│   └── vendor_prices.json
├── docs/                       # Technical Specifications & Deliverables
│   ├── budget_breach_case.md   # Diwali Banquet Breach Case Study
│   ├── execution_trace.md      # Chronological Step-by-Step Trace
│   ├── execution_trace.json
│   ├── limitations_note.md     # Technical & Operational Limitations
│   ├── memory_schema.md        # Dual-Tier Memory System Spec
│   ├── memory_schema.json
│   ├── node_graph.md           # Architecture Flowchart & Diagrams
│   ├── prompt_log.md           # System Prompts for Swarm Agents
│   └── tool_list.md            # Tool & MCP Signatures
├── frontend/                   # Next.js 14 Application
│   ├── app/
│   │   ├── page.tsx            # Enlarged Hero Landing with HandwritingText
│   │   ├── menu/page.tsx       # 7-Day Menu Matrix
│   │   ├── swarm/page.tsx      # Swarm Debate & Arbitration
│   │   ├── governance/page.tsx # Committee Approval Gate
│   │   ├── pantry/page.tsx     # Leftover-First Pantry
│   │   ├── mcp/page.tsx        # MCP Tools Console
│   │   └── docs/page.tsx       # Deliverables Explorer
│   ├── components/
│   │   ├── Navbar.tsx          # Monochromatic Header
│   │   └── ui/
│   │       ├── handwriting-text.tsx
│   │       └── scroll-expansion-hero.tsx
│   ├── lib/
│   │   └── mess-data.ts        # Datasets & Types
│   ├── tailwind.config.js
│   └── tsconfig.json
├── mcp/
│   └── server.py               # Model Context Protocol (MCP) Server
├── skills/
│   └── weekly_menu_planning.md # Packaged Skill Specification
├── src/
│   ├── governance.py           # Safety Gate & Cryptographic Audit Ledger
│   ├── memory.py               # Session State vs Long-Term Memory
│   ├── swarm.py                # Nutrition, Budget, Variety & Coordinator
│   └── tools.py                # Operational Tools Engine
├── generate_datasets.py        # Dataset Generator
├── run_agent.py                # Semester Cycle Execution Script
└── README.md
```

---

## 📄 License
MIT License. Built for university student mess operations and autonomous agent research.
