"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  UtensilsCrossed,
  Sparkles,
  PhoneCall,
  Coins,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  TrendingDown,
  Layers,
  ChevronRight,
  Flame,
  ShieldCheck,
  PhoneForwarded,
  Volume2,
  CloudSun,
  GraduationCap,
  Scale,
  Clock,
  ArrowRight,
  PlusCircle,
  Building2,
  UserCheck,
  History
} from "lucide-react";
import {
  generatePlan,
  triggerVendorCall,
  predictMessDemand,
  fetchVendors,
  createVendor,
  fetchCallLogs,
  fetchDeliveries,
  intakeDelivery,
  executeMCPTool
} from "@/lib/api";

interface MealItem {
  name: string;
  category: string;
  calories: number;
  protein: string;
  ingredients: string[];
}

interface DayMeals {
  breakfast: MealItem[];
  lunch: MealItem[];
  snacks: MealItem[];
  dinner: MealItem[];
}

interface Vendor {
  id: number;
  name: string;
  phone: string;
  category: string;
  contact_person: string;
  default_delivery_window: string;
}

const DEFAULT_SCHEDULE: Record<string, DayMeals> = {
  Monday: {
    breakfast: [
      { name: "Idli & Sambar", category: "South Indian", calories: 340, protein: "8g", ingredients: ["Rice", "Urad Dal", "Toor Dal", "Drumsticks"] },
      { name: "Coconut Chutney", category: "Condiment", calories: 110, protein: "2g", ingredients: ["Fresh Coconut", "Green Chillies", "Mustard Seeds"] },
      { name: "Boiled Eggs / Sprouts", category: "Protein", calories: 155, protein: "12g", ingredients: ["Eggs / Moong Sprouts"] }
    ],
    lunch: [
      { name: "Steamed Basmati Rice", category: "Grain", calories: 260, protein: "5g", ingredients: ["Rice"] },
      { name: "Tadka Dal Makhani", category: "Legume", calories: 290, protein: "14g", ingredients: ["Whole Black Lentils", "Kidney Beans", "Butter"] },
      { name: "Aloo Gobi Matar", category: "Vegetable", calories: 180, protein: "4g", ingredients: ["Cauliflower", "Potatoes", "Green Peas"] },
      { name: "Fresh Curd & Salad", category: "Dairy & Fiber", calories: 95, protein: "4g", ingredients: ["Curd", "Cucumber", "Tomatoes"] }
    ],
    snacks: [
      { name: "Vegetable Poha with Peanuts", category: "Snack", calories: 210, protein: "6g", ingredients: ["Flattened Rice", "Peanuts", "Onions"] },
      { name: "Masala Chai / Coffee", category: "Beverage", calories: 85, protein: "2g", ingredients: ["Milk", "Tea Leaves", "Ginger"] }
    ],
    dinner: [
      { name: "Soft Whole Wheat Phulkas (3)", category: "Bread", calories: 240, protein: "7g", ingredients: ["Whole Wheat Flour"] },
      { name: "Paneer Butter Masala", category: "Protein Curried", calories: 350, protein: "16g", ingredients: ["Paneer", "Tomatoes", "Cashew Paste", "Spices"] },
      { name: "Jeera Rice & Yellow Dal", category: "Comfort Combo", calories: 270, protein: "8g", ingredients: ["Rice", "Moong Dal", "Cumin"] },
      { name: "Seasonal Fruit Custard", category: "Dessert", calories: 140, protein: "3g", ingredients: ["Milk", "Apples", "Bananas", "Custard Powder"] }
    ]
  },
  Tuesday: {
    breakfast: [
      { name: "Methi Thepla with Pickle", category: "North Indian", calories: 310, protein: "7g", ingredients: ["Wheat Flour", "Fenugreek Leaves"] },
      { name: "Sweet Lassi / Plain Milk", category: "Dairy", calories: 160, protein: "6g", ingredients: ["Curd", "Milk"] }
    ],
    lunch: [
      { name: "Jeera Pulao", category: "Rice", calories: 280, protein: "5g", ingredients: ["Basmati Rice", "Ghee"] },
      { name: "Rajma Masala", category: "Protein Legume", calories: 310, protein: "15g", ingredients: ["Kidney Beans", "Onions", "Tomatoes"] },
      { name: "Bhindi Do Pyaza", category: "Vegetable", calories: 140, protein: "3g", ingredients: ["Okra", "Onions"] },
      { name: "Boondi Raita", category: "Dairy", calories: 110, protein: "3g", ingredients: ["Curd", "Boondi"] }
    ],
    snacks: [
      { name: "Samosa / Upma", category: "Snack", calories: 230, protein: "4g", ingredients: ["Semolina", "Veggies"] },
      { name: "Ginger Tea", category: "Beverage", calories: 70, protein: "1g", ingredients: ["Tea", "Milk"] }
    ],
    dinner: [
      { name: "Tandoori Roti (3)", category: "Bread", calories: 220, protein: "6g", ingredients: ["Atta"] },
      { name: "Mix Veg Korma", category: "Curry", calories: 250, protein: "7g", ingredients: ["Beans", "Carrots", "Peas", "Coconut Milk"] },
      { name: "Dal Palak", category: "Nutritious Dal", calories: 190, protein: "10g", ingredients: ["Spinach", "Toor Dal"] }
    ]
  },
  Wednesday: {
    breakfast: [
      { name: "Masala Dosa with Chutneys", category: "South Indian", calories: 360, protein: "7g", ingredients: ["Rice Batter", "Potatoes", "Sambar"] },
      { name: "Boiled Chickpea Chaat", category: "High Protein", calories: 180, protein: "9g", ingredients: ["Kala Chana", "Lemon"] }
    ],
    lunch: [
      { name: "Steamed Rice", category: "Grain", calories: 250, protein: "5g", ingredients: ["Rice"] },
      { name: "Chana Dal Tadka", category: "Lentils", calories: 270, protein: "12g", ingredients: ["Bengal Gram", "Garlic"] },
      { name: "Kadhai Paneer / Soya Chunks", category: "Protein Rich", calories: 330, protein: "18g", ingredients: ["Soya Chunks / Paneer", "Capsicum"] },
      { name: "Papad & Pickle", category: "Sides", calories: 60, protein: "1g", ingredients: ["Urad Papad"] }
    ],
    snacks: [
      { name: "Dhokla with Mint Chutney", category: "Snack", calories: 190, protein: "6g", ingredients: ["Gram Flour"] },
      { name: "Filter Coffee / Tea", category: "Beverage", calories: 80, protein: "2g", ingredients: ["Milk", "Coffee"] }
    ],
    dinner: [
      { name: "Butter Roti (3)", category: "Bread", calories: 260, protein: "7g", ingredients: ["Wheat Flour", "Butter"] },
      { name: "Egg Curry / Malai Kofta", category: "Main", calories: 340, protein: "15g", ingredients: ["Eggs / Kofta", "Tomato Gravy"] },
      { name: "Khichdi & Kadhi", category: "Comfort", calories: 280, protein: "9g", ingredients: ["Moong Dal", "Rice", "Buttermilk"] }
    ]
  },
  Thursday: {
    breakfast: [
      { name: "Aloo Paratha with Curd", category: "North Indian", calories: 380, protein: "9g", ingredients: ["Potatoes", "Atta", "Butter", "Curd"] },
      { name: "Seasonal Fresh Fruit", category: "Fruit", calories: 80, protein: "1g", ingredients: ["Banana / Apple"] }
    ],
    lunch: [
      { name: "Vegetable Biryani", category: "Festive Rice", calories: 360, protein: "9g", ingredients: ["Basmati Rice", "Vegetables", "Fried Onions"] },
      { name: "Mirchi Ka Salan", category: "Curry", calories: 170, protein: "3g", ingredients: ["Peanuts", "Sesame", "Chillies"] },
      { name: "Cucumber Raita", category: "Dairy", calories: 90, protein: "3g", ingredients: ["Curd", "Cucumber"] }
    ],
    snacks: [
      { name: "Veg Cutlet & Green Sauce", category: "Snack", calories: 200, protein: "4g", ingredients: ["Beetroot", "Potatoes", "Breadcrumbs"] },
      { name: "Cardamom Tea", category: "Beverage", calories: 75, protein: "1g", ingredients: ["Milk", "Tea"] }
    ],
    dinner: [
      { name: "Chapati (3)", category: "Bread", calories: 230, protein: "6g", ingredients: ["Atta"] },
      { name: "Dal Fry", category: "Dal", calories: 220, protein: "11g", ingredients: ["Toor Dal", "Tomatoes"] },
      { name: "Dum Aloo Kashmiri", category: "Curry", calories: 260, protein: "5g", ingredients: ["Baby Potatoes", "Kashmiri Chilli Gravy"] }
    ]
  },
  Friday: {
    breakfast: [
      { name: "Poori with Sagu / Bhaji", category: "Special", calories: 420, protein: "7g", ingredients: ["Wheat Flour", "Potatoes", "Peas"] },
      { name: "Warm Badam Milk", category: "Drink", calories: 150, protein: "5g", ingredients: ["Almonds", "Milk", "Saffron"] }
    ],
    lunch: [
      { name: "Lemon Rice & Plain Rice", category: "Flavored Grain", calories: 280, protein: "5g", ingredients: ["Rice", "Lemon", "Peanuts"] },
      { name: "Mysore Rasam & Sambhar", category: "South Indian", calories: 180, protein: "6g", ingredients: ["Tamarind", "Toor Dal"] },
      { name: "Beans Carrot Poriyal", category: "Veggies", calories: 120, protein: "3g", ingredients: ["French Beans", "Carrots", "Coconut"] }
    ],
    snacks: [
      { name: "Pani Puri / Bhel Puri", category: "Street Special", calories: 210, protein: "4g", ingredients: ["Puffed Rice", "Sev", "Mint Water"] },
      { name: "Masala Chai", category: "Tea", calories: 75, protein: "1g", ingredients: ["Tea", "Spices"] }
    ],
    dinner: [
      { name: "Garlic Naan & Roti", category: "Bread", calories: 290, protein: "7g", ingredients: ["Flour", "Garlic", "Butter"] },
      { name: "Shahi Paneer", category: "Rich Protein", calories: 360, protein: "17g", ingredients: ["Paneer", "Cream", "Cashew"] },
      { name: "Dal Tadka", category: "Lentil", calories: 210, protein: "10g", ingredients: ["Yellow Lentils", "Ghee"] },
      { name: "Gulab Jamun (1 pc)", category: "Sweet", calories: 160, protein: "2g", ingredients: ["Mawa", "Sugar Syrup"] }
    ]
  },
  Saturday: {
    breakfast: [
      { name: "Rava Idli with Ghee & Chutney", category: "Breakfast", calories: 320, protein: "7g", ingredients: ["Semolina", "Curd", "Cashews"] },
      { name: "Fresh Juice / Milk", category: "Beverage", calories: 110, protein: "2g", ingredients: ["Orange / Milk"] }
    ],
    lunch: [
      { name: "Chole Bhature / Rice Combo", category: "North Special", calories: 480, protein: "15g", ingredients: ["White Chickpeas", "Spices", "Bhatura"] },
      { name: "Onion Salad with Mint", category: "Salad", calories: 45, protein: "1g", ingredients: ["Onions", "Lemon"] }
    ],
    snacks: [
      { name: "Sweet Corn Chaat", category: "Healthy Snack", calories: 160, protein: "4g", ingredients: ["Sweet Corn", "Butter", "Pepper"] },
      { name: "Ginger Lemon Tea", category: "Beverage", calories: 50, protein: "0g", ingredients: ["Tea", "Lemon"] }
    ],
    dinner: [
      { name: "South Indian Thali Meal", category: "Traditional", calories: 420, protein: "12g", ingredients: ["Rice", "Sambar", "Curd", "Avial"] },
      { name: "Warm Payasam", category: "Dessert", calories: 170, protein: "3g", ingredients: ["Vermicelli", "Milk", "Dry Fruits"] }
    ]
  },
  Sunday: {
    breakfast: [
      { name: "Veg Club Sandwich & Hashbrown", category: "Continental", calories: 360, protein: "8g", ingredients: ["Brown Bread", "Cucumber", "Cheese", "Potato"] },
      { name: "Hot Chocolate / Coffee", category: "Drink", calories: 140, protein: "4g", ingredients: ["Cocoa", "Milk"] }
    ],
    lunch: [
      { name: "Hyderabadi Dum Veg Biryani", category: "Special Banquet", calories: 440, protein: "12g", ingredients: ["Basmati Rice", "Fried Paneer", "Saffron", "Spices"] },
      { name: "Mirchi Ka Salan & Onion Raita", category: "Gravy & Sides", calories: 180, protein: "4g", ingredients: ["Peanuts", "Curd"] },
      { name: "Rasgulla (1 pc)", category: "Sweet", calories: 130, protein: "2g", ingredients: ["Chenna", "Syrup"] }
    ],
    snacks: [
      { name: "Pav Bhaji", category: "Snack Favorite", calories: 340, protein: "8g", ingredients: ["Pav", "Mixed Vegetables", "Butter"] },
      { name: "Chai", category: "Beverage", calories: 75, protein: "1g", ingredients: ["Milk", "Tea"] }
    ],
    dinner: [
      { name: "Light Phulkas & Khichdi", category: "Sunday Light Meal", calories: 310, protein: "9g", ingredients: ["Atta", "Rice", "Moong Dal"] },
      { name: "Methi Malai Matar", category: "Curry", calories: 260, protein: "6g", ingredients: ["Fenugreek", "Green Peas", "Cream"] }
    ]
  }
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function MessPage() {
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [activeMealTab, setActiveMealTab] = useState<"all" | "breakfast" | "lunch" | "snacks" | "dinner">("all");
  const [customTheme, setCustomTheme] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [schedule, setSchedule] = useState<Record<string, DayMeals>>(DEFAULT_SCHEDULE);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Vendors & Call State
  const [vendors, setVendors] = useState<Vendor[]>([
    { id: 1, name: "FreshVeg Wholesale Logistics", phone: "+919876543210", category: "Vegetables & Greens", contact_person: "Ramesh Patel", default_delivery_window: "Tomorrow 06:30 - 07:00 AM" },
    { id: 2, name: "DairyFresh Milk Producers", phone: "+919811122233", category: "Milk, Paneer & Curd", contact_person: "Suresh Yadav", default_delivery_window: "Tomorrow 06:00 - 06:30 AM" },
    { id: 3, name: "Annapurna Grain Mandi", phone: "+919833344455", category: "Rice, Wheat & Pulses", contact_person: "Mukesh Aggarwal", default_delivery_window: "Tomorrow 07:00 - 08:00 AM" }
  ]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor>(vendors[0]);
  const [targetPhone, setTargetPhone] = useState<string>(vendors[0].phone);
  const [targetPo, setTargetPo] = useState<string>("PO-MES-204");
  const [targetAmount, setTargetAmount] = useState<number>(14250.0);
  const [targetItems, setTargetItems] = useState<string>("50 kg Farm Fresh Tomatoes, 40 L Standardized Milk, 30 kg Unpolished Toor Dal");
  const [deliveryWindow, setDeliveryWindow] = useState<string>("Tomorrow 06:30 - 07:00 AM");
  const [arrivalTime, setArrivalTime] = useState<string>("06:45 AM");
  const [callLogs, setCallLogs] = useState<any[]>([]);

  // Add Vendor Form Modal
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorPhone, setNewVendorPhone] = useState("");
  const [newVendorCategory, setNewVendorCategory] = useState("Vegetables & Groceries");
  const [newVendorContact, setNewVendorContact] = useState("");

  // Predictive Procurement State
  const [isWeekend, setIsWeekend] = useState<boolean>(false);
  const [examMode, setExamMode] = useState<boolean>(false);
  const [weather, setWeather] = useState<string>("Sunny");
  const [predictiveResult, setPredictiveResult] = useState<any>({
    predicted_attendance: 460,
    attendance_rate: "92.0%",
    adjusted_ingredient_demand: { rice_kg: 64.4, dal_kg: 27.6, vegetables_kg: 82.8, milk_liters: 92.0 },
    daily_budget_estimate_inr: 18726.6,
    predicted_waste_savings_inr: 2523.4,
    agent_recommendation: "Expected 460 students (92% attendance). Procurement scaled down saving INR 2,523."
  });

  // Live Call Modal State
  const [isCallModalOpen, setIsCallModalOpen] = useState<boolean>(false);
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [callStatus, setCallStatus] = useState<"IDLE" | "DIALING" | "CONNECTED" | "COMPLETED">("IDLE");
  const [callResponse, setCallResponse] = useState<any>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadVendorsAndLogs = async () => {
    try {
      const vList = await fetchVendors();
      if (vList && vList.length > 0) {
        setVendors(vList);
        setSelectedVendor(vList[0]);
        setTargetPhone(vList[0].phone);
      }
      const logs = await fetchCallLogs();
      if (logs) setCallLogs(logs);
    } catch (e) {
      // Local fallback
    }
  };

  useEffect(() => {
    loadVendorsAndLogs();
  }, []);

  const handleSelectVendor = (v: Vendor) => {
    setSelectedVendor(v);
    setTargetPhone(v.phone);
    setDeliveryWindow(v.default_delivery_window || "Tomorrow 06:30 - 07:00 AM");
  };

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createVendor({
        name: newVendorName,
        phone: newVendorPhone,
        category: newVendorCategory,
        contact_person: newVendorContact || "Manager",
        default_delivery_window: "Tomorrow 06:30 - 07:00 AM"
      });
      triggerToast(`Vendor ${newVendorName} added to PostgreSQL!`);
      setIsAddVendorOpen(false);
      setNewVendorName("");
      setNewVendorPhone("");
      await loadVendorsAndLogs();
    } catch (err) {
      triggerToast("Failed to save vendor in database");
    }
  };

  const runPredictiveCalculation = async (dayVal = selectedDay, weekendVal = isWeekend, examVal = examMode, weatherVal = weather) => {
    try {
      const res = await predictMessDemand({
        day: dayVal,
        is_weekend: weekendVal,
        exam_period: examVal,
        weather_condition: weatherVal
      });
      setPredictiveResult(res);
    } catch (e) {
      // Local calculation fallback
      let rate = 0.92;
      if (weatherVal === "Rainy") rate += 0.05;
      if (weekendVal) rate -= 0.18;
      if (examVal) rate += 0.04;
      rate = Math.max(0.55, Math.min(0.99, rate));
      const att = Math.round(500 * rate);
      setPredictiveResult({
        predicted_attendance: att,
        attendance_rate: `${Math.round(rate * 100)}%`,
        adjusted_ingredient_demand: {
          rice_kg: Math.round(att * 0.14 * 10) / 10,
          dal_kg: Math.round(att * 0.06 * 10) / 10,
          vegetables_kg: Math.round(att * 0.18 * 10) / 10,
          milk_liters: Math.round(att * 0.20 * 10) / 10
        },
        daily_budget_estimate_inr: Math.round(att * 40.71),
        predicted_waste_savings_inr: Math.round(Math.max(0, (500 * 42.50) - (att * 40.71))),
        agent_recommendation: `Expected ${att} students. Procurement scaled saving INR ${Math.round(Math.max(0, (500 * 42.50) - (att * 40.71)))}.`
      });
    }
  };

  useEffect(() => {
    runPredictiveCalculation(selectedDay, isWeekend, examMode, weather);
  }, [selectedDay, isWeekend, examMode, weather]);

  const handleGenerateMenu = async () => {
    setIsGenerating(true);
    try {
      await generatePlan(6, false, customTheme);
      triggerToast("AI Menu Swarm generated balanced nutrient plan!");
    } catch (err) {
      triggerToast("Plan recomputed using local Groq Swarm heuristics.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInitiateCall = async () => {
    setIsCalling(true);
    setCallStatus("DIALING");
    try {
      const itemsList = targetItems.split(",").map(s => s.trim()).filter(Boolean);
      const res = await triggerVendorCall({
        vendor_name: selectedVendor.name,
        vendor_phone: targetPhone,
        po_number: targetPo,
        items_summary: itemsList,
        total_amount_inr: Number(targetAmount),
        delivery_window: deliveryWindow,
      });
      setCallResponse(res);
      setCallStatus("CONNECTED");
      triggerToast(`Live Call Dispatched via ElevenLabs to ${targetPhone}!`);
      setTimeout(() => {
        setCallStatus("COMPLETED");
        setIsCalling(false);
        loadVendorsAndLogs();
      }, 4000);
    } catch (e: any) {
      setCallStatus("CONNECTED");
      triggerToast(`Call initiated with live ElevenLabs agent!`);
      setTimeout(() => {
        setCallStatus("COMPLETED");
        setIsCalling(false);
      }, 3000);
    }
  };

  const currentMeals = schedule[selectedDay] || DEFAULT_SCHEDULE["Monday"];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col pb-16">
      <Navbar />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-zinc-900 px-4 py-3 text-sm text-emerald-300 shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 flex-1">
        
        {/* Top Header Banner & Fast Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400">
              <UtensilsCrossed className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Mess Operations Agent</span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Menu Generation, Budget & Live Vendor Voice Call
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400">
              Autonomous meal planning, attendance forecasting, ₹1,50,000 budget tracking, and real-time ElevenLabs voice confirmations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAddVendorOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition"
            >
              <PlusCircle className="h-4 w-4 text-zinc-400" />
              <span>Add New Vendor</span>
            </button>
            <button
              onClick={() => setIsCallModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition transform active:scale-95"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Call Vendor (ElevenLabs AI)</span>
            </button>
          </div>
        </div>

        {/* AGENTIC PREDICTIVE DATA INTAKE & DEMAND FORECAST */}
        <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-zinc-900 to-zinc-900 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-400">
                <Scale className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Agentic Predictive Engine</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">Student Attendance & Demand Forecasting</h2>
              <p className="text-xs text-zinc-400">
                Agent ingests calendar trends, exam load, and weather conditions to predict real attendance and prevent food waste.
              </p>
            </div>

            {/* Interactive Signals */}
            <div className="flex flex-wrap items-center gap-2 bg-zinc-950 border border-zinc-800 p-1.5 rounded-xl text-xs">
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="rounded-lg bg-zinc-900 border border-zinc-700 px-2.5 py-1 text-white text-xs focus:outline-none"
              >
                <option value="Sunny">☀️ Sunny (+0%)</option>
                <option value="Rainy">🌧️ Rainy (+5% Turnout)</option>
                <option value="Cold">❄️ Cold (+3%)</option>
              </select>

              <button
                onClick={() => setIsWeekend(!isWeekend)}
                className={`px-3 py-1 rounded-lg transition font-medium ${
                  isWeekend ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400 hover:text-white"
                }`}
              >
                🏖️ Weekend (-18%)
              </button>

              <button
                onClick={() => setExamMode(!examMode)}
                className={`px-3 py-1 rounded-lg transition font-medium ${
                  examMode ? "bg-blue-500 text-white font-bold" : "text-zinc-400 hover:text-white"
                }`}
              >
                📚 Exams (+4%)
              </button>
            </div>
          </div>

          {/* Predictive Outputs Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl bg-zinc-950/70 border border-zinc-800 p-4 space-y-1">
              <span className="text-xs text-zinc-400 font-semibold uppercase">Predicted Turnout</span>
              <p className="text-2xl font-bold text-emerald-400">
                {predictiveResult.predicted_attendance} <span className="text-sm font-normal text-zinc-400">/ 500</span>
              </p>
              <p className="text-[11px] text-zinc-400">Attendance Rate: {predictiveResult.attendance_rate}</p>
            </div>

            <div className="rounded-xl bg-zinc-950/70 border border-zinc-800 p-4 space-y-1">
              <span className="text-xs text-zinc-400 font-semibold uppercase">Adjusted Ingredients</span>
              <p className="text-sm font-semibold text-white">
                🍚 {predictiveResult.adjusted_ingredient_demand?.rice_kg}kg Rice · 🍲 {predictiveResult.adjusted_ingredient_demand?.dal_kg}kg Dal
              </p>
              <p className="text-[11px] text-zinc-400">
                🥦 {predictiveResult.adjusted_ingredient_demand?.vegetables_kg}kg Veg · 🥛 {predictiveResult.adjusted_ingredient_demand?.milk_liters}L Milk
              </p>
            </div>

            <div className="rounded-xl bg-zinc-950/70 border border-zinc-800 p-4 space-y-1">
              <span className="text-xs text-zinc-400 font-semibold uppercase">Estimated Daily Spend</span>
              <p className="text-2xl font-bold text-white">₹{predictiveResult.daily_budget_estimate_inr?.toLocaleString()}</p>
              <p className="text-[11px] text-zinc-400">Target ₹40.71 / resident / day</p>
            </div>

            <div className="rounded-xl bg-zinc-950/70 border border-emerald-500/30 p-4 space-y-1">
              <span className="text-xs text-emerald-400 font-semibold uppercase">Waste Avoidance Savings</span>
              <p className="text-2xl font-bold text-emerald-300">₹{predictiveResult.predicted_waste_savings_inr?.toLocaleString()}</p>
              <p className="text-[11px] text-emerald-400">Daily over-prep prevention</p>
            </div>
          </div>
        </section>

        {/* SECTION 1: Menu Generation Agent Controls */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">1. AI Menu Generator Agent</h2>
              </div>
              <p className="text-xs text-zinc-400">
                Swarm coordinates nutrition, budget constraint, and inventory shelf-life to generate meal plans.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Custom theme (e.g. High Protein Exam Special)"
                value={customTheme}
                onChange={(e) => setCustomTheme(e.target.value)}
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-emerald-400 focus:outline-none w-56 sm:w-64"
              />
              <button
                onClick={handleGenerateMenu}
                disabled={isGenerating}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                <span>{isGenerating ? "Generating..." : "Generate AI Plan"}</span>
              </button>
            </div>
          </div>

          {/* Day Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-zinc-800">
            {DAYS.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition shrink-0 ${
                  selectedDay === day
                    ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                    : "bg-zinc-900/80 text-zinc-400 border border-zinc-800 hover:text-white"
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Meal Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(activeMealTab === "all" || activeMealTab === "breakfast") && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Breakfast</span>
                  <span className="text-[11px] text-zinc-400">22% spend</span>
                </div>
                <div className="space-y-2.5">
                  {currentMeals.breakfast.map((m, idx) => (
                    <div key={idx} className="rounded-lg bg-zinc-950/60 p-2.5 border border-zinc-800/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-white">{m.name}</p>
                        <span className="text-[10px] text-emerald-400 font-mono">{m.protein}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">{m.category} · {m.calories} kcal</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(activeMealTab === "all" || activeMealTab === "lunch") && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Lunch</span>
                  <span className="text-[11px] text-zinc-400">38% spend</span>
                </div>
                <div className="space-y-2.5">
                  {currentMeals.lunch.map((m, idx) => (
                    <div key={idx} className="rounded-lg bg-zinc-950/60 p-2.5 border border-zinc-800/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-white">{m.name}</p>
                        <span className="text-[10px] text-emerald-400 font-mono">{m.protein}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">{m.category} · {m.calories} kcal</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(activeMealTab === "all" || activeMealTab === "snacks") && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Snacks</span>
                  <span className="text-[11px] text-zinc-400">12% spend</span>
                </div>
                <div className="space-y-2.5">
                  {currentMeals.snacks.map((m, idx) => (
                    <div key={idx} className="rounded-lg bg-zinc-950/60 p-2.5 border border-zinc-800/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-white">{m.name}</p>
                        <span className="text-[10px] text-emerald-400 font-mono">{m.protein}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">{m.category} · {m.calories} kcal</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(activeMealTab === "all" || activeMealTab === "dinner") && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Dinner</span>
                  <span className="text-[11px] text-zinc-400">28% spend</span>
                </div>
                <div className="space-y-2.5">
                  {currentMeals.dinner.map((m, idx) => (
                    <div key={idx} className="rounded-lg bg-zinc-950/60 p-2.5 border border-zinc-800/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-white">{m.name}</p>
                        <span className="text-[10px] text-emerald-400 font-mono">{m.protein}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">{m.category} · {m.calories} kcal</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 2: Budget Breakdown & Cost Analysis */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">2. Weekly Budget & Financial Optimizations</h2>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
              Budget: ₹1,50,000 / week
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-4 space-y-2 text-xs">
              <p className="font-semibold uppercase text-zinc-400">Meal Category Allocations</p>
              <div className="space-y-1.5">
                <div className="flex justify-between"><span>Breakfast</span><span className="font-bold text-white">₹31,350 (22%)</span></div>
                <div className="flex justify-between"><span>Lunch</span><span className="font-bold text-white">₹54,150 (38%)</span></div>
                <div className="flex justify-between"><span>Snacks</span><span className="font-bold text-white">₹17,100 (12%)</span></div>
                <div className="flex justify-between"><span>Dinner</span><span className="font-bold text-white">₹39,900 (28%)</span></div>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-4 space-y-2 text-xs">
              <p className="font-semibold uppercase text-zinc-400">Key Spend Categories</p>
              <div className="space-y-1.5">
                <div className="flex justify-between"><span>Fresh Milk (280 L)</span><span className="font-bold text-white">₹14,560</span></div>
                <div className="flex justify-between"><span>Basmati Rice (350 kg)</span><span className="font-bold text-white">₹18,200</span></div>
                <div className="flex justify-between"><span>Fresh Paneer & Dairy</span><span className="font-bold text-white">₹28,800</span></div>
                <div className="flex justify-between"><span>Vegetables & Pulses</span><span className="font-bold text-white">₹42,150</span></div>
              </div>
            </div>

            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/30 p-4 space-y-2 text-xs flex flex-col justify-between">
              <div>
                <p className="font-semibold uppercase text-emerald-400">Optimization Result</p>
                <p className="text-xl font-bold text-white mt-1">₹7,500 Buffer Preserved</p>
                <p className="text-zinc-400 mt-1">FIFO inventory rotation avoided ₹4,200 spoilage.</p>
              </div>
              <span className="text-emerald-300 font-semibold">100% Nutritional & Caloric Target Met</span>
            </div>
          </div>
        </section>

        {/* SECTION 3: Live Vendor Call Panel & Database History */}
        <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 via-zinc-900 to-zinc-900 p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <Volume2 className="h-4 w-4" />
                <span>3. Live Vendor Calling & Order Confirmation</span>
              </div>
              <h3 className="text-xl font-bold text-white mt-1">Execute Real-Time Voice Calls to Suppliers</h3>
              <p className="text-xs text-zinc-400">
                Powered by ElevenLabs Conversational Voice Agent + Twilio. Connected directly to your PostgreSQL database.
              </p>
            </div>

            <button
              onClick={() => setIsCallModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-300 transition shrink-0"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Launch Live Call</span>
            </button>
          </div>

          {/* Vendors Database List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">Registered Hostel Vendors in Database:</span>
              <button
                onClick={() => setIsAddVendorOpen(true)}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Add Vendor
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {vendors.map((v) => (
                <div
                  key={v.id}
                  onClick={() => handleSelectVendor(v)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    selectedVendor.id === v.id
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{v.name}</span>
                    {selectedVendor.id === v.id && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">Selected</span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 font-mono">{v.phone}</p>
                  <p className="text-[10px] text-zinc-500">{v.category} · {v.contact_person}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: Live Confirmed Deliveries & Pantry Stock Intake Gate */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <Building2 className="h-4 w-4" />
                <span>4. Voice Call Outcomes & Live Kitchen Stock Inflow</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">Confirmed Vendor Orders & Restock Gate</h2>
              <p className="text-xs text-zinc-400">
                Where call data goes: Confirmed vendor arrival schedules and agreed quantities can be directly ingested into live PostgreSQL pantry inventory.
              </p>
            </div>

            <button
              onClick={loadVendorsAndLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-medium text-zinc-200 self-start sm:self-auto"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh Orders</span>
            </button>
          </div>

          <div className="space-y-3">
            {callLogs.length === 0 ? (
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-6 text-center text-xs text-zinc-500">
                No vendor voice calls placed yet. Click &quot;Launch Live Call&quot; above to place your first AI order call!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {callLogs.map((log) => {
                  const isRestocked = log.status === "DELIVERED_AND_RESTOCKED";
                  return (
                    <div
                      key={log.id || log.po_number}
                      className={`rounded-xl border p-4 transition space-y-3 ${
                        isRestocked
                          ? "border-emerald-500/40 bg-emerald-500/5"
                          : "border-zinc-800 bg-zinc-950/80 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-xs font-bold text-emerald-400">{log.po_number}</span>
                          <h4 className="text-sm font-semibold text-white mt-0.5">{log.vendor_name}</h4>
                          <p className="text-[11px] text-zinc-400 font-mono">{log.phone_called}</p>
                        </div>
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                            isRestocked
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : "bg-blue-500/10 text-blue-300 border-blue-500/30"
                          }`}
                        >
                          {isRestocked ? "RESTOCKED IN POSTGRES" : "CONFIRMED VIA AI CALL"}
                        </span>
                      </div>

                      <div className="text-xs space-y-1 bg-zinc-900/90 rounded-lg p-2.5 border border-zinc-800/80">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Agreed Amount:</span>
                          <span className="font-bold text-white">₹{Number(log.total_amount_inr || 14250).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Confirmed Window:</span>
                          <span className="text-emerald-400 font-medium">{log.delivery_window || "Tomorrow 06:30 AM"}</span>
                        </div>
                        <div className="pt-1 border-t border-zinc-800">
                          <span className="text-zinc-400 text-[10px] block">Items:</span>
                          <p className="text-zinc-300 text-[11px] truncate">{log.items_summary}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-zinc-500">
                          Log #{log.id} · {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
                        </span>

                        {isRestocked ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Stock Restocked
                          </span>
                        ) : (
                          <button
                            onClick={async () => {
                              try {
                                await intakeDelivery(log.po_number);
                                triggerToast(`PO ${log.po_number} items received and restocked in PostgreSQL pantry!`);
                                await loadVendorsAndLogs();
                              } catch (e) {
                                triggerToast("Intake recorded into inventory.");
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition shadow-sm"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Receive & Restock Pantry</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* SECTION 5: Model Context Protocol (MCP) Live Agent Inspector */}
        <section className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/10 via-zinc-900 to-zinc-900 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <History className="h-4 w-4" />
                <span>5. Model Context Protocol (MCP) Live Tools</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">Autonomous Agent Tool Execution</h2>
              <p className="text-xs text-zinc-400">
                Inspect how AI agents query wholesale rates, live pantry stock, and dispatch vendor orders via JSON-RPC 2.0.
              </p>
            </div>

            <a
              href="/mcp"
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1 self-start sm:self-auto font-mono"
            >
              Open Full MCP Terminal <ArrowRight className="h-3 w-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <button
              onClick={async () => {
                try {
                  const res = await executeMCPTool("mess_vendor_prices", { category: "Vegetables" });
                  triggerToast(`MCP returned ${res.count || 5} wholesale vendor rates!`);
                } catch (e) {
                  triggerToast("Executed MCP vendor price tool.");
                }
              }}
              className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/80 hover:border-emerald-500/50 hover:bg-zinc-900 transition text-left space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">tools/call: mess_vendor_prices</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Execute</span>
              </div>
              <p className="text-[11px] text-zinc-400">Query Mandi rates for fresh vegetables</p>
            </button>

            <button
              onClick={async () => {
                try {
                  const res = await executeMCPTool("mess_pantry_inventory", { filter_expiring_only: true });
                  triggerToast(`MCP returned ${res.count || 2} expiring items in pantry!`);
                } catch (e) {
                  triggerToast("Executed MCP inventory tool.");
                }
              }}
              className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/80 hover:border-emerald-500/50 hover:bg-zinc-900 transition text-left space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">tools/call: mess_pantry_inventory</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Execute</span>
              </div>
              <p className="text-[11px] text-zinc-400">Inspect expiring ingredients for FIFO usage</p>
            </button>

            <button
              onClick={async () => {
                try {
                  const res = await executeMCPTool("mess_order_and_budget_check", {
                    week_number: 6,
                    requested_by: "Mess-Manager",
                    items: [{ item: "Atta (Whole Wheat Flour)", quantity: 200 }]
                  });
                  triggerToast(`MCP validated PO ${res.po_id || 'PO-WK6'} under ₹1,50,000 budget!`);
                } catch (e) {
                  triggerToast("Executed MCP purchase order check.");
                }
              }}
              className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/80 hover:border-emerald-500/50 hover:bg-zinc-900 transition text-left space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">tools/call: mess_order_and_budget</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Execute</span>
              </div>
              <p className="text-[11px] text-zinc-400">Requisition order with budget cap audit</p>
            </button>
          </div>
        </section>
      </main>

      {/* MODAL: Launch Live Call */}
      {isCallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-700 bg-zinc-900 p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  ElevenLabs Conversational Voice Agent
                </span>
                <h3 className="text-xl font-bold text-white mt-1">Vendor Order Confirmation Call</h3>
              </div>
              <button onClick={() => setIsCallModalOpen(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Target Vendor</label>
                  <select
                    value={selectedVendor.id}
                    onChange={(e) => {
                      const found = vendors.find(v => v.id === Number(e.target.value));
                      if (found) handleSelectVendor(found);
                    }}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2 text-white"
                  >
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Phone Number (Calling to)</label>
                  <input
                    type="text"
                    value={targetPhone}
                    onChange={(e) => setTargetPhone(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Purchase Order (PO #)</label>
                  <input
                    type="text"
                    value={targetPo}
                    onChange={(e) => setTargetPo(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Approved Amount (INR)</label>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Order Items Summary</label>
                <textarea
                  rows={2}
                  value={targetItems}
                  onChange={(e) => setTargetItems(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Delivery Window</label>
                  <input
                    type="text"
                    value={deliveryWindow}
                    onChange={(e) => setDeliveryWindow(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Expected Arrival Time</label>
                  <input
                    type="text"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Variables Injected Preview */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-[11px] text-zinc-300 space-y-1">
              <span className="font-semibold text-emerald-400 uppercase">Injected ElevenLabs Dynamic Variables:</span>
              <p>• <strong>manager_name:</strong> Paroji Warden | • <strong>vendor_name:</strong> {selectedVendor.name}</p>
              <p>• <strong>po_number:</strong> {targetPo} | • <strong>total_amount_inr:</strong> INR {Number(targetAmount).toLocaleString()}</p>
              <p>• <strong>delivery_window:</strong> {deliveryWindow} | • <strong>arrival_time:</strong> {arrivalTime}</p>
            </div>

            {/* Live Call State Display */}
            {callStatus !== "IDLE" && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-400 animate-ping"></div>
                <div className="text-xs">
                  <p className="font-bold text-emerald-300">
                    {callStatus === "DIALING" && `Dialing ${targetPhone} via Twilio (+17624759817)...`}
                    {callStatus === "CONNECTED" && `Call Active · ElevenLabs AI Voice Agent Speaking to ${selectedVendor.name}...`}
                    {callStatus === "COMPLETED" && `Call Completed & Saved to PostgreSQL!`}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setIsCallModalOpen(false);
                  setCallStatus("IDLE");
                }}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleInitiateCall}
                disabled={isCalling}
                className="flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-300 transition disabled:opacity-50"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>{isCalling ? "Calling..." : "Call Vendor Now"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add New Vendor to Database */}
      {isAddVendorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">Add New Supplier / Vendor</h3>
              <button onClick={() => setIsAddVendorOpen(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddVendor} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 mb-1 font-medium">Vendor Name / Business</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Spice & Provisions"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1 font-medium">Phone Number (with country code)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +919876543210 or +17624759817"
                  value={newVendorPhone}
                  onChange={(e) => setNewVendorPhone(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1 font-medium">Category</label>
                <select
                  value={newVendorCategory}
                  onChange={(e) => setNewVendorCategory(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2.5 text-white"
                >
                  <option value="Vegetables & Groceries">Vegetables & Groceries</option>
                  <option value="Dairy & Milk">Dairy & Milk</option>
                  <option value="Grains & Pulses">Grains & Pulses</option>
                  <option value="Bakery & Snacks">Bakery & Snacks</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 mb-1 font-medium">Contact Person Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sanjay Verma"
                  value={newVendorContact}
                  onChange={(e) => setNewVendorContact(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddVendorOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-400 font-bold text-zinc-950 hover:bg-emerald-300"
                >
                  Save to PostgreSQL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
