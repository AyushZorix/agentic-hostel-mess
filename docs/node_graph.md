# Hostel Mess Operations Agent - Node Graph & Orchestration Flow

```mermaid
graph TD
    classDef memory fill:#f9f0ff,stroke:#7928ca,stroke-width:2px;
    classDef dataset fill:#e6fffa,stroke:#00a389,stroke-width:2px;
    classDef agent fill:#eff6ff,stroke:#2563eb,stroke-width:2px;
    classDef tool fill:#fff7ed,stroke:#ea580c,stroke-width:2px;
    classDef gov fill:#fef2f2,stroke:#dc2626,stroke-width:2px;

    subgraph DATASETS["External Data Sources & Mandi Catalogs"]
        D1[("USDA FoodData Central API\nPortion Macro/Micro DB")]:::dataset
        D2[("Kaggle Indian Food 101\n255+ Dishes, Diet & Flavors")]:::dataset
        D3[("Synthetic Vendor Price Catalog\nAPMC Wholesale Tiers")]:::dataset
    end

    subgraph MEMORY["Dual-Tier Memory System"]
        STM["Tier 1: Ephemeral Session State\nActive Week 6 Draft, Conflicts, Rejection Diffs"]:::memory
        LTM[("Tier 2: Durable Long-Term Memory\nWaste Audits, Complaints, Multi-Week Ratings")]:::memory
    end

    subgraph MCP["Model Context Protocol (MCP) Server"]
        MCP_V["Resource: mess://vendor-prices"]:::tool
        MCP_I["Resource: mess://inventory"]:::tool
        MCP_O["Tool: mock_ordering_api"]:::tool
    end

    subgraph OPERATIONAL_TOOLS["Operational Tools Engine"]
        T1["nutrient_lookup(dish)"]:::tool
        T2["cost_estimator(ingredients, students)"]:::tool
        T3["leftover_checker(inventory)"]:::tool
        T4["vendor_price(item, quantity)"]:::tool
    end

    subgraph SWARM["Parallel Evaluation Swarm"]
        NA["Nutrition-Agent\nChecks ICMR Calorie/Protein/Micro bounds"]:::agent
        BA["Budget-Agent\nChecks per-student plate cost & bulk pricing"]:::agent
        VA["Variety-Agent\nChecks regional diversity, potato/paneer caps, waste"]:::agent
    end

    subgraph COORDINATION["Standing Operations Coordinator"]
        MC{"Menu-Coordinator Agent\nArbitrator & Consensus Synthesizer"}:::agent
    end

    subgraph GOVERNANCE["Governance & Governance Gate"]
        Check{"Total Weekly Cost >\n₹5,77,500.00?"}:::gov
        AutoApprove["Auto-Approval\nGenerate Mock PO"]:::gov
        HITL["Mess Committee Approval Gate\nQuorum: Warden + Student Sec + Manager"]:::gov
        AuditLog[("SHA-256 Hash-Chained Audit Log\nImmutable Decision History")]:::gov
    end

    %% Data connections
    D1 --> T1
    D2 --> MC
    D3 --> MCP_V
    MCP_V --> T4
    MCP_I --> T3

    %% Flow connections
    LTM -->|"Historical complaints & waste penalties"| MC
    LTM -->|"Waste penalty weights"| VA
    
    MC -->|"Step 1: Inspect expiring stock"| T3
    T3 -->|"Expiring perishables (Tomatoes, Palak)"| MC
    
    MC -->|"Step 2: Seed Mon/Tue Leftover Draft"| STM
    STM -->|"Dispatches candidate draft"| NA & BA & VA

    NA -->|"Evaluates macros"| T1
    BA -->|"Evaluates plate costs & quotes"| T2 & T4
    VA -->|"Checks repetition & texture"| T1

    NA -->|"Flags protein deficits"| MC
    BA -->|"Flags daily budget overruns"| MC
    VA -->|"Flags potato caps & unpalatable dishes"| MC

    MC -->|"Step 3: Arbitrates conflicts & substitutes dishes"| STM
    STM -->|"Final consensual plan"| Check

    Check -- "No (<= ₹5,77,500)" --> AutoApprove
    Check -- "Yes (> ₹5,77,500)" --> HITL

    HITL -->|"2/3 Signatures recorded"| AutoApprove
    AutoApprove --> MCP_O
    AutoApprove --> AuditLog
    HITL --> AuditLog
    AuditLog -->|"Weekly stats update"| LTM
```

---

## Node Graph Component Interactions

1. **Inventory Pre-computation**: At week start, `leftover_checker` scans the pantry inventory. Perishables with shelf life <= 3 days trigger the Leftover-First heuristic.
2. **Parallel Swarm Evaluation**: The Coordinator broadcasts the candidate draft to `Nutrition-Agent`, `Budget-Agent`, and `Variety-Agent` concurrently.
3. **Multi-Agent Conflict Arbitration**:
   - `Budget-Agent` attempts to minimize costs by maximizing cheap ingredients (potatoes).
   - `Variety-Agent` rejects this via the Max 3 Potato Rule and historical plate-waste penalties.
   - `Nutrition-Agent` demands elevated protein levels.
   - `Menu-Coordinator` reconciles these opposing vectors by selecting protein-dense pulses (Rajma/Moong) that utilize pantry bulk stock.
4. **Governance Ceiling Gate**: If total procurement cost breaches the weekly threshold of **₹5,77,500.00**, automated processing stops. The system enters the Human-in-the-Loop approval gate requiring 2-out-of-3 quorum sign-off from the Mess Warden, Student General Secretary, and Mess Manager.
5. **Cryptographic Audit Log**: Every modification, debate resolution, and approval decision is logged into an immutable SHA-256 hash-chained ledger.
