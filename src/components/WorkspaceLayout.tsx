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
  Zap,
} from "lucide-react";
import ChatInterface from "@/components/ChatInterface";
import { dbHelpers } from "@/utils/db";
import { BrewProject, ChatSession } from "@/types/chat";
import { runComprehensiveBenchmark, BenchmarkResults } from "@/utils/benchmark";
import Image from "next/image";
import type { FontChoice } from "@/context/ThemeContext";
interface Model {
  name: string;
  size: number;
  parameterSize: string;
  family: string;
}

export default function WorkspaceLayout() {
  const { theme, setTheme, toggleTheme, font, setFont } = useTheme();
  const isContrast = theme === "contrast";
  const shellSurface = isContrast
    ? "bg-zinc-950/95 border-zinc-800/80 text-zinc-100 shadow-black/30"
    : "bg-white/40 dark:bg-coffee-900/40 backdrop-blur-md border border-coffee-300/30 dark:border-coffee-800/30 shadow-sm";
  const innerSurface = isContrast
    ? "bg-zinc-900/90 border-zinc-800/70 text-zinc-100"
    : "bg-white/60 dark:bg-coffee-900/30 border border-coffee-300/20 dark:border-coffee-800/30";
  // --- DATABASE STATE ---
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [brews, setBrews] = useState<BrewProject[]>([]);
  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);

  // --- OLLAMA & BENCHMARK STATE ---
  const [viewMode, setViewMode] = useState<"chat" | "benchmark" | "project">(
    "chat",
  );
  const [activeBrewId, setActiveBrewId] = useState<string | null>(null);
  const [ollamaActive, setOllamaActive] = useState<boolean | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchmarkProgress, setBenchmarkProgress] = useState(0);
  const [benchmarkPhase, setBenchmarkPhase] = useState("");
  const [benchmarkResults, setBenchmarkResults] =
    useState<BenchmarkResults | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const fontOptions: Array<{ value: FontChoice; label: string }> = [
    { value: "geist", label: "Geist" },
    { value: "inter", label: "Inter" },
    { value: "lora", label: "Lora" },
    { value: "merriweather", label: "Merriweather" },
  ];

  useEffect(() => {
    const savedSessionId = localStorage.getItem("brewmind-active-session");
    if (savedSessionId) {
      setActiveSessionId(savedSessionId);
    }
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem("brewmind-active-session", activeSessionId);
    } else {
      localStorage.removeItem("brewmind-active-session");
    }
  }, [activeSessionId]);

  useEffect(() => {
    if (activeBrewId) {
      localStorage.setItem("brewmind-active-brew", activeBrewId);
    } else {
      localStorage.removeItem("brewmind-active-brew");
    }
  }, [activeBrewId]);

  useEffect(() => {
    if (
      activeSessionId &&
      recentChats.length > 0 &&
      !recentChats.some((chat) => chat.id === activeSessionId)
    ) {
      setActiveSessionId(null);
    }
  }, [activeSessionId, recentChats]);

  // --- 1. LOAD LOCAL DB DATA ---
  const loadWorkspaceData = async () => {
    const loadedBrews = await dbHelpers.getAllBrews();
    const loadedChats = await dbHelpers.getAllSessions();
    setBrews(loadedBrews);
    setRecentChats(loadedChats);
  };

  const handleSessionUpdated = useCallback((updatedSession: ChatSession) => {
    setRecentChats((current) =>
      [...current]
        .map((chat) => (chat.id === updatedSession.id ? updatedSession : chat))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    );
  }, []);

  useEffect(() => {
    loadWorkspaceData();
  }, []);

  useEffect(() => {
    const savedBrewId = localStorage.getItem("brewmind-active-brew");
    if (savedBrewId) {
      setActiveBrewId(savedBrewId);
      setViewMode("project");
    }
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
  const handleNewChat = async (brewId: string | null = activeBrewId) => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      brewId,
      title: "New Pour",
      hoverDescription: "A fresh conversation.",
      messages: [
        {
          role: "assistant",
          content:
            "Pour yourself a warm cup. Ready to analyze code, complex equations, or see some images?",
        },
      ],
      updatedAt: Date.now(),
    };

    await dbHelpers.saveSession(newSession);
    setActiveSessionId(newSession.id);
    setViewMode("chat");
    await loadWorkspaceData();
  };

  const handleOpenProject = async (brewId: string) => {
    setActiveBrewId(brewId);
    setActiveSessionId(null);
    setViewMode("project");
  };

  const activeBrew = brews.find((brew) => brew.id === activeBrewId) ?? null;
  const activeBrewSessions = recentChats
    .filter((chat) => chat.brewId === activeBrewId)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await dbHelpers.deleteSession(id);
    if (activeSessionId === id) setActiveSessionId(null);
    await loadWorkspaceData();
  };

  const handleRenameChat = async (chat: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextTitle = window.prompt("Rename chat", chat.title)?.trim();
    if (!nextTitle) return;

    const updatedSession: ChatSession = {
      ...chat,
      title: nextTitle,
      hoverDescription:
        nextTitle.length > 90 ? `${nextTitle.slice(0, 87)}...` : nextTitle,
      updatedAt: Date.now(),
    };

    await dbHelpers.saveSession(updatedSession);
    handleSessionUpdated(updatedSession);
  };

  return (
    <div
      className={`relative isolate flex h-screen w-full overflow-hidden scrollbar-thin transition-colors duration-300 p-4 gap-4 ${isContrast ? "bg-black text-zinc-100" : "bg-coffee-100 dark:bg-coffee-950"}`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="brew-ambient-orb absolute -left-20 top-10 h-72 w-72 rounded-full bg-amber-300/20 dark:bg-amber-500/10" />
        <div
          className="brew-ambient-orb absolute right-8 top-24 h-96 w-96 rounded-full bg-coffee-300/25 dark:bg-coffee-700/20"
          style={{ animationDelay: "1.8s" }}
        />
        <div
          className="brew-ambient-orb absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-orange-200/20 dark:bg-orange-900/15"
          style={{ animationDelay: "3.2s" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(111,78,55,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(111,78,55,0.05)_1px,transparent_1px)] bg-[size:56px_56px] opacity-30 dark:opacity-15" />
      </div>

      {/* --- SIDEBAR --- */}
      <aside
        className={`relative z-10 w-72 flex flex-col justify-between p-4 rounded-2xl brew-fade-up ${shellSurface}`}
      >
        {/* Top Section: Header & Workspace */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div
            className={`flex items-center justify-between pb-4 ${isContrast ? "border-b border-zinc-800/70" : "border-b border-coffee-300/20 dark:border-coffee-800/20"}`}
          >
            <div className="flex items-center gap-3">
              <div className="brew-glow p-2 rounded-xl bg-coffee-900 text-coffee-50 dark:bg-coffee-800 shadow-md">
                <Image
                  src={isContrast ? "/brewmind_contrast.png" : "/brewmind.png"}
                  alt="BrewMind Logo"
                  width={24}
                  height={24}
                  className="hover:scale-110 transition-transform duration-300"
                />
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
              onClick={() => handleNewChat()}
              className="p-2 rounded-lg bg-coffee-800 text-white hover:bg-coffee-900 dark:bg-amber-600 dark:hover:bg-amber-500 transition shadow-sm hover:scale-105 active:scale-95"
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
                  onClick={() => handleOpenProject(brew.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-coffee-200/50 dark:hover:bg-coffee-900/50 text-coffee-800 dark:text-coffee-200 transition group text-left hover:-translate-y-0.5 hover:shadow-sm ${
                    activeBrewId === brew.id
                      ? "bg-coffee-200/70 dark:bg-coffee-800/70"
                      : ""
                  }`}
                >
                  <FolderGit2
                    size={16}
                    className="text-amber-700 dark:text-amber-500 opacity-80 shrink-0"
                  />
                  <span className="text-sm font-medium truncate flex-1">
                    {brew.name}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                    Open
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
                  className={`group relative w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer hover:-translate-y-0.5 hover:shadow-sm ${
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
                    <button
                      onClick={(e) => handleRenameChat(chat, e)}
                      className="p-1 hover:text-amber-600 dark:hover:text-amber-400"
                    >
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
                  className={`w-full text-xs py-1.5 px-2 rounded-lg border focus:outline-none ${
                    isContrast
                      ? "bg-zinc-950 border-zinc-800 text-zinc-100"
                      : "bg-white/60 dark:bg-coffee-950/60 border-coffee-300/40 dark:border-coffee-800/40 text-coffee-800 dark:text-coffee-200"
                  }`}
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
              className={`p-2 ml-2 rounded-lg hover:bg-coffee-200/50 dark:hover:bg-coffee-800/50 text-coffee-600 dark:text-coffee-400 transition-transform ${isScanning ? "animate-spin" : "hover:scale-105"}`}
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
            <div className="relative flex gap-1 ml-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-coffee-700 dark:text-coffee-300 hover:bg-coffee-200/50 dark:hover:bg-coffee-900/50 transition-colors"
                aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              <button
                onClick={() => setIsSettingsOpen((open) => !open)}
                className={`p-2 rounded-xl text-coffee-700 dark:text-coffee-300 hover:bg-coffee-200/50 dark:hover:bg-coffee-900/50 transition-colors ${isSettingsOpen ? "bg-coffee-200/60 dark:bg-coffee-800/50" : ""}`}
                aria-label="Open appearance settings"
                aria-expanded={isSettingsOpen}
              >
                <Settings size={16} />
              </button>
              {isSettingsOpen && (
                <div
                  className={`absolute bottom-12 right-0 z-20 w-64 rounded-2xl backdrop-blur-md shadow-xl p-3 space-y-4 ${isContrast ? "bg-zinc-950/95 border border-zinc-800/70 text-zinc-100" : "border border-coffee-300/40 dark:border-coffee-800/40 bg-white/95 dark:bg-coffee-950/95"}`}
                >
                  <div>
                    <p className="text-[10px] font-semibold tracking-wider uppercase text-coffee-500 dark:text-coffee-400 mb-2">
                      Theme
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          setTheme("light");
                          setIsSettingsOpen(false);
                        }}
                        className={`rounded-xl px-3 py-2 text-xs font-medium border transition ${
                          theme === "light"
                            ? "bg-coffee-700 text-white border-coffee-700 dark:bg-coffee-600 dark:border-coffee-600"
                            : "bg-transparent border-coffee-300/60 text-coffee-700 dark:text-coffee-200 dark:border-coffee-800/60 hover:bg-coffee-100 dark:hover:bg-coffee-900/50"
                        }`}
                      >
                        Light
                      </button>
                      <button
                        onClick={() => {
                          setTheme("dark");
                          setIsSettingsOpen(false);
                        }}
                        className={`rounded-xl px-3 py-2 text-xs font-medium border transition ${
                          theme === "dark"
                            ? "bg-coffee-700 text-white border-coffee-700 dark:bg-coffee-600 dark:border-coffee-600"
                            : "bg-transparent border-coffee-300/60 text-coffee-700 dark:text-coffee-200 dark:border-coffee-800/60 hover:bg-coffee-100 dark:hover:bg-coffee-900/50"
                        }`}
                      >
                        Dark
                      </button>
                      <button
                        onClick={() => {
                          setTheme("contrast");
                          setIsSettingsOpen(false);
                        }}
                        className={`rounded-xl px-3 py-2 text-xs font-medium border transition ${
                          theme === "contrast"
                            ? "bg-black text-white border-black"
                            : "bg-transparent border-coffee-300/60 text-coffee-700 dark:text-coffee-200 dark:border-coffee-800/60 hover:bg-coffee-100 dark:hover:bg-coffee-900/50"
                        }`}
                      >
                        Contrast
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold tracking-wider uppercase text-coffee-500 dark:text-coffee-400 mb-2 block">
                      Font
                    </label>
                    <select
                      value={font}
                      onChange={(e) => {
                        setFont(e.target.value as FontChoice);
                        setIsSettingsOpen(false);
                      }}
                      className="w-full text-xs py-2 px-3 rounded-xl bg-white dark:bg-coffee-950 border border-coffee-300/60 dark:border-coffee-800/60 text-coffee-800 dark:text-coffee-100 focus:outline-none"
                    >
                      {fontOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN VIEWPORT --- */}
      <main
        className={`relative z-10 flex-1 flex flex-col rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl ${isContrast ? "bg-zinc-950/90 border border-zinc-800/70 text-zinc-100" : "bg-white/60 dark:bg-coffee-900/20 border border-white/40 dark:border-coffee-800/20"}`}
      >
        {viewMode === "benchmark" ? (
          /* BENCHMARK / ONBOARDING ENGINE */
          // {/* Benchmark Runner Box */}
          <div
            className={`brew-fade-up m-6 p-6 rounded-2xl space-y-6 ${innerSurface}`}
          >
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
                className="px-5 py-2.5 rounded-xl bg-coffee-700 hover:bg-coffee-800 text-white text-sm font-medium transition shadow-md disabled:opacity-50 dark:bg-coffee-600 dark:hover:bg-coffee-700 w-48 hover:scale-[1.02] active:scale-[0.98]"
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
              <div className="mt-6 space-y-6 brew-fade-up">
                {/* Hardware Scores */}
                <div className="grid grid-cols-3 gap-4">
                  <div
                    className={`brew-pop p-4 rounded-xl ${isContrast ? "bg-zinc-900 border border-zinc-800" : "bg-coffee-100 dark:bg-coffee-950/50 border border-coffee-200 dark:border-coffee-800/50"}`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-coffee-500">
                      CPU Score
                    </span>
                    <p className="text-2xl font-mono text-coffee-900 dark:text-white">
                      {benchmarkResults.cpuScore.toLocaleString()}
                    </p>
                  </div>
                  <div
                    className={`brew-pop p-4 rounded-xl ${isContrast ? "bg-zinc-900 border border-zinc-800" : "bg-coffee-100 dark:bg-coffee-950/50 border border-coffee-200 dark:border-coffee-800/50"}`}
                    style={{ animationDelay: "90ms" }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-coffee-500">
                      GPU Score
                    </span>
                    <p className="text-2xl font-mono text-coffee-900 dark:text-white">
                      {benchmarkResults.gpuScore.toLocaleString()}
                    </p>
                  </div>
                  <div
                    className={`brew-pop p-4 rounded-xl ${isContrast ? "bg-zinc-900 border border-zinc-800" : "bg-coffee-100 dark:bg-coffee-950/50 border border-coffee-200 dark:border-coffee-800/50"}`}
                    style={{ animationDelay: "180ms" }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-coffee-500">
                      Est. Base RAM
                    </span>
                    <p className="text-2xl font-mono text-coffee-900 dark:text-white">
                      {benchmarkResults.memoryEstimate} GB+
                    </p>
                  </div>
                </div>

                {/* Recommendation Engine */}
                <div
                  className={`brew-fade-up p-5 rounded-xl flex flex-col md:flex-row gap-6 ${isContrast ? "bg-zinc-900 border border-zinc-800" : "bg-amber-500/10 border border-amber-500/20"}`}
                >
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
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-mono ${isContrast ? "bg-zinc-950 border border-zinc-800 text-zinc-300" : "bg-white/50 dark:bg-black/20 text-coffee-600 dark:text-coffee-400"}`}
                    >
                      Download Size: {benchmarkResults.recommendedModel.size}
                    </span>
                  </div>

                  {/* Installation Instructions */}
                  <div
                    className={`flex-1 flex flex-col justify-center space-y-3 p-4 rounded-xl ${isContrast ? "bg-zinc-950 border border-zinc-800" : "bg-white/60 dark:bg-coffee-950/60 border border-coffee-300/30 dark:border-coffee-800/50"}`}
                  >
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
          <ChatInterface
            model={selectedModel}
            sessionId={activeSessionId}
            session={
              recentChats.find((chat) => chat.id === activeSessionId) ?? null
            }
            onSessionUpdated={handleSessionUpdated}
            theme={theme}
          />
        ) : viewMode === "project" && activeBrew ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-4xl space-y-6">
              <div
                className={`brew-fade-up p-6 rounded-2xl shadow-sm ${isContrast ? "bg-zinc-950 border border-zinc-800" : "bg-white/60 dark:bg-coffee-900/30 border border-coffee-300/20 dark:border-coffee-800/30"}`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider">
                      <FolderGit2 size={14} /> Project
                    </div>
                    <h2 className="text-2xl font-bold text-coffee-900 dark:text-white">
                      {activeBrew.name}
                    </h2>
                    <p className="text-sm text-coffee-700 dark:text-coffee-300 max-w-2xl">
                      {activeBrew.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleNewChat(activeBrew.id)}
                      className="px-4 py-2 rounded-xl bg-coffee-700 hover:bg-coffee-800 text-white text-sm font-medium transition shadow-md dark:bg-coffee-600 dark:hover:bg-coffee-700"
                    >
                      New Project Chat
                    </button>
                    <button
                      onClick={() => setViewMode("chat")}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium ${isContrast ? "bg-zinc-950 border-zinc-800 text-zinc-100" : "bg-white/60 dark:bg-coffee-950/60 border-coffee-300/40 dark:border-coffee-800/40 text-coffee-800 dark:text-coffee-200"}`}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>

              <div
                className={`brew-fade-up p-6 rounded-2xl shadow-sm space-y-4 ${isContrast ? "bg-zinc-950 border border-zinc-800" : "bg-white/60 dark:bg-coffee-900/30 border border-coffee-300/20 dark:border-coffee-800/30"}`}
              >
                <h3 className="font-semibold text-coffee-800 dark:text-coffee-200">
                  Project Chats
                </h3>
                {activeBrewSessions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-coffee-300/50 dark:border-coffee-800/50 p-6 text-coffee-600 dark:text-coffee-400 text-sm">
                    No chats in this project yet. Start a new project chat to
                    begin.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeBrewSessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => {
                          setActiveSessionId(session.id);
                          setViewMode("chat");
                        }}
                        className={`w-full flex items-center justify-between gap-4 px-4 py-3 rounded-xl border text-left transition ${isContrast ? "bg-zinc-950/90 border-zinc-800 hover:bg-zinc-900" : "bg-white/60 dark:bg-coffee-950/50 border-coffee-300/30 dark:border-coffee-800/50 hover:bg-coffee-200/50 dark:hover:bg-coffee-900/60"}`}
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-coffee-900 dark:text-white truncate">
                            {session.title}
                          </p>
                          <p className="text-xs text-coffee-600 dark:text-coffee-400 truncate">
                            {session.hoverDescription}
                          </p>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-coffee-500 dark:text-coffee-400 shrink-0">
                          Open
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* EMPTY STATE */
          <div
            className={`flex-1 flex flex-col items-center justify-center space-y-4 brew-fade-up ${isContrast ? "text-zinc-400" : "text-coffee-400 dark:text-coffee-600"}`}
          >
            <Coffee size={48} className="opacity-50 brew-glow" />
            <p className="text-lg font-medium">
              Select a chat from the sidebar or start a new pour.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
