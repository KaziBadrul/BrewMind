import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Lora, Merriweather } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora" });
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-merriweather",
});

export const metadata: Metadata = {
  title: "BrewMind",
  description: "Local Ollama client and PC Benchmarker",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${lora.variable} ${merriweather.variable}`}
    >
      <head>
        <Script id="appearance-bootstrap" strategy="beforeInteractive">
          {`
            (() => {
              try {
                const theme = localStorage.getItem("coffee-theme");
                const font = localStorage.getItem("coffee-font") || "geist";
                const root = document.documentElement;
                const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                const nextTheme =
                  theme === "light" || theme === "dark" || theme === "contrast"
                    ? theme
                    : prefersDark
                      ? "dark"
                      : "light";
                root.classList.toggle("dark", nextTheme !== "light");
                root.classList.toggle("contrast-theme", nextTheme === "contrast");
                root.style.colorScheme = nextTheme === "light" ? "light" : "dark";
                root.dataset.theme = nextTheme;
                root.dataset.font = font;
              } catch (error) {
                const root = document.documentElement;
                root.classList.add("dark");
                root.style.colorScheme = "dark";
                root.dataset.theme = "dark";
                root.dataset.font = "geist";
              }
            })();
          `}
        </Script>
      </head>
      <body className="antialiased bg-coffee-100 text-coffee-900 dark:bg-coffee-950 dark:text-coffee-100">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
