"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  User,
  Sparkles,
  Flame,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { fileToBase64, parseTextFile } from "@/utils/fileParser";
import { dbHelpers } from "@/utils/db";
import { ChatSession, Message } from "@/types/chat";
import { marked } from "marked";
import markedKatex from "marked-katex-extension";

// Import KaTeX CSS styles so symbols render perfectly
import "katex/dist/katex.min.css";

interface AttachedFile {
  name: string;
  type: string;
  data: string;
}

interface ChatInterfaceProps {
  model: string;
  sessionId: string;
  session: ChatSession | null;
}

const DEFAULT_MESSAGES: Message[] = [
  {
    role: "assistant",
    content:
      "Pour yourself a warm cup. Ready to analyze code, complex equations, or see some images?",
  },
];

export default function ChatInterface({
  model,
  sessionId,
  session,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(
    session?.messages?.length ? session.messages : DEFAULT_MESSAGES,
  );
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Configure marked with GFM and the KaTeX extension
  useEffect(() => {
    marked.setOptions({
      breaks: true,
      gfm: true,
    });
    // Inject the math compiler extension into the marked compiler instance
    marked.use(
      markedKatex({
        throwOnError: false,
        nonStandard: true, // Allows handling variations in delimiters smoothly
      }),
    );
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setMessages(session?.messages?.length ? session.messages : DEFAULT_MESSAGES);
  }, [sessionId, session]);

  useEffect(() => {
    if (!sessionId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      void dbHelpers.saveSession({
        ...(session ?? {
          id: sessionId,
          brewId: null,
          title: "New Pour",
          hoverDescription: "A fresh conversation.",
          messages: DEFAULT_MESSAGES,
          updatedAt: Date.now(),
        }),
        messages,
      });
    }, 300);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [messages, session, sessionId]);

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          const base64 = await fileToBase64(file);
          setAttachedFiles((prev) => [
            ...prev,
            {
              name: `pasted-image-${Date.now().toString().slice(-4)}.png`,
              type: "image",
              data: base64,
            },
          ]);
        }
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    for (const file of Array.from(e.target.files)) {
      if (file.type.startsWith("image/")) {
        const base64 = await fileToBase64(file);
        setAttachedFiles((prev) => [
          ...prev,
          { name: file.name, type: "image", data: base64 },
        ]);
      } else if (
        file.type === "text/plain" ||
        file.name.endsWith(".log") ||
        file.type === "application/pdf"
      ) {
        const textContent = await parseTextFile(file);
        setAttachedFiles((prev) => [
          ...prev,
          { name: file.name, type: "document", data: textContent },
        ]);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    inputRef.current?.focus();
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
    inputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachedFiles.length === 0) || isGenerating) return;

    let finalPromptContent = input;
    const imagesArray: string[] = [];

    attachedFiles.forEach((file) => {
      if (file.type === "image") {
        imagesArray.push(file.data);
      } else if (file.type === "document") {
        finalPromptContent += `\n\n[Attached File Content (${file.name}):]\n${file.data}`;
      }
    });

    const userMessage: Message = {
      role: "user",
      content:
        finalPromptContent.trim() ||
        `Analyzed ${attachedFiles.map((f) => f.name).join(", ")}`,
      ...(imagesArray.length > 0 && { images: imagesArray }),
    };

    const currentHistory = [...messages, userMessage];
    setMessages(currentHistory);
    setInput("");
    setAttachedFiles([]);
    setIsGenerating(true);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: currentHistory, model }),
      });

      if (!response.body) throw new Error("Readable stream missing.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const textChunk = decoder.decode(value);

        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: updated[lastIndex].content + textChunk,
          };
          return updated;
        });
      }
    } catch (err) {
      console.error("Streaming error:", err);
    } finally {
      setIsGenerating(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Subtitle Status Bar */}
      <div className="px-6 py-3 border-b border-coffee-300/20 dark:border-coffee-800/20 bg-white/20 dark:bg-coffee-950/20 flex items-center justify-between text-xs text-coffee-600 dark:text-coffee-400">
        <div className="flex items-center gap-2">
          <Flame size={14} className="text-coffee-600 dark:text-coffee-400" />
          <span>
            Extraction Engine:{" "}
            <strong className="font-semibold text-coffee-800 dark:text-coffee-200">
              {model}
            </strong>
          </span>
        </div>
        {isGenerating && (
          <span className="animate-pulse tracking-wide font-medium">
            Roasting data tokens...
          </span>
        )}
      </div>

      {/* Message Output Window */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-4 max-w-4xl mx-auto ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-9 h-9 rounded-xl bg-coffee-700 dark:bg-coffee-600 flex items-center justify-center text-white shadow-sm shrink-0 mt-1">
                <Sparkles size={16} />
              </div>
            )}

            <div
              className={`p-6 rounded-2xl max-w-[88%] shadow-md border space-y-4 ${
                msg.role === "user"
                  ? "bg-coffee-700 border-coffee-800 text-white dark:bg-coffee-800/90 dark:border-coffee-700/50"
                  : "bg-white/85 border-coffee-300/40 text-coffee-900 dark:bg-coffee-900/50 dark:border-coffee-800/40 dark:text-coffee-100 backdrop-blur-md"
              }`}
            >
              {msg.images && msg.images.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-2">
                  {msg.images.map((img, imgIdx) => (
                    <img
                      key={imgIdx}
                      src={img}
                      alt="Uploaded payload context"
                      className="max-h-48 rounded-lg object-cover border border-white/20 shadow-sm"
                    />
                  ))}
                </div>
              )}

              {/* Enhanced High-Contrast Cozy Typography & Math Container */}
              <div
                className={`text-[16px] md:text-[17px] leading-relaxed break-words space-y-4 tracking-wide
                  ${msg.role === "user" ? "[&_code]:bg-coffee-800/90 [&_code]:text-coffee-100" : "[&_code]:bg-coffee-200/90 dark:[&_code]:bg-coffee-950/90 text-coffee-900 dark:text-coffee-100 [&_code]:text-amber-800 dark:[&_code]:text-amber-400"}
                  
                  /* Math adjustments to fit comfortably in your color themes */
                  [&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex]:text-[1.05em]
                  
                  [&_strong]:font-bold ${msg.role === "user" ? "[&_strong]:text-white" : "[&_strong]:text-coffee-950 dark:[&_strong]:text-amber-100"}
                  [&_h1]:text-3xl [&_h1]:font-black [&_h1]:pt-3 [&_h1]:pb-1 [&_h1]:text-coffee-950 dark:[&_h1]:text-white
                  [&_h2]:text-2xl [&_h2]:font-black [&_h2]:pt-3 [&_h2]:pb-1 [&_h2]:text-coffee-900 dark:[&_h2]:text-amber-50
                  [&_h3]:text-xl [&_h3]:font-extrabold [&_h3]:pt-2 [&_h3]:text-coffee-800 dark:[&_h3]:text-amber-100
                  [&_pre]:bg-[#170e0a] dark:[&_pre]:bg-black/75 [&_pre]:p-5 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:my-4 [&_pre]:border [&_pre]:border-coffee-900/40 dark:[&_pre]:border-coffee-800/40 [&_pre]:shadow-inner
                  [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-orange-100/90 dark:[&_pre_code]:text-coffee-100 [&_pre_code]:text-[14.5px] [&_pre_code]:leading-relaxed
                  [&_code]:px-2 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:font-mono [&_code]:text-[14.5px] [&_code]:mx-0.5
                  [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:space-y-1`}
                dangerouslySetInnerHTML={{
                  __html: marked.parse(msg.content || "..."),
                }}
              />
            </div>

            {msg.role === "user" && (
              <div className="w-9 h-9 rounded-xl bg-white/60 dark:bg-coffee-900/60 border border-coffee-300/30 dark:border-coffee-800/40 flex items-center justify-center text-coffee-700 dark:text-coffee-300 shadow-sm shrink-0 mt-1">
                <User size={16} />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="p-4 bg-gradient-to-t from-white/60 dark:from-coffee-950/40 to-transparent space-y-2">
        {attachedFiles.length > 0 && (
          <div className="max-w-3xl mx-auto flex flex-wrap gap-2 p-2 rounded-xl bg-white/40 dark:bg-coffee-900/40 border border-coffee-300/20 backdrop-blur-sm">
            {attachedFiles.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-white/80 dark:bg-coffee-950 text-xs px-2.5 py-1.5 rounded-lg border border-coffee-300/30 dark:border-coffee-800/50 text-coffee-800 dark:text-coffee-200 shadow-sm"
              >
                {file.type === "image" ? (
                  <ImageIcon size={14} className="text-amber-600" />
                ) : (
                  <FileText size={14} className="text-blue-500" />
                )}
                <span className="max-w-[120px] truncate font-medium">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachedFile(i)}
                  className="text-coffee-400 hover:text-coffee-600 dark:hover:text-coffee-200"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex items-center gap-2 p-1.5 rounded-2xl bg-white/70 dark:bg-coffee-900/60 border border-coffee-300/40 dark:border-coffee-800/40 shadow-md backdrop-blur-md focus-within:ring-1 focus-within:ring-coffee-400"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*,text/plain,.log,application/pdf"
            className="hidden"
          />

          <button
            type="button"
            disabled={isGenerating}
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl text-coffee-600 dark:text-coffee-400 hover:bg-coffee-200/50 dark:hover:bg-coffee-800/50 transition"
          >
            <Paperclip size={16} />
          </button>

          <input
            type="text"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={handlePaste}
            placeholder={
              attachedFiles.length > 0
                ? "Describe or ask questions about these uploads..."
                : `Message ${model}...`
            }
            className="flex-1 bg-transparent px-2 text-base text-coffee-900 dark:text-coffee-100 placeholder-coffee-400 focus:outline-none disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={
              (!input.trim() && attachedFiles.length === 0) || isGenerating
            }
            className="p-2.5 rounded-xl bg-coffee-700 hover:bg-coffee-800 dark:bg-coffee-600 dark:hover:bg-coffee-700 text-white font-medium transition disabled:opacity-30 shadow-sm"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
