"use client"

import { ThemePreview } from "@/components/theme-preview";

export default function ThemesPage() {

  const themes = [
    "light",
    "dark",
    "orange",
    "blue",
    "green",
    "rose",
    "purple",
    "matrix",
    "cyberpunk",
    "ocean",
    "forest",
  ];

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-6">Select a Theme</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {themes.map((themeName) => (
          <ThemePreview key={themeName} themeName={themeName} />
        ))}
      </div>
    </div>
  );
}
