# Technical Limitations & Operational Boundaries

While the Hostel Mess Operations Agent successfully optimizes routine weekly menu planning and budget tracking, real-world deployment incurs several intrinsic engineering, nutritional, and behavioral boundaries:

---

## 1. APMC Mandi Volatility & Informal Sourcing
- **Spot Price Drift**: Agricultural vegetable commodities (especially tomatoes, onions, and green chilies) experience hyper-volatile intraday pricing at local APMC mandis due to monsoon disruptions or transport strikes.
- **Informal Credit Terms**: Indian university messes frequently maintain informal 30-to-60 day rolling credit lines with local commission agents. The MCP `vendor_price` tool assumes fixed wholesale tier pricing and immediate debit, requiring reconciliation with offline account ledgers.

---

## 2. Biological Nutrient Absorption vs Raw Ingredients
- **Cooking Nutrient Loss**: The USDA FoodData Central mapping estimates raw or standard laboratory-cooked nutrients. In commercial large-batch steam cooking (500-portion degchis), prolonged boiling can degrade heat-labile vitamins (e.g., Vitamin C loss up to 40-60%) and leach micronutrients into discarded water.
- **Bioavailability**: Plant-based non-heme iron (from spinach and legumes) has significantly lower bioabsorption than animal sources without concurrent Vitamin C pairing. While `Nutrition-Agent` tracks gross milligram targets, true biological uptake varies by student diet.

---

## 3. Plate Waste Measurement & Survey Sampling Bias
- **Weighing Granularity**: Current mess plate waste audits rely on aggregated post-meal trash can weight logs rather than computer vision plate-scanning sensors. Consequently, the agent can discern that *"Lunch on Tuesday had 35kg waste"*, but cannot automatically determine whether the waste was driven by uneaten rice, rejected watery dal, or discarded roti crusts without manual kitchen notes.
- **Feedback Polarisation**: Student feedback apps exhibit a known bimodal distribution: students with strong negative reactions (e.g., spicy food, cold tea) submit angry reviews, while satisfied diners rarely log ratings. Long-Term Memory (LTM) incorporates sentiment smoothing to avoid overreacting to single vocal complaints.

---

## 4. Headcount Unpredictability & Weekend Leakage
- **Weekend Absenteeism**: Hostel messes observe substantial Friday-to-Sunday attendance fluctuations (20-45% of students eat outside or travel home). The `cost_estimator` currently scales linearly with fixed 500 headcount. A production enhancement would incorporate biometric turnstile historical curves to predict weekend attendance dynamically.

---

## 5. Dietary Exclusions & Religious Calendars
- **Fasting Cycles**: Hindu fasting days (Navratri, Ekadashi), Jain requirements (no onion/garlic), and Ramadan timings alter mess consumption fundamentally. While the `Variety-Agent` supports vegetarian/non-vegetarian tagging, full religious calendar awareness requires periodic operational ruleset updates by the Mess Committee.
