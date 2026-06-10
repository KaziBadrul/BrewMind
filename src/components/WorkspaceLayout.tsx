"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  Plus,
  MessageSquare,
  FolderGit2,
  Trash2,
  Edit2,
  Coffee,
  Moon,
  Sun,
  BarChart3,
  Settings,
  Cpu,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Download,
  Zap,
} from "lucide-react";
import Image from "next/image";
import ChatInterface from "@/components/ChatInterface";
import { dbHelpers } from "@/utils/db";
import { BrewProject, ChatSession } from "@/types/chat";
import { runComprehensiveBenchmark, BenchmarkResults } from "@/utils/benchmark";
interface Model {
  name: string;
  size: number;
  parameterSize: string;
  family: string;
}

export default function WorkspaceLayout() {
  const { theme, toggleTheme } = useTheme();

  // --- DATABASE STATE ---
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [brews, setBrews] = useState<BrewProject[]>([]);
  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);

  // --- OLLAMA & BENCHMARK STATE ---
  const [viewMode, setViewMode] = useState<"chat" | "benchmark">("chat");
  const [ollamaActive, setOllamaActive] = useState<boolean | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchmarkProgress, setBenchmarkProgress] = useState(0);
  const [benchmarkPhase, setBenchmarkPhase] = useState("");
  const [benchmarkResults, setBenchmarkResults] =
    useState<BenchmarkResults | null>(null);
  const [hardwareTier, setHardwareTier] = useState<
    "low" | "mid" | "high" | null
  >(null);

  // --- 1. LOAD LOCAL DB DATA ---
  const loadWorkspaceData = async () => {
    const loadedBrews = await dbHelpers.getAllBrews();
    const loadedChats = await dbHelpers.getAllSessions();
    setBrews(loadedBrews);
    setRecentChats(loadedChats);
  };

  useEffect(() => {
    loadWorkspaceData();
  }, []);

  // --- 2. OLLAMA SCANNING ---
  const scanModels = useCallback(async () => {
    setIsScanning(true);
    try {
      const res = await fetch("/api/models");
      const data = await res.json();
      setOllamaActive(data.active);
      setModels(data.models);
      if (data.models.length > 0) {
        setSelectedModel(data.models[0].name);
      } else {
        setViewMode("benchmark"); // Push to explore benchmarks if no models
      }
    } catch {
      setOllamaActive(false);
      setModels([]);
      setViewMode("benchmark");
    } finally {
      setIsScanning(false);
    }
  }, []);

  useEffect(() => {
    scanModels();
  }, [scanModels]);

  // --- 3. HARDWARE BENCHMARK ---
  // --- 3. HARDWARE BENCHMARK ---
  const handleRunBenchmark = async () => {
    setBenchmarking(true);
    setBenchmarkResults(null);

    const results = await runComprehensiveBenchmark((phase, progress) => {
      setBenchmarkPhase(phase);
      setBenchmarkProgress(progress);
    });

    setBenchmarkResults(results);
    setBenchmarking(false);
  };

  // --- 4. CHAT MANAGEMENT ---
  const handleNewChat = async () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      brewId: null,
      title: "New Pour",
      hoverDescription: "A fresh conversation.",
      messages: [],
      updatedAt: Date.now(),
    };

    await dbHelpers.saveSession(newSession);
    setActiveSessionId(newSession.id);
    setViewMode("chat");
    await loadWorkspaceData();
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await dbHelpers.deleteSession(id);
    if (activeSessionId === id) setActiveSessionId(null);
    await loadWorkspaceData();
  };

  return (
    <div className="flex h-screen w-full bg-coffee-100 dark:bg-coffee-950 transition-colors duration-300 p-4 gap-4">
      {/* --- SIDEBAR --- */}
      <aside className="w-72 flex flex-col justify-between p-4 rounded-2xl bg-white/40 dark:bg-coffee-900/40 backdrop-blur-md border border-coffee-300/30 dark:border-coffee-800/30 shadow-sm">
        {/* Top Section: Header & Workspace */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-coffee-300/20 dark:border-coffee-800/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-coffee-900 text-coffee-50 dark:bg-coffee-800 shadow-md">
                <Coffee size={20} />
              </div>
              <div>
                <h1 className="font-bold tracking-tight text-coffee-900 dark:text-coffee-50">
                  BrewMind
                </h1>
                <p className="text-[11px] text-coffee-600/70 dark:text-coffee-400/70">
                  Local Roastery
                </p>
              </div>
            </div>
            <button
              onClick={handleNewChat}
              className="p-2 rounded-lg bg-coffee-800 text-white hover:bg-coffee-900 dark:bg-amber-600 dark:hover:bg-amber-500 transition shadow-sm"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Scrollable Chats */}
          <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-2">
            {/* BREWS */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-coffee-500 dark:text-coffee-400 uppercase tracking-wider pl-2 mb-2">
                Your Brews
              </h3>
              {brews.length === 0 && (
                <p className="text-xs text-coffee-400 pl-2">
                  No active projects yet.
                </p>
              )}
              {brews.map((brew) => (
                <button
                  key={brew.id}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-coffee-200/50 dark:hover:bg-coffee-900/50 text-coffee-800 dark:text-coffee-200 transition group text-left"
                >
                  <FolderGit2
                    size={16}
                    className="text-amber-700 dark:text-amber-500 opacity-80 shrink-0"
                  />
                  <span className="text-sm font-medium truncate flex-1">
                    {brew.name}
                  </span>
                </button>
              ))}
            </div>

            {/* RECENTS */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-coffee-500 dark:text-coffee-400 uppercase tracking-wider pl-2 mb-2">
                Recent Pours
              </h3>
              {recentChats.length === 0 && (
                <p className="text-xs text-coffee-400 pl-2">
                  Click + to start a chat.
                </p>
              )}
              {recentChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                    setActiveSessionId(chat.id);
                    setViewMode("chat");
                  }}
                  className={`group relative w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer ${
                    activeSessionId === chat.id && viewMode === "chat"
                      ? "bg-coffee-200 dark:bg-coffee-800/80 text-coffee-950 dark:text-white font-semibold"
                      : "hover:bg-coffee-200/50 dark:hover:bg-coffee-900/50 text-coffee-800 dark:text-coffee-200"
                  }`}
                  title={chat.hoverDescription}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <MessageSquare
                      size={16}
                      className="text-coffee-500 dark:text-coffee-400 opacity-70 shrink-0"
                    />
                    <span className="text-sm truncate">{chat.title}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 bg-transparent pl-2">
                    <button className="p-1 hover:text-amber-600 dark:hover:text-amber-400">
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      className="p-1 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section: Model Selection & Settings */}
        <div className="pt-4 border-t border-coffee-300/20 dark:border-coffee-800/20 space-y-4">
          {/* Model Status Indicator */}
          <div className="px-1 flex items-center justify-between">
            {ollamaActive && models.length > 0 ? (
              <div className="flex-1">
                <label className="text-[10px] font-semibold tracking-wider uppercase text-coffee-600/80 dark:text-coffee-400/80 flex items-center gap-1.5 mb-1">
                  <Cpu size={12} /> Active Roast
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full text-xs py-1.5 px-2 rounded-lg bg-white/60 dark:bg-coffee-950/60 border border-coffee-300/40 dark:border-coffee-800/40 text-coffee-800 dark:text-coffee-200 focus:outline-none"
                >
                  {models.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex-1 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span className="font-medium">Ollama Offline</span>
              </div>
            )}
            <button
              onClick={scanModels}
              disabled={isScanning}
              className={`p-2 ml-2 rounded-lg hover:bg-coffee-200/50 dark:hover:bg-coffee-800/50 text-coffee-600 dark:text-coffee-400 ${isScanning ? "animate-spin" : ""}`}
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setViewMode("benchmark")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors ${
                viewMode === "benchmark"
                  ? "bg-coffee-700 text-white shadow-sm dark:bg-coffee-600"
                  : "text-coffee-700 dark:text-coffee-300 hover:bg-coffee-200/50 dark:hover:bg-coffee-900/50"
              }`}
            >
              <BarChart3 size={16} /> Benchmark
            </button>
            <div className="flex gap-1 ml-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-coffee-700 dark:text-coffee-300 hover:bg-coffee-200/50 dark:hover:bg-coffee-900/50 transition-colors"
              >
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              <button className="p-2 rounded-xl text-coffee-700 dark:text-coffee-300 hover:bg-coffee-200/50 dark:hover:bg-coffee-900/50 transition-colors">
                <Settings size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN VIEWPORT --- */}
      <main className="flex-1 flex flex-col rounded-2xl overflow-hidden bg-white/60 dark:bg-coffee-900/20 backdrop-blur-xl border border-white/40 dark:border-coffee-800/20 shadow-xl relative">
        {viewMode === "benchmark" ? (
          /* BENCHMARK / ONBOARDING ENGINE */
          // {/* Benchmark Runner Box */}
          <div className="p-6 rounded-2xl bg-white/50 dark:bg-coffee-900/30 border border-coffee-300/20 dark:border-coffee-800/30 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-coffee-800 dark:text-coffee-200 flex items-center gap-2">
                  <Zap size={18} className="text-amber-500" /> Hardware Tasting
                  Profile
                </h3>
                <p className="text-xs text-coffee-600 dark:text-coffee-400 mt-1">
                  Runs client-side synthetic physics and matrix multi-threading
                  tests.
                </p>
              </div>
              <button
                onClick={handleRunBenchmark}
                disabled={benchmarking}
                className="px-5 py-2.5 rounded-xl bg-coffee-700 hover:bg-coffee-800 text-white text-sm font-medium transition shadow-md disabled:opacity-50 dark:bg-coffee-600 dark:hover:bg-coffee-700 w-48"
              >
                {benchmarking ? "Testing..." : "Begin Diagnostic"}
              </button>
            </div>

            {/* Progress Bar & Status */}
            {benchmarking && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-coffee-600 dark:text-coffee-400">
                  <span>{benchmarkPhase}</span>
                  <span>{benchmarkProgress}%</span>
                </div>
                <div className="w-full bg-coffee-200 dark:bg-coffee-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full transition-all duration-300 ease-out"
                    style={{ width: `${benchmarkProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Benchmark Results & Model Suggestion */}
            {benchmarkResults && !benchmarking && (
              <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Hardware Scores */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-coffee-100 dark:bg-coffee-950/50 border border-coffee-200 dark:border-coffee-800/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-coffee-500">
                      CPU Score
                    </span>
                    <p className="text-2xl font-mono text-coffee-900 dark:text-white">
                      {benchmarkResults.cpuScore.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-coffee-100 dark:bg-coffee-950/50 border border-coffee-200 dark:border-coffee-800/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-coffee-500">
                      GPU Score
                    </span>
                    <p className="text-2xl font-mono text-coffee-900 dark:text-white">
                      {benchmarkResults.gpuScore.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-coffee-100 dark:bg-coffee-950/50 border border-coffee-200 dark:border-coffee-800/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-coffee-500">
                      Est. Base RAM
                    </span>
                    <p className="text-2xl font-mono text-coffee-900 dark:text-white">
                      {benchmarkResults.memoryEstimate} GB+
                    </p>
                  </div>
                </div>

                {/* Recommendation Engine */}
                <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-2">
                    <span className="text-xs font-semibold tracking-wider uppercase text-amber-700 dark:text-amber-500 flex items-center gap-2">
                      <ShieldCheck size={14} /> Perfect Match
                    </span>
                    <h4 className="text-xl font-bold text-coffee-900 dark:text-white">
                      {benchmarkResults.recommendedModel.name}
                    </h4>
                    <p className="text-sm text-coffee-700 dark:text-coffee-300 leading-relaxed">
                      {benchmarkResults.recommendedModel.description}
                    </p>
                    <span className="inline-block px-2 py-1 bg-white/50 dark:bg-black/20 rounded text-xs font-mono text-coffee-600 dark:text-coffee-400">
                      Download Size: {benchmarkResults.recommendedModel.size}
                    </span>
                  </div>

                  {/* Installation Instructions */}
                  <div className="flex-1 flex flex-col justify-center space-y-3 p-4 bg-white/60 dark:bg-coffee-950/60 rounded-xl border border-coffee-300/30 dark:border-coffee-800/50">
                    <span className="text-xs font-medium text-coffee-600 dark:text-coffee-400">
                      1. Open your terminal
                    </span>
                    <span className="text-xs font-medium text-coffee-600 dark:text-coffee-400">
                      2. Run this command:
                    </span>
                    <div className="flex items-center gap-2 bg-coffee-900 dark:bg-black text-green-400 font-mono text-sm p-3 rounded-lg overflow-x-auto shadow-inner">
                      <span className="select-none text-coffee-500">$</span>
                      <code className="whitespace-nowrap select-all">
                        ollama run {benchmarkResults.recommendedModel.tag}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeSessionId && ollamaActive && models.length > 0 ? (
          /* ACTIVE CHAT INTERFACE */
          <ChatInterface model={selectedModel} sessionId={activeSessionId} />
        ) : (
          /* EMPTY STATE */
          <div className="flex-1 flex flex-col items-center justify-center text-coffee-400 dark:text-coffee-600 space-y-4">
            <Coffee size={48} className="opacity-50" />
            <p className="text-lg font-medium">
              Select a chat from the sidebar or start a new pour.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
