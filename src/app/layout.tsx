// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

// Metadata
export const metadata: Metadata = {
  title: "Bitcoin DA Simulator - Retro Edition",
  description:
    "Simulate Bitcoin as a Data Availability layer for Starknet with a retro arcade theme",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="nes-container is-dark" style={{ margin: "1rem" }}>
          <h1 style={{ textAlign: "center", fontSize: "1.2rem" }}>
            {/* A pixel-art style "logo" text */}
            Bitcoin DA Throughput Simulator
          </h1>
        </header>
        {children}
        <footer
          style={{
            textAlign: "center",
            marginTop: "2rem",
            padding: "1rem",
            fontSize: "0.75rem",
            color: "#888",
          }}
        >
          © {new Date().getFullYear()} Bitcoin DA Simulator • Retro Edition
        </footer>
      </body>
    </html>
  );
}
