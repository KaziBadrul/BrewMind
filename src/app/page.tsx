"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  Coffee,
  Moon,
  Sun,
  MessageSquare,
  BarChart3,
  Settings,
  Cpu,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Download,
  Zap,
} from "lucide-react";
import { runGPUBenchmark } from "@/utils/gpuBenchmark";
import ChatInterface from "@/components/ChatInterface";
import Image from "next/image";

interface Model {
  name: string;
  size: number;
  parameterSize: string;
  family: string;
}

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"chat" | "benchmark">("chat");

  // Ollama Instance State
  const [ollamaActive, setOllamaActive] = useState<boolean | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);

  // Benchmarking State
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchmarkProgress, setBenchmarkProgress] = useState(0);
  const [hardwareTier, setHardwareTier] = useState<
    "low" | "mid" | "high" | null
  >(null);

  // Scan local machine for Ollama instances
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
        setActiveTab("benchmark"); // No models found? Push them to explore benchmarks
      }
    } catch {
      setOllamaActive(false);
      setModels([]);
      setActiveTab("benchmark");
    } finally {
      setIsScanning(false);
    }
  }, []);

  useEffect(() => {
    scanModels();
  }, [scanModels]);

  // Execute system performance diagnostic
  const runHardwareBenchmark = async () => {
    setBenchmarking(true);
    setBenchmarkProgress(10);

    await new Promise((resolve) => setTimeout(resolve, 100));

    // 1. Kick off the heavy GPU test phase
    setBenchmarkProgress(30);
    const gpuScore = await runGPUBenchmark();
    console.log("GPU Score:", gpuScore);

    // 2. CPU / Logical Processing capability check
    setBenchmarkProgress(70);
    const logicalProcessors = navigator.hardwareConcurrency || 4;

    await new Promise((resolve) => setTimeout(resolve, 300));
    setBenchmarkProgress(100);
    setBenchmarking(false);

    // 3. Final Calibration Logic based on real GPU speed thresholds
    if (gpuScore > 1200 || logicalProcessors >= 12) {
      // Dedicated modern GPU detected (RTX cards, Apple Silicon Pro/Max/Ultra)
      setHardwareTier("high");
    } else if (gpuScore > 400 || logicalProcessors >= 8) {
      // Integrated high-end graphics or mid-tier discrete GPU
      setHardwareTier("mid");
    } else {
      // Legacy hardware or basic mobile chipsets
      setHardwareTier("low");
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden p-4 gap-4 bg-coffee-100 dark:bg-coffee-950 transition-colors duration-300">
      {/* SIDEBAR */}
      <aside className="w-64 flex flex-col justify-between p-4 rounded-2xl bg-white/40 dark:bg-coffee-900/40 backdrop-blur-md border border-coffee-300/30 dark:border-coffee-800/30 shadow-sm">
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-coffee-900 text-coffee-50 dark:bg-coffee-800 shadow-md">
                {/* <Coffee size={20} /> */}
                <Image
                  width={30}
                  height={30}
                  src="/brewmind.png"
                  alt="BrewMind Logo"
                  className="object-contain hover:scale-110 transition-all duration-200"
                />
              </div>
              <div>
                <h1 className="font-bold tracking-tight text-coffee-900 dark:text-coffee-50">
                  BrewMind
                </h1>
                <p className="text-[11px] text-coffee-600/70 dark:text-coffee-400/70">
                  Your Local LLM Roastery
                </p>
              </div>
            </div>
            <button
              onClick={scanModels}
              disabled={isScanning}
              className={`p-1.5 rounded-lg hover:bg-coffee-200/50 dark:hover:bg-coffee-800/50 text-coffee-600 dark:text-coffee-400 ${isScanning ? "animate-spin" : ""}`}
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Model Status Indicator */}
          <div className="px-1">
            {ollamaActive && models.length > 0 ? (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold tracking-wider uppercase text-coffee-600/80 dark:text-coffee-400/80 flex items-center gap-1.5">
                  <Cpu size={12} /> Active Roast
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full text-sm py-2 px-3 rounded-xl bg-white/60 dark:bg-coffee-950/60 border border-coffee-300/40 dark:border-coffee-800/40 text-coffee-800 dark:text-coffee-200 focus:outline-none"
                >
                  {models.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name} ({m.parameterSize})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Ollama Offline</p>
                  <p className="text-[11px] opacity-80">
                    No coffee beans loaded yet.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <button
              onClick={() =>
                ollamaActive && models.length > 0 && setActiveTab("chat")
              }
              disabled={!ollamaActive || models.length === 0}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                !ollamaActive || models.length === 0
                  ? "opacity-40 cursor-not-allowed"
                  : ""
              } ${
                activeTab === "chat" && ollamaActive && models.length > 0
                  ? "bg-coffee-700 text-white shadow-sm dark:bg-coffee-600"
                  : "text-coffee-700 dark:text-coffee-300 hover:bg-coffee-200/50 dark:hover:bg-coffee-900/50"
              }`}
            >
              <MessageSquare size={18} />
              Chat Interface
            </button>
            <button
              onClick={() => setActiveTab("benchmark")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "benchmark"
                  ? "bg-coffee-700 text-white shadow-sm dark:bg-coffee-600"
                  : "text-coffee-700 dark:text-coffee-300 hover:bg-coffee-200/50 dark:hover:bg-coffee-900/50"
              }`}
            >
              <BarChart3 size={18} />
              PC Benchmark
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-coffee-300/20 dark:border-coffee-800/20">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-coffee-700 dark:text-coffee-300 hover:bg-coffee-200/50 dark:hover:bg-coffee-900/50 transition-colors"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="p-2.5 rounded-xl text-coffee-700 dark:text-coffee-300 hover:bg-coffee-200/50 dark:hover:bg-coffee-900/50 transition-colors">
            <Settings size={18} />
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col rounded-2xl overflow-hidden bg-white/60 dark:bg-coffee-900/20 backdrop-blur-xl border border-white/40 dark:border-coffee-800/20 shadow-xl relative">
        {activeTab === "chat" && ollamaActive && models.length > 0 ? (
          /* CHAT MODULE PLACEHOLDER */
          <ChatInterface model={selectedModel} />
        ) : (
          /* BENCHMARK / ONBOARDING ENGINE */
          <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-coffee-900 dark:text-coffee-50">
                System Roastery & Benchmark
              </h2>
              <p className="text-sm text-coffee-600 dark:text-coffee-400">
                Let's gauge your local processing hardware to calculate your
                ideal model recipe.
              </p>
            </div>

            {/* Benchmark Runner Box */}
            <div className="p-6 rounded-2xl bg-white/50 dark:bg-coffee-900/30 border border-coffee-300/20 dark:border-coffee-800/30 space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-coffee-800 dark:text-coffee-200 flex items-center gap-2">
                    <Zap size={18} className="text-amber-500" /> Hardware
                    Tasting Profile
                  </h3>
                  <p className="text-xs text-coffee-600 dark:text-coffee-400 mt-1">
                    Runs client diagnostics to verify threading speed and CPU
                    capabilities.
                  </p>
                </div>
                <button
                  onClick={runHardwareBenchmark}
                  disabled={benchmarking}
                  className="px-5 py-2.5 rounded-xl bg-coffee-700 hover:bg-coffee-800 text-white text-sm font-medium transition shadow-md disabled:opacity-50 dark:bg-coffee-600 dark:hover:bg-coffee-700"
                >
                  {benchmarking ? "Testing Beans..." : "Begin Diagnostic"}
                </button>
              </div>

              {/* Progress Line */}
              {benchmarking && (
                <div className="w-full bg-coffee-200 dark:bg-coffee-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-coffee-600 dark:bg-coffee-400 h-full transition-all duration-300 ease-out"
                    style={{ width: `${benchmarkProgress}%` }}
                  />
                </div>
              )}

              {/* Benchmark Results */}
              {hardwareTier && !benchmarking && (
                <div className="mt-4 p-4 rounded-xl bg-coffee-200/40 dark:bg-coffee-950/40 border border-coffee-400/20 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="text-xs font-semibold tracking-wider uppercase text-coffee-500">
                      Suggested Recipe
                    </span>
                    <h4 className="text-xl font-bold text-coffee-900 dark:text-coffee-50 mt-1 capitalize">
                      {hardwareTier === "high" &&
                        "Rich Double Espresso (8B - 14B Models)"}
                      {hardwareTier === "mid" &&
                        "Smooth Flat White (7B - 8B Models)"}
                      {hardwareTier === "low" &&
                        "Balanced Filter Brew (1B - 3B Models)"}
                    </h4>
                    <p className="text-xs text-coffee-600 dark:text-coffee-400 mt-2 leading-relaxed">
                      {hardwareTier === "high" &&
                        "Your system contains ample parallel architecture. You will run Llama 3.1 (8B) effortlessly, and you can comfortably venture into deeper 14B architectures."}
                      {hardwareTier === "mid" &&
                        "An ideal setup for standard models. Llama 3.1 (8B) and Qwen 2.5 VL (7B) are perfectly roasted matches for your balance of compute and thermal layout."}
                      {hardwareTier === "low" &&
                        "To prevent memory throttling and maintain fluid conversation flow, lightweight models like Llama 3.2 (1B/3B) or Qwen 2.5 (1.5B/3B) will provide a beautiful snappy experience."}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <span className="text-xs font-semibold tracking-wider uppercase text-coffee-500">
                      Recommended Next Steps
                    </span>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-coffee-700 dark:text-coffee-300">
                        <Download size={14} className="text-coffee-600" />
                        <span>
                          Run:{" "}
                          <code className="bg-coffee-300/40 px-1.5 py-0.5 rounded text-[11px]">
                            ollama run{" "}
                            {hardwareTier === "low"
                              ? "llama3.2:3b"
                              : "llama3.1:8b"}
                          </code>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-coffee-700 dark:text-coffee-300">
                        <ShieldCheck size={14} className="text-green-600" />
                        <span>
                          Hit the "Refresh" icon in the upper left corner once
                          installed!
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Setup Guide if Ollama is missing */}
            {!ollamaActive && (
              <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-4">
                <h3 className="font-semibold text-coffee-800 dark:text-coffee-200">
                  How to Setup Your Local Coffee Machine (Ollama)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-white/40 dark:bg-coffee-950/40 border border-coffee-300/20">
                    <span className="font-bold text-coffee-600 dark:text-coffee-400 block mb-1">
                      1. Download
                    </span>
                    Grab the free local runtime executable from{" "}
                    <a
                      href="https://ollama.com"
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-coffee-700 dark:text-coffee-400 font-medium"
                    >
                      ollama.com
                    </a>
                    .
                  </div>
                  <div className="p-4 rounded-xl bg-white/40 dark:bg-coffee-950/40 border border-coffee-300/20">
                    <span className="font-bold text-coffee-600 dark:text-coffee-400 block mb-1">
                      2. Run Instance
                    </span>
                    Keep the Ollama app running in your system tray or menu bar.
                  </div>
                  <div className="p-4 rounded-xl bg-white/40 dark:bg-coffee-950/40 border border-coffee-300/20">
                    <span className="font-bold text-coffee-600 dark:text-coffee-400 block mb-1">
                      3. Fire Up Roast
                    </span>
                    Open your command terminal and pull a model to kickstart
                    local hosting automatically.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
