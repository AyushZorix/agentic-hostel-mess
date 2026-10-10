"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { PANTRY_STOCK } from "@/lib/mess-data";
import { 
  getPantryInventory, 
  updatePantryItem, 
  recordStockLevel,
  getLowStockStatus,
  configureAutoReorder,
  scanAndReorderAll,
  fetchVendors 
} from "@/lib/api";
import {
  Layers,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  RefreshCw,
  Plus,
  Minus,
  PhoneCall,
  PhoneForwarded,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Sliders,
  Send,
  Radio,
  ArrowDownCircle
} from "lucide-react";

export default function PantryPage() {
  const [inventory, setInventory] = useState<any[]>(PANTRY_STOCK);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterExpiring, setFilterExpiring] = useState<boolean>(false);
  const [filterLowStock, setFilterLowStock] = useState<boolean>(false);
  const [vendors, setVendors] = useState<any[]>([]);
  
  // Stock Recording state
  const [selectedItemName, setSelectedItemName] = useState<string>("");
  const [recordQty, setRecordQty] = useState<string>("");
  const [recordThreshold, setRecordThreshold] = useState<string>("");
  const [recordSupplier, setRecordSupplier] = useState<string>("");
  
  // Auto-Call Live Feedback Modal/Banner
  const [autoCallAlert, setAutoCallAlert] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [scanning, setScanning] = useState<boolean>(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadInventory = async (expiringOnly: boolean = filterExpiring) => {
    try {
      setLoading(true);
      const data = await getPantryInventory(expiringOnly);
      if (data && data.length > 0) {
        setInventory(data);
        if (!selectedItemName) {
          setSelectedItemName(data[0].item);
          setRecordQty(String(data[0].quantity));
          setRecordThreshold(String(data[0].reorder_point || 15));
          setRecordSupplier(data[0].supplier || "FreshVeg Wholesale Logistics");
        }
      } else {
        setInventory(PANTRY_STOCK);
      }
      
      const vList = await fetchVendors();
      setVendors(vList || []);
    } catch (err) {
      console.warn("Backend inventory fetch failed, using local mock:", err);
      setInventory(PANTRY_STOCK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory(filterExpiring);
  }, [filterExpiring]);

  const handleStockAdjust = async (item: string, delta: number) => {
    try {
      const res = await updatePantryItem(item, delta);
      await loadInventory(filterExpiring);
      
      if (res.is_low_stock && res.auto_call && res.auto_call.auto_call_triggered) {
        setAutoCallAlert(res.auto_call);
        triggerToast(`🚨 Low stock! Auto voice call dispatched to ${res.auto_call.vendor_name}`);
      } else if (res.is_low_stock) {
        triggerToast(`⚠️ Stock for ${item} is low (${res.new_quantity} ${res.unit})`);
      } else {
        triggerToast(`Stock updated for ${item} (${res.new_quantity} ${res.unit})`);
      }
    } catch (err) {
      console.warn("Stock update error:", err);
    }
  };

  const handleRecordDirectStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemName || recordQty === "") return;

    try {
      const res = await recordStockLevel({
        item: selectedItemName,
        quantity: parseFloat(recordQty),
        reorder_point: recordThreshold ? parseFloat(recordThreshold) : undefined,
        supplier: recordSupplier || undefined
      });

      await loadInventory(filterExpiring);

      if (res.is_low_stock && res.auto_call && res.auto_call.auto_call_triggered) {
        setAutoCallAlert(res.auto_call);
        triggerToast(`🚨 Low stock detected! Auto voice call dispatched to ${res.auto_call.vendor_name}`);
      } else if (res.is_low_stock) {
        triggerToast(`⚠️ Stock recorded: ${selectedItemName} is LOW (${res.quantity} ${res.unit})`);
      } else {
        triggerToast(`✅ Stock recorded: ${selectedItemName} is at ${res.quantity} ${res.unit}`);
      }
    } catch (err: any) {
      triggerToast(`Error recording stock: ${err.message}`);
    }
  };

  const handleScanAndReorder = async () => {
    setScanning(true);
    try {
      const res = await scanAndReorderAll();
      await loadInventory(filterExpiring);
      if (res.calls_triggered_count > 0) {
        setAutoCallAlert(res.calls[0]);
        triggerToast(`Autonomous Agent scan complete: ${res.calls_triggered_count} auto vendor calls dispatched!`);
      } else {
        triggerToast(`Autonomous Agent scan complete: All ${res.scanned_items_count} items above reorder thresholds.`);
      }
    } catch (err: any) {
      triggerToast(`Scan error: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const displayedInventory = inventory.filter(item => {
    if (filterLowStock) {
      return item.quantity <= (item.reorder_point || 10);
    }
    return true;
  });

  const totalKg = inventory.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const criticalItems = inventory.filter((item) => (item.days_to_expiry ?? 99) <= 3);
  const lowStockCount = inventory.filter((item) => item.quantity <= (item.reorder_point || 10)).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-zinc-800 selection:text-white">
      <Navbar />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-zinc-900 px-4 py-3 text-sm text-emerald-300 shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Auto-Call Live Trigger Modal / Banner */}
      {autoCallAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-emerald-500/50 bg-zinc-900 p-6 shadow-2xl shadow-emerald-500/20 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Radio className="h-5 w-5 animate-pulse text-red-400" />
                <span>Autonomous Low-Stock Voice Call Dispatched!</span>
              </div>
              <button 
                onClick={() => setAutoCallAlert(null)}
                className="text-xs text-zinc-400 hover:text-white bg-zinc-800 px-2 py-1 rounded"
              >
                Dismiss
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 flex items-center gap-2 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Stock hit below threshold! ElevenLabs AI Agent has placed an automated phone call to the respected vendor.</span>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800">
                <div>
                  <span className="text-zinc-500 block">Purchase Order (PO):</span>
                  <span className="font-mono font-bold text-white text-sm">{autoCallAlert.po_number}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Respected Vendor:</span>
                  <span className="font-bold text-emerald-400 text-sm">{autoCallAlert.vendor_name}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Vendor Phone Called:</span>
                  <span className="font-mono text-zinc-200">{autoCallAlert.vendor_phone}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Auto-Order Amount:</span>
                  <span className="font-bold text-white">₹{Number(autoCallAlert.total_amount_inr || 0).toLocaleString()} ({autoCallAlert.reorder_quantity} {autoCallAlert.unit})</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-semibold">Live ElevenLabs Voice Call Status:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                    {autoCallAlert.status || "DISPATCHED"}
                  </span>
                </div>
                <p className="text-zinc-300 text-[11px] italic bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80">
                  &quot;Hello {autoCallAlert.vendor_name}, this is HostelOps automated logistics assistant calling on behalf of Paroji Warden. I am calling to confirm urgent restock for PO {autoCallAlert.po_number}...&quot;
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setAutoCallAlert(null)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-1">
              <span>Operations Module</span>
              <span>•</span>
              <span className="text-white">Live Stock Keeper & Auto-Vendor Dispatch</span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                PostgreSQL + ElevenLabs Trigger
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Pantry Inventory & Autonomous Low-Stock Calling
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
              Keep live records of stock on-hand. As soon as any item hits below its reorder threshold, the autonomous agent automatically triggers an outbound voice call to the respected vendor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleScanAndReorder}
              disabled={scanning}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 hover:from-emerald-400 hover:to-teal-400 transition"
            >
              <Sparkles className={`w-3.5 h-3.5 ${scanning ? "animate-spin" : ""}`} />
              <span>{scanning ? "Scanning Stock..." : "Scan & Auto-Reorder All"}</span>
            </button>
            <button
              onClick={() => setFilterLowStock(!filterLowStock)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                filterLowStock
                  ? "bg-red-500/10 text-red-300 border-red-500/40"
                  : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800"
              }`}
            >
              {filterLowStock ? `Showing Low Stock (${lowStockCount})` : "Filter Low Stock"}
            </button>
            <button
              onClick={() => setFilterExpiring(!filterExpiring)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                filterExpiring
                  ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                  : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800"
              }`}
            >
              {filterExpiring ? "Showing Expiring (<=3d)" : "Filter Expiring"}
            </button>
            <button
              onClick={() => loadInventory(filterExpiring)}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all"
              title="Refresh Inventory"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Operational Highlights Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
            <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold block">
              Total Stock Tracked
            </span>
            <div className="text-xl font-bold text-white font-mono">{totalKg.toFixed(1)} Units</div>
            <p className="text-[11px] text-zinc-500">Across {inventory.length} live PostgreSQL lots</p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
            <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold block">
              Low Stock Alert Status
            </span>
            <div className={`text-xl font-bold font-mono ${lowStockCount > 0 ? "text-red-400" : "text-emerald-400"}`}>
              {lowStockCount} Items Low
            </div>
            <p className="text-[11px] text-zinc-500">
              {lowStockCount > 0 ? "Auto voice calls armed & dispatched" : "All items above safe threshold"}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
            <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold block">
              Leftover-First Allocation
            </span>
            <div className="text-xl font-bold text-amber-400 font-mono">{criticalItems.length} Critical Items</div>
            <p className="text-[11px] text-zinc-500">Expiring in ≤ 3 days routed to Mon/Tue</p>
          </div>
        </div>

        {/* SECTION: Record Daily Stock on Hand */}
        <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-zinc-900 to-zinc-900 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <Sliders className="h-4 w-4" />
                <span>Daily Stock Recorder & Threshold Controller</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                Record Stock Levels & Trigger Automated Vendor Calling
              </h2>
              <p className="text-xs text-zinc-400">
                Enter your physical count below. If the quantity hits below the reorder point, the autonomous agent triggers the voice call automatically!
              </p>
            </div>
          </div>

          <form onSubmit={handleRecordDirectStock} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1 font-semibold">Select Pantry Item</label>
              <select
                value={selectedItemName}
                onChange={(e) => {
                  setSelectedItemName(e.target.value);
                  const found = inventory.find(i => i.item === e.target.value);
                  if (found) {
                    setRecordQty(String(found.quantity));
                    setRecordThreshold(String(found.reorder_point || 15));
                    setRecordSupplier(found.supplier || "FreshVeg Wholesale Logistics");
                  }
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium focus:border-emerald-500 focus:outline-none"
              >
                {inventory.map((inv, idx) => (
                  <option key={idx} value={inv.item}>{inv.item} (Current: {inv.quantity} {inv.unit})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 font-semibold">Current On-Hand Quantity</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={recordQty}
                onChange={(e) => setRecordQty(e.target.value)}
                placeholder="e.g. 8.0"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 font-semibold">Reorder Threshold</label>
              <input
                type="number"
                step="1"
                min="1"
                value={recordThreshold}
                onChange={(e) => setRecordThreshold(e.target.value)}
                placeholder="e.g. 15.0"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 font-semibold">Respected Vendor</label>
              <select
                value={recordSupplier}
                onChange={(e) => setRecordSupplier(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium focus:border-emerald-500 focus:outline-none"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.name}>{v.name} ({v.phone})</option>
                ))}
                {vendors.length === 0 && (
                  <>
                    <option value="FreshVeg Wholesale Logistics">FreshVeg Wholesale Logistics</option>
                    <option value="DairyFresh Milk Producers">DairyFresh Milk Producers</option>
                    <option value="Annapurna Grain Mandi">Annapurna Grain Mandi</option>
                  </>
                )}
              </select>
            </div>

            <div className="sm:col-span-4 flex items-center justify-between pt-2">
              <span className="text-[11px] text-zinc-400">
                Tip: Try lowering Tomatoes to 5 kg (below 15 kg threshold) to test the automated outbound call trigger!
              </span>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Save Stock Record & Check Trigger</span>
              </button>
            </div>
          </form>
        </section>

        {/* Stock Table */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Live Pantry Inventory & Respective Vendor Mappings
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Each item monitors its reorder point. Red badge indicates low stock with auto voice dispatch active.
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              {displayedInventory.length} of {inventory.length} Stock Lots Tracked
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="p-3.5">Stock Item</th>
                  <th className="p-3.5">On-Hand Stock</th>
                  <th className="p-3.5">Reorder Point</th>
                  <th className="p-3.5">Respected Vendor</th>
                  <th className="p-3.5">Freshness Countdown</th>
                  <th className="p-3.5">Auto-Call Status</th>
                  <th className="p-3.5">Quick Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {displayedInventory.map((item, i) => {
                  const isLow = item.quantity <= (item.reorder_point || 10);
                  const isExpiring = (item.days_to_expiry ?? 99) <= 2;
                  return (
                    <tr key={i} className={`hover:bg-zinc-800/40 transition-colors ${isLow ? "bg-red-500/5" : ""}`}>
                      <td className="p-3.5 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span>{item.item}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">({item.category})</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono font-bold">
                        <span className={isLow ? "text-red-400" : "text-emerald-400"}>
                          {item.quantity} {item.unit}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-zinc-400">
                        {item.reorder_point || 15} {item.unit}
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-col">
                          <span className="text-zinc-200 font-medium">{item.supplier || "APMC Wholesale"}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">Mapped Vendor</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-medium">
                        {isExpiring ? (
                          <span className="text-amber-400 flex items-center gap-1 font-semibold">
                            <AlertCircle className="w-3.5 h-3.5" /> {item.days_to_expiry} days
                          </span>
                        ) : (
                          <span className="text-zinc-400">{item.days_to_expiry} days</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse font-bold">
                            <PhoneCall className="w-3 h-3" /> AUTO CALL DISPATCHED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-800 text-zinc-400">
                            NORMAL (SAFE)
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleStockAdjust(item.item, -5)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 hover:text-red-300 text-zinc-300 border border-zinc-700 transition"
                            title="Consume 5 units (drop stock)"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStockAdjust(item.item, 10)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-emerald-500/20 hover:text-emerald-300 text-zinc-300 border border-zinc-700 transition"
                            title="Restock 10 units"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

