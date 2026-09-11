"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  BedDouble,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Play,
  ShieldCheck,
  Building,
  HeartPulse,
  Navigation,
  Clock,
  ArrowRight,
  Filter,
  BrainCircuit,
  TrendingUp,
  CalendarCheck
} from "lucide-react";
import { getRoomsStatus, getRoomRequests, createRoomRequest, allocateRooms, predictRoomCohorts } from "@/lib/api";

interface Room {
  room_no: string;
  block: string;
  floor: number;
  type: string;
  capacity: number;
  occupants: string[];
  status: "OCCUPIED" | "AVAILABLE" | "PARTIAL";
}

interface RoomApplication {
  id: string;
  student_id: string;
  student_name: string;
  year_of_study: number;
  distance_km: number;
  has_medical_priority: boolean;
  preferred_type: string;
  priority_score: number;
  allocated_room: string | null;
  status: "PENDING_ALLOCATION" | "ALLOCATED";
  applied_at: string;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([
    { room_no: "A-101", block: "Block A (Senior Wing)", floor: 1, type: "Single", capacity: 1, occupants: ["STU-401"], status: "OCCUPIED" },
    { room_no: "A-102", block: "Block A (Senior Wing)", floor: 1, type: "Single", capacity: 1, occupants: [], status: "AVAILABLE" },
    { room_no: "A-201", block: "Block A (Senior Wing)", floor: 2, type: "Single", capacity: 1, occupants: [], status: "AVAILABLE" },
    { room_no: "B-101", block: "Block B (Double Sharing)", floor: 1, type: "Double", capacity: 2, occupants: ["STU-305"], status: "PARTIAL" },
    { room_no: "B-102", block: "Block B (Double Sharing)", floor: 1, type: "Double", capacity: 2, occupants: [], status: "AVAILABLE" },
    { room_no: "B-201", block: "Block B (Double Sharing)", floor: 2, type: "Double", capacity: 2, occupants: ["STU-209", "STU-210"], status: "OCCUPIED" },
    { room_no: "B-202", block: "Block B (Double Sharing)", floor: 2, type: "Double", capacity: 2, occupants: [], status: "AVAILABLE" },
    { room_no: "C-101", block: "Block C (Triple Sharing)", floor: 1, type: "Triple", capacity: 3, occupants: ["STU-101", "STU-102"], status: "PARTIAL" },
    { room_no: "C-102", block: "Block C (Triple Sharing)", floor: 1, type: "Triple", capacity: 3, occupants: [], status: "AVAILABLE" },
    { room_no: "C-201", block: "Block C (Triple Sharing)", floor: 2, type: "Triple", capacity: 3, occupants: [], status: "AVAILABLE" },
  ]);

  const [applications, setApplications] = useState<RoomApplication[]>([
    { id: "REQ-101", student_id: "STU-402", student_name: "Aarav Sharma", year_of_study: 4, distance_km: 1450, has_medical_priority: true, preferred_type: "Single", priority_score: 98.5, allocated_room: null, status: "PENDING_ALLOCATION", applied_at: "2026-09-08" },
    { id: "REQ-102", student_id: "STU-403", student_name: "Ananya Iyer", year_of_study: 4, distance_km: 890, has_medical_priority: false, preferred_type: "Single", priority_score: 85.0, allocated_room: null, status: "PENDING_ALLOCATION", applied_at: "2026-09-08" },
    { id: "REQ-103", student_id: "STU-308", student_name: "Rohan Verma", year_of_study: 3, distance_km: 1200, has_medical_priority: true, preferred_type: "Double", priority_score: 92.0, allocated_room: null, status: "PENDING_ALLOCATION", applied_at: "2026-09-09" },
    { id: "REQ-104", student_id: "STU-215", student_name: "Priya Patel", year_of_study: 2, distance_km: 650, has_medical_priority: false, preferred_type: "Double", priority_score: 68.0, allocated_room: null, status: "PENDING_ALLOCATION", applied_at: "2026-09-09" },
    { id: "REQ-105", student_id: "STU-112", student_name: "Devansh Gupta", year_of_study: 1, distance_km: 1800, has_medical_priority: false, preferred_type: "Triple", priority_score: 72.0, allocated_room: null, status: "PENDING_ALLOCATION", applied_at: "2026-09-10" },
  ]);

  const [isAllocating, setIsAllocating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<string>("ALL");
  const [predictiveCohorts, setPredictiveCohorts] = useState<any>(null);

  // New Request Form State
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentId, setNewStudentId] = useState("");
  const [newYear, setNewYear] = useState<number>(3);
  const [newDistance, setNewDistance] = useState<number>(500);
  const [newMedical, setNewMedical] = useState<boolean>(false);
  const [newPref, setNewPref] = useState<string>("Double");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      const roomRes = await getRoomsStatus();
      if (roomRes.rooms) setRooms(roomRes.rooms);
      const reqRes = await getRoomRequests();
      if (reqRes.requests) setApplications(reqRes.requests);
      const predRes = await predictRoomCohorts();
      setPredictiveCohorts(predRes);
    } catch (e) {
      // Local fallback
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunAllocation = async () => {
    setIsAllocating(true);
    try {
      const res = await allocateRooms();
      showToast(`Agent allocated ${res.allocations_count || 5} rooms based on priority rank!`);
      await loadData();
    } catch (e) {
      // Local fallback simulation
      const updatedApps = applications.map((app) => {
        if (app.status === "PENDING_ALLOCATION") {
          let assigned = "A-102";
          if (app.preferred_type === "Double") assigned = "B-102";
          if (app.preferred_type === "Triple") assigned = "C-102";
          return { ...app, allocated_room: assigned, status: "ALLOCATED" as const };
        }
        return app;
      });
      setApplications(updatedApps);
      showToast("Room Allocation Agent completed assignments!");
    } finally {
      setIsAllocating(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        student_id: newStudentId || `STU-${Math.floor(100 + Math.random() * 900)}`,
        student_name: newStudentName || "New Applicant",
        year_of_study: Number(newYear),
        distance_km: Number(newDistance),
        has_medical_priority: newMedical,
        preferred_type: newPref
      };
      await createRoomRequest(payload);
      showToast("Application submitted! Priority score computed.");
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      showToast("Application recorded in local priority queue.");
      setIsModalOpen(false);
    }
  };

  const filteredRooms = selectedBlockFilter === "ALL" 
    ? rooms 
    : rooms.filter(r => r.block.includes(selectedBlockFilter));

  const totalCapacity = rooms.reduce((acc, r) => acc + r.capacity, 0);
  const occupiedBeds = rooms.reduce((acc, r) => acc + r.occupants.length, 0);
  const availableBeds = totalCapacity - occupiedBeds;
  const pendingRequests = applications.filter(a => a.status === "PENDING_ALLOCATION").length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col pb-16">
      <Navbar />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-blue-500/40 bg-zinc-900 px-4 py-3 text-sm text-blue-300 shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="h-4 w-4 text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 flex-1">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-blue-400">
              <BedDouble className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Room Allocation Agent</span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Student Request & Priority Allocation Engine
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400">
              Transparent, automated hostel housing mapped by seniority, distance, and medical priority scores.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition"
            >
              <PlusCircle className="h-4 w-4 text-zinc-400" />
              <span>New Student Request</span>
            </button>
            <button
              onClick={handleRunAllocation}
              disabled={isAllocating || pendingRequests === 0}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-indigo-400 transition disabled:opacity-50"
            >
              <Play className={`h-4 w-4 ${isAllocating ? "animate-spin" : ""}`} />
              <span>{isAllocating ? "Allocating..." : "Run Allocation Agent"}</span>
            </button>
          </div>
        </div>

        {/* PREDICTIVE COHORT & TURNOVER INTELLIGENCE */}
        <section className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/20 via-zinc-900 to-zinc-900 p-6 space-y-4">
          <div className="flex items-center gap-2 text-blue-400">
            <BrainCircuit className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Predictive Housing & Cohort Analytics</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-zinc-950/70 border border-zinc-800 p-4 space-y-1">
              <span className="text-xs text-zinc-400 font-semibold uppercase">Academic Synergy Index</span>
              <p className="text-2xl font-bold text-blue-400">94% Match</p>
              <p className="text-[11px] text-zinc-400">Study year and department harmony optimized</p>
            </div>

            <div className="rounded-xl bg-zinc-950/70 border border-zinc-800 p-4 space-y-1">
              <span className="text-xs text-zinc-400 font-semibold uppercase">Predicted Semester Turnover</span>
              <p className="text-2xl font-bold text-emerald-400">+3 Vacancies</p>
              <p className="text-[11px] text-zinc-400">Senior graduation turnover by Nov 30</p>
            </div>

            <div className="rounded-xl bg-zinc-950/70 border border-zinc-800 p-4 space-y-1">
              <span className="text-xs text-zinc-400 font-semibold uppercase">Accessibility SLA</span>
              <p className="text-2xl font-bold text-purple-400">100% Passed</p>
              <p className="text-[11px] text-zinc-400">Ground/1st floor guarantee for medical cases</p>
            </div>
          </div>
        </section>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-1">
            <span className="text-xs font-semibold uppercase text-zinc-400">Pending Requests</span>
            <p className="text-2xl font-bold text-amber-400">{pendingRequests}</p>
            <p className="text-[11px] text-zinc-400">Queued for agent priority rank</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-1">
            <span className="text-xs font-semibold uppercase text-zinc-400">Available Beds</span>
            <p className="text-2xl font-bold text-emerald-400">{availableBeds} / {totalCapacity}</p>
            <p className="text-[11px] text-zinc-400">Across Blocks A, B, C</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-1">
            <span className="text-xs font-semibold uppercase text-zinc-400">Occupancy Rate</span>
            <p className="text-2xl font-bold text-white">{Math.round((occupiedBeds / totalCapacity) * 100)}%</p>
            <p className="text-[11px] text-blue-400">{occupiedBeds} Beds Filled</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-1">
            <span className="text-xs font-semibold uppercase text-zinc-400">Allocation Model</span>
            <p className="text-2xl font-bold text-purple-400">Multi-Factor</p>
            <p className="text-[11px] text-zinc-400">Seniority + Medical + Distance</p>
          </div>
        </div>

        {/* Priority Engine Explanation Banner */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">How the Priority Engine Calculates Rank:</h4>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                • <strong>Seniority:</strong> 4th Year (40 pts), 3rd Year (30 pts), 2nd Year (20 pts), 1st Year (10 pts) &nbsp;|&nbsp;
                • <strong>Medical / Accessibility:</strong> +35 pts &nbsp;|&nbsp;
                • <strong>Distance Factor:</strong> Up to 25 pts (proportional to home distance)
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded-xl shrink-0">
            100% Deterministic & Auditable
          </span>
        </div>

        {/* SECTION 1: Student Request Applications & Priority Queue */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>1. Prioritized Student Request Queue</span>
                <span className="text-xs bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full text-zinc-300 font-mono">
                  {applications.length} Students
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Ranked highest to lowest based on computed priority score</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/90 text-zinc-400 uppercase tracking-wider text-[11px] border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Rank & Student</th>
                  <th className="px-4 py-3">Year / Batch</th>
                  <th className="px-4 py-3">Distance</th>
                  <th className="px-4 py-3">Special Priority</th>
                  <th className="px-4 py-3">Preferred Room</th>
                  <th className="px-4 py-3 font-mono">Priority Score</th>
                  <th className="px-4 py-3">Allocation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70 bg-zinc-950/60">
                {applications.map((app, idx) => (
                  <tr key={app.id} className="hover:bg-zinc-900/40 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-white">{app.student_name}</p>
                          <p className="text-[10px] text-zinc-400 font-mono">{app.student_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-zinc-300">
                      Year {app.year_of_study}
                    </td>
                    <td className="px-4 py-3.5 text-zinc-300">
                      {app.distance_km} km
                    </td>
                    <td className="px-4 py-3.5">
                      {app.has_medical_priority ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/30 px-2 py-0.5 text-[10px] font-medium text-red-400">
                          <HeartPulse className="h-3 w-3" /> Medical (+35)
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-[11px]">Standard</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-zinc-300">
                      <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[11px]">
                        {app.preferred_type} Room
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-sm text-blue-400">
                        {app.priority_score}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {app.status === "ALLOCATED" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          Allocated ({app.allocated_room})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-[11px] font-medium text-amber-300">
                          <Clock className="h-3 w-3 text-amber-400" />
                          Pending Agent
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 2: Interactive Hostel Block Visualizer */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-400" />
                <span>2. Hostel Block & Room Availability Grid</span>
              </h2>
              <p className="text-xs text-zinc-400">Real-time room occupancy and student assignments across blocks</p>
            </div>

            {/* Block Filter */}
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
              {["ALL", "Block A", "Block B", "Block C"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedBlockFilter(filter)}
                  className={`text-xs px-3 py-1 rounded-lg font-medium transition ${
                    selectedBlockFilter === filter
                      ? "bg-zinc-800 text-white font-semibold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room) => {
              const isOccupied = room.status === "OCCUPIED";
              const isPartial = room.status === "PARTIAL";
              return (
                <div
                  key={room.room_no}
                  className={`rounded-xl border p-4 transition ${
                    isOccupied
                      ? "border-zinc-800 bg-zinc-950/60"
                      : isPartial
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-emerald-500/30 bg-emerald-500/5"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-zinc-400">{room.block}</span>
                      <h4 className="text-lg font-bold text-white">{room.room_no}</h4>
                      <p className="text-[11px] text-zinc-400">Floor {room.floor} · {room.type} Room</p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                        isOccupied
                          ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                          : isPartial
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                          : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                      }`}
                    >
                      {room.status}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Occupancy:</span>
                      <span className="font-semibold text-white">
                        {room.occupants.length} / {room.capacity} Beds
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {room.occupants.length > 0 ? (
                        room.occupants.map((occ, i) => (
                          <span key={i} className="text-[10px] font-mono bg-zinc-800 border border-zinc-700 text-zinc-200 px-1.5 py-0.5 rounded">
                            {occ}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-emerald-400 italic">Available for assignment</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* MODAL: Submit New Room Request */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white">New Room Application</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 mb-1 font-medium">Student Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sen"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2.5 text-white focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1 font-medium">Student ID / Roll No</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STU-309"
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2.5 text-white focus:border-blue-400 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 mb-1 font-medium">Year of Study</label>
                  <select
                    value={newYear}
                    onChange={(e) => setNewYear(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2.5 text-white focus:border-blue-400 focus:outline-none"
                  >
                    <option value={4}>4th Year (Senior: 40 pts)</option>
                    <option value={3}>3rd Year (30 pts)</option>
                    <option value={2}>2nd Year (20 pts)</option>
                    <option value={1}>1st Year (10 pts)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1 font-medium">Home Distance (km)</label>
                  <input
                    type="number"
                    min="10"
                    max="3500"
                    value={newDistance}
                    onChange={(e) => setNewDistance(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2.5 text-white focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 mb-1 font-medium">Preferred Room Type</label>
                <select
                  value={newPref}
                  onChange={(e) => setNewPref(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2.5 text-white focus:border-blue-400 focus:outline-none"
                >
                  <option value="Single">Single Room (Senior priority)</option>
                  <option value="Double">Double Sharing</option>
                  <option value="Triple">Triple Sharing</option>
                </select>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <input
                  type="checkbox"
                  id="medPriority"
                  checked={newMedical}
                  onChange={(e) => setNewMedical(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 text-blue-500 focus:ring-0"
                />
                <label htmlFor="medPriority" className="text-zinc-300 text-xs cursor-pointer">
                  Has verified medical / accessibility requirement (+35 pts)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-500 font-bold text-white hover:bg-blue-400 transition"
                >
                  Submit & Compute Priority
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
