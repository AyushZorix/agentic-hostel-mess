export interface DishInfo {
  name: string;
  diet: "vegetarian" | "non-vegetarian";
  course: "breakfast" | "main course" | "snack" | "dessert";
  flavor_profile: string;
  region: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  cost_per_plate_inr: number;
  leftover_utilized?: string[];
}

export interface DayPlan {
  breakfast: DishInfo;
  lunch: DishInfo;
  snack: DishInfo;
  dinner: DishInfo;
  daily_calories: number;
  daily_protein_g: number;
  daily_cost_inr: number;
  cost_per_student_day_inr: number;
  protein_compliant: boolean;
  budget_compliant: boolean;
}

export interface WeeklySchedule {
  week_number: number;
  title: string;
  is_breach: boolean;
  total_weekly_cost_inr: number;
  weekly_budget_cap_inr: number;
  breach_amount_inr: number;
  cost_per_student_day_inr: number;
  average_daily_protein_g: number;
  average_daily_calories: number;
  leftovers_cleared_kg: number;
  status: "AUTO_APPROVED" | "PENDING_COMMITTEE_APPROVAL" | "COMMITTEE_APPROVED";
  approval_id?: string;
  schedule: Record<string, DayPlan>;
}

export const ICMR_TARGETS = {
  calories_min: 2200,
  calories_max: 2600,
  protein_g_min: 68.0,
  fat_g_max: 65.0,
  fiber_g_min: 30.0,
  calcium_mg_min: 600,
  iron_mg_min: 15
};

export const WEEK_6_DATA: WeeklySchedule = {
  week_number: 6,
  title: "Routine Operations Planning Cycle (Week 6 of 16)",
  is_breach: false,
  total_weekly_cost_inr: 443091.0,
  weekly_budget_cap_inr: 577500.0,
  breach_amount_inr: 0,
  cost_per_student_day_inr: 126.60,
  average_daily_protein_g: 74.2,
  average_daily_calories: 2380,
  leftovers_cleared_kg: 107.0,
  status: "AUTO_APPROVED",
  schedule: {
    Monday: {
      breakfast: {
        name: "Poha with Roasted Peanuts & Mint Chutney",
        diet: "vegetarian",
        course: "breakfast",
        flavor_profile: "mildly spicy & tangy",
        region: "West",
        calories: 280,
        protein_g: 6.2,
        carbs_g: 48.5,
        fat_g: 7.1,
        fiber_g: 3.8,
        cost_per_plate_inr: 18.50
      },
      lunch: {
        name: "Aloo Gobi Matar with Phulka & Dal Tadka",
        diet: "vegetarian",
        course: "main course",
        flavor_profile: "homely & spiced",
        region: "North",
        calories: 520,
        protein_g: 18.5,
        carbs_g: 78.0,
        fat_g: 10.5,
        fiber_g: 10.2,
        cost_per_plate_inr: 34.00,
        leftover_utilized: ["Cauliflower (35kg)", "Hybrid Tomatoes (20kg)"]
      },
      snack: {
        name: "Bread Pakoda with Green Chutney & Tea",
        diet: "vegetarian",
        course: "snack",
        flavor_profile: "crispy & savory",
        region: "North",
        calories: 330,
        protein_g: 7.4,
        carbs_g: 41.0,
        fat_g: 15.5,
        fiber_g: 3.5,
        cost_per_plate_inr: 16.00
      },
      dinner: {
        name: "Palak Paneer with Missi Roti & Rice",
        diet: "vegetarian",
        course: "main course",
        flavor_profile: "earthy & savory",
        region: "North",
        calories: 540,
        protein_g: 26.5,
        carbs_g: 50.0,
        fat_g: 26.0,
        fiber_g: 8.5,
        cost_per_plate_inr: 52.00,
        leftover_utilized: ["Fresh Spinach (Palak) (24kg)"]
      },
      daily_calories: 2390,
      daily_protein_g: 71.1,
      daily_cost_inr: 60250.0,
      cost_per_student_day_inr: 120.50,
      protein_compliant: true,
      budget_compliant: true
    },
    Tuesday: {
      breakfast: {
        name: "Idli Sambar & Coconut Chutney",
        diet: "vegetarian",
        course: "breakfast",
        flavor_profile: "savory & tangy",
        region: "South",
        calories: 340,
        protein_g: 11.5,
        carbs_g: 58.0,
        fat_g: 6.8,
        fiber_g: 6.2,
        cost_per_plate_inr: 22.00
      },
      lunch: {
        name: "Rajma Masala with Steamed Basmati Rice",
        diet: "vegetarian",
        course: "main course",
        flavor_profile: "rich & robust spicy",
        region: "North",
        calories: 520,
        protein_g: 19.5,
        carbs_g: 86.0,
        fat_g: 10.2,
        fiber_g: 12.8,
        cost_per_plate_inr: 32.50,
        leftover_utilized: ["Hybrid Tomatoes (28kg)"]
      },
      snack: {
        name: "Samosa with Tamarind Chutney & Chai",
        diet: "vegetarian",
        course: "snack",
        flavor_profile: "crisp & spicy",
        region: "North",
        calories: 310,
        protein_g: 5.2,
        carbs_g: 42.0,
        fat_g: 14.5,
        fiber_g: 3.0,
        cost_per_plate_inr: 15.00
      },
      dinner: {
        name: "Dal Tadka with Jeera Rice & Chapati",
        diet: "vegetarian",
        course: "main course",
        flavor_profile: "comforting & garlicky",
        region: "North",
        calories: 540,
        protein_g: 18.2,
        carbs_g: 92.0,
        fat_g: 11.5,
        fiber_g: 10.5,
        cost_per_plate_inr: 28.00
      },
      daily_calories: 2270,
      daily_protein_g: 72.4,
      daily_cost_inr: 48750.0,
      cost_per_student_day_inr: 97.50,
      protein_compliant: true,
      budget_compliant: true
    },
    Wednesday: {
      breakfast: {
        name: "Moong Dal Cheela with Mint Chutney",
        diet: "vegetarian",
        course: "breakfast",
        flavor_profile: "savory & herby",
        region: "North",
        calories: 310,
        protein_g: 16.5,
        carbs_g: 42.0,
        fat_g: 8.0,
        fiber_g: 6.5,
        cost_per_plate_inr: 24.00
      },
      lunch: {
        name: "Chole Bhature with Pickled Onions",
        diet: "vegetarian",
        course: "main course",
        flavor_profile: "tangy & robust spicy",
        region: "North",
        calories: 680,
        protein_g: 18.0,
        carbs_g: 96.0,
        fat_g: 25.0,
        fiber_g: 11.0,
        cost_per_plate_inr: 36.00
      },
      snack: {
        name: "Dhokla with Mustard Tempering",
        diet: "vegetarian",
        course: "snack",
        flavor_profile: "spongy, sweet & tangy",
        region: "West",
        calories: 210,
        protein_g: 8.2,
        carbs_g: 32.0,
        fat_g: 5.5,
        fiber_g: 4.1,
        cost_per_plate_inr: 16.50
      },
      dinner: {
        name: "Mixed Dal Panchmel with Khichdi & Ghee",
        diet: "vegetarian",
        course: "main course",
        flavor_profile: "wholesome & comforting",
        region: "North",
        calories: 480,
        protein_g: 19.8,
        carbs_g: 78.0,
        fat_g: 10.0,
        fiber_g: 9.5,
        cost_per_plate_inr: 29.00
      },
      daily_calories: 2360,
      daily_protein_g: 75.5,
      daily_cost_inr: 52750.0,
      cost_per_student_day_inr: 105.50,
      protein_compliant: true,
      budget_compliant: true
    },
    Thursday: {
      breakfast: {
        name: "Upma with Coconut Chutney & Roasted Cashews",
        diet: "vegetarian",
        course: "breakfast",
        flavor_profile: "mild & savory",
        region: "South",
        calories: 290,
        protein_g: 7.0,
        carbs_g: 44.0,
        fat_g: 9.5,
        fiber_g: 3.1,
        cost_per_plate_inr: 19.00
      },
      lunch: {
        name: "Bhindi Masala with Chapati & Dal Fry",
        diet: "vegetarian",
        course: "main course",
        flavor_profile: "crisp & dry spicy",
        region: "West",
        calories: 460,
        protein_g: 14.8,
        carbs_g: 74.0,
        fat_g: 11.0,
        fiber_g: 8.6,
        cost_per_plate_inr: 33.00
      },
      snack: {
        name: "Veg Cutlet with Tomato Ketchup",
        diet: "vegetarian",
        course: "snack",
        flavor_profile: "crispy & spiced",
        region: "South",
        calories: 250,
        protein_g: 4.8,
        carbs_g: 36.0,
        fat_g: 10.0,
        fiber_g: 4.5,
        cost_per_plate_inr: 17.00
      },
      dinner: {
        name: "Egg Curry / Malai Kofta with Jeera Rice",
        diet: "non-vegetarian",
        course: "main course",
        flavor_profile: "spicy & savory",
        region: "East",
        calories: 560,
        protein_g: 24.2,
        carbs_g: 78.0,
        fat_g: 16.5,
        fiber_g: 5.8,
        cost_per_plate_inr: 42.00
      },
      daily_calories: 2280,
      daily_protein_g: 70.8,
      daily_cost_inr: 55500.0,
      cost_per_student_day_inr: 111.00,
      protein_compliant: true,
      budget_compliant: true
    },
    Friday: {
      breakfast: {
        name: "Masala Dosa with Sambar & Chutney",
        diet: "vegetarian",
        course: "breakfast",
        flavor_profile: "crisp & savory",
        region: "South",
        calories: 380,
        protein_g: 9.2,
        carbs_g: 64.0,
        fat_g: 10.1,
        fiber_g: 4.9,
        cost_per_plate_inr: 25.00
      },
      lunch: {
        name: "Sambar Rice with Potato Fry & Crispy Papad",
        diet: "vegetarian",
        course: "main course",
        flavor_profile: "tangy & spiced",
        region: "South",
        calories: 530,
        protein_g: 14.0,
        carbs_g: 88.0,
        fat_g: 13.5,
        fiber_g: 8.0,
        cost_per_plate_inr: 31.00
      },
      snack: {
        name: "Bread Pakoda with Green Chutney",
        diet: "vegetarian",
        course: "snack",
        flavor_profile: "crispy & savory",
        region: "North",
        calories: 330,
        protein_g: 7.4,
        carbs_g: 41.0,
        fat_g: 15.5,
        fiber_g: 3.5,
        cost_per_plate_inr: 16.00
      },
      dinner: {
        name: "Chicken Curry / Paneer Bhurji with Phulka",
        diet: "non-vegetarian",
        course: "main course",
        flavor_profile: "spicy & aromatic",
        region: "East",
        calories: 590,
        protein_g: 36.0,
        carbs_g: 72.0,
        fat_g: 17.5,
        fiber_g: 4.2,
        cost_per_plate_inr: 68.00
      },
      daily_calories: 2430,
      daily_protein_g: 76.6,
      daily_cost_inr: 70000.0,
      cost_per_student_day_inr: 140.00,
      protein_compliant: true,
      budget_compliant: true
    },
    Saturday: {
      breakfast: {
        name: "Moong Dal Cheela with Mint Chutney", // Substituted from Aloo Paratha to meet Potato Cap
        diet: "vegetarian",
        course: "breakfast",
        flavor_profile: "savory & herby",
        region: "North",
        calories: 310,
        protein_g: 16.5,
        carbs_g: 42.0,
        fat_g: 8.0,
        fiber_g: 6.5,
        cost_per_plate_inr: 24.00
      },
      lunch: {
        name: "Aloo Gobi Matar with Phulka & Curd",
        diet: "vegetarian",
        course: "main course",
        flavor_profile: "homely & spiced",
        region: "North",
        calories: 410,
        protein_g: 11.2,
        carbs_g: 72.0,
        fat_g: 8.5,
        fiber_g: 9.4,
        cost_per_plate_inr: 29.00
      },
      snack: {
        name: "Dhokla with Mustard Tempering",
        diet: "vegetarian",
        course: "snack",
        flavor_profile: "spongy, sweet & tangy",
        region: "West",
        calories: 210,
        protein_g: 8.2,
        carbs_g: 32.0,
        fat_g: 5.5,
        fiber_g: 4.1,
        cost_per_plate_inr: 16.50
      },
      dinner: {
        name: "Paneer Butter Masala with Butter Roti & Gulab Jamun",
        diet: "vegetarian",
        course: "main course",
        flavor_profile: "creamy & rich sweet",
        region: "North",
        calories: 640,
        protein_g: 24.8,
        carbs_g: 52.0,
        fat_g: 38.0,
        fiber_g: 5.2,
        cost_per_plate_inr: 64.00
      },
      daily_calories: 2380,
      daily_protein_g: 70.7,
      daily_cost_inr: 66750.0,
      cost_per_student_day_inr: 133.50,
      protein_compliant: true,
      budget_compliant: true
    },
    Sunday: {
      breakfast: {
        name: "Egg Bhurji / Paneer Bhurji with Pav",
        diet: "non-vegetarian",
        course: "breakfast",
        flavor_profile: "spicy & savory",
        region: "West",
        calories: 390,
        protein_g: 21.0,
        carbs_g: 35.0,
        fat_g: 18.5,
        fiber_g: 2.4,
        cost_per_plate_inr: 26.00
      },
      lunch: {
        name: "Hyderabadi Vegetable Biryani with Boondi Raita",
        diet: "vegetarian",
        course: "main course",
        flavor_profile: "aromatic & spiced",
        region: "South",
        calories: 510,
        protein_g: 13.2,
        carbs_g: 84.0,
        fat_g: 14.0,
        fiber_g: 7.1,
        cost_per_plate_inr: 36.00
      },
      snack: {
        name: "Samosa with Tamarind Chutney & Filter Coffee",
        diet: "vegetarian",
        course: "snack",
        flavor_profile: "crisp & spicy",
        region: "North",
        calories: 310,
        protein_g: 5.2,
        carbs_g: 42.0,
        fat_g: 14.5,
        fiber_g: 3.0,
        cost_per_plate_inr: 15.00
      },
      dinner: {
        name: "Butter Chicken / Shahi Paneer with Naan & Kheer",
        diet: "non-vegetarian",
        course: "main course",
        flavor_profile: "rich, creamy & mildly spicy",
        region: "North",
        calories: 670,
        protein_g: 38.5,
        carbs_g: 54.0,
        fat_g: 34.0,
        fiber_g: 4.1,
        cost_per_plate_inr: 78.00
      },
      daily_calories: 2520,
      daily_protein_g: 82.9,
      daily_cost_inr: 77500.0,
      cost_per_student_day_inr: 155.00,
      protein_compliant: true,
      budget_compliant: true
    }
  }
};

export const WEEK_8_BREACH_DATA: WeeklySchedule = {
  week_number: 8,
  title: "Diwali Cultural Feast Week (Simulated Budget-Breach Case)",
  is_breach: true,
  total_weekly_cost_inr: 634409.16,
  weekly_budget_cap_inr: 577500.0,
  breach_amount_inr: 56909.16,
  cost_per_student_day_inr: 181.26,
  average_daily_protein_g: 86.4,
  average_daily_calories: 2590,
  leftovers_cleared_kg: 85.0,
  status: "PENDING_COMMITTEE_APPROVAL",
  approval_id: "GATE-BREACH-WK8-1788934931",
  schedule: WEEK_6_DATA.schedule // shared structure with scaled feast surcharges
};

export const CONFLICT_DEBATES = [
  {
    conflict_id: "CONF-POTATO-01",
    agents: ["Budget-Agent", "Variety-Agent"],
    topic: "Potato Repetition Cap Breach (4 Potato Meals)",
    budget_position: "Proposes Aloo Paratha on Saturday breakfast (cost INR 22/plate) to maximize wholesale potato utilization at INR 18/kg.",
    variety_position: "Vetoes! Potato already featured in Mon lunch, Wed dinner, and Fri lunch. 4th occurrence violates the Max 3 Potato Rule, causing student carb burnout.",
    nutrition_input: "Notes that Aloo Paratha has only 9.8g protein, which risks Saturday morning protein target.",
    coordinator_resolution: "Arbitration: Substituted Saturday breakfast to 'Moong Dal Cheela with Mint Chutney'. Potato count restored to 3; protein jumped to 16.5g (+6.7g). Budget impact neutralized by bulk yellow moong dal.",
    status: "RESOLVED"
  },
  {
    conflict_id: "CONF-WASTE-PROTEIN-02",
    agents: ["Nutrition-Agent", "Variety-Agent"],
    topic: "Tuesday Lunch Kadhi Pakoda Plate Waste & Protein Deficit",
    budget_position: "Kadhi Pakoda is extremely economical (INR 24/plate) using sour curd and besan gram flour.",
    nutrition_position: "Tuesday daily protein drops to 57.2g, violating ICMR 68.0g floor. Kadhi has insufficient amino acid density.",
    variety_position: "Long-Term Memory registers 31.5% historical plate waste for Kadhi Pakoda due to acidic curd complaints and soggy pakoda texture.",
    coordinator_resolution: "Arbitration: Substituted Tuesday lunch with 'Rajma Masala with Steamed Rice'. Eliminates 31.5% waste dish, utilizes dry pantry kidney beans, and lifts Tuesday protein to 71.4g.",
    status: "RESOLVED"
  }
];

export const AUDIT_ENTRIES = [
  {
    index: 0,
    timestamp: "2026-09-09T08:00:00Z",
    actor: "SYSTEM_INIT",
    action: "GENESIS_AUDIT_BLOCK",
    details: "Hostel Mess Audit Trail Initialized for Fall 2026 semester",
    hash: "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"
  },
  {
    index: 1,
    timestamp: "2026-09-09T08:00:04Z",
    actor: "Menu-Coordinator",
    action: "LEFTOVER_FIRST_ALLOCATION",
    details: "Allocated 48kg Tomatoes, 35kg Cauliflower, and 24kg Palak into Monday/Tuesday meals",
    hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    index: 2,
    timestamp: "2026-09-09T08:00:11Z",
    actor: "Menu-Coordinator",
    action: "ARBITRATION_CONF_POTATO_01",
    details: "Swapped Saturday breakfast from Aloo Paratha to Moong Dal Cheela to satisfy Variety Agent",
    hash: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e"
  },
  {
    index: 3,
    timestamp: "2026-09-09T08:00:13Z",
    actor: "GovernanceGate",
    action: "AUTO_APPROVED_WITHIN_BUDGET",
    details: "Week 6 requisition INR 443,091.00 within ceiling INR 577,500.00. Issued PO-SEM1-WK6-001",
    hash: "8f481c81a0b36873da9b5decf26978eb35957d41a7d65b7167664684a0d9dfc2"
  },
  {
    index: 4,
    timestamp: "2026-09-09T09:30:06Z",
    actor: "GovernanceGate",
    action: "BUDGET_BREACH_DETECTED",
    details: "Week 8 Festive requisition INR 634,409.16 exceeds ceiling by INR 56,909.16. Gate locked",
    hash: "c2c5c56c2c8f8b8989a31a980590a5e8c9c0587d463ef1a646c87132a0c4f8db"
  }
];

export const PANTRY_STOCK = [
  { item: "Hybrid Tomatoes", quantity: 48.0, unit: "kg", days_to_expiry: 2, batch: "BATCH-TOM-0907", status: "CRITICAL_LEFTOVER", assigned: "Mon Lunch / Tue Lunch" },
  { item: "Cauliflower", quantity: 35.0, unit: "kg", days_to_expiry: 2, batch: "BATCH-CAU-0907", status: "CRITICAL_LEFTOVER", assigned: "Mon Lunch" },
  { item: "Fresh Spinach (Palak)", quantity: 24.0, unit: "kg", days_to_expiry: 1, batch: "BATCH-PLK-0908", status: "URGENT_USE_TODAY", assigned: "Mon Dinner" },
  { item: "Plain Curd / Dahi", quantity: 45.0, unit: "kg", days_to_expiry: 2, batch: "BATCH-CRD-0907", status: "CRITICAL_LEFTOVER", assigned: "Tue Lunch / Wed Raita" },
  { item: "Potatoes (Agra Special)", quantity: 180.0, unit: "kg", days_to_expiry: 16, batch: "BATCH-POT-0901", status: "STABLE", assigned: "Routine rotation" },
  { item: "Red Onions (Nashik Medium)", quantity: 140.0, unit: "kg", days_to_expiry: 20, batch: "BATCH-ONI-0901", status: "STABLE", assigned: "Base gravies" },
  { item: "Atta (Whole Wheat Flour)", quantity: 320.0, unit: "kg", days_to_expiry: 75, batch: "BATCH-WHT-0820", status: "STABLE", assigned: "Daily phulka/roti" },
  { item: "Basmati Sella Rice", quantity: 280.0, unit: "kg", days_to_expiry: 150, batch: "BATCH-RIC-0815", status: "STABLE", assigned: "Daily lunch/dinner" }
];
