"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type FontChoice = "geist" | "inter" | "lora" | "merriweather";
export type { FontChoice };
export type AppTheme = Theme | "contrast";

const THEME_STORAGE_KEY = "coffee-theme";
const FONT_STORAGE_KEY = "coffee-font";

const DEFAULT_THEME: AppTheme = "dark";
const DEFAULT_FONT: FontChoice = "geist";

function getInitialTheme(): AppTheme {
  if (typeof window === "undefined") return DEFAULT_THEME;

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark" || savedTheme === "contrast") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getInitialFont(): FontChoice {
  if (typeof window === "undefined") return DEFAULT_FONT;

  const savedFont = localStorage.getItem(FONT_STORAGE_KEY);
  if (
    savedFont === "geist" ||
    savedFont === "inter" ||
    savedFont === "lora" ||
    savedFont === "merriweather"
  ) {
    return savedFont;
  }

  return DEFAULT_FONT;
}

const ThemeContext = createContext<
  | {
      theme: AppTheme;
      setTheme: (theme: AppTheme) => void;
      toggleTheme: () => void;
      font: FontChoice;
      setFont: (font: FontChoice) => void;
    }
  | undefined
>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>(getInitialTheme);
  const [font, setFont] = useState<FontChoice>(getInitialFont);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle("dark", theme !== "light");
    root.classList.toggle("contrast-theme", theme === "contrast");
    root.style.colorScheme = theme === "light" ? "light" : "dark";
    root.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.dataset.font = font;
    localStorage.setItem(FONT_STORAGE_KEY, font);
  }, [font]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, toggleTheme, font, setFont }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
