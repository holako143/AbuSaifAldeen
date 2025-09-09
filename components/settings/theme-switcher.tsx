"use client"

import { useTheme } from "next-themes"

const themes = [
  { name: "Light", value: "light", colors: { bg: "hsl(0 0% 100%)", fg: "hsl(0 0% 3.9%)" } },
  { name: "Dark", value: "dark", colors: { bg: "hsl(0 0% 3.9%)", fg: "hsl(0 0% 98%)" } },
  { name: "Rose", value: "theme-rose", colors: { bg: "hsl(350 100% 98%)", fg: "hsl(346.8 77.2% 49.8%)" } },
  { name: "Blue", value: "theme-blue", colors: { bg: "hsl(210 100% 98%)", fg: "hsl(221.2 83.2% 53.3%)" } },
  { name: "Green", value: "theme-green", colors: { bg: "hsl(140 80% 98%)", fg: "hsl(142.1 76.2% 36.3%)" } },
  { name: "Orange", value: "theme-orange", colors: { bg: "hsl(25 100% 98%)", fg: "hsl(25 95% 53%)" } },
  { name: "Purple", value: "theme-purple", colors: { bg: "hsl(270 100% 98%)", fg: "hsl(270 95% 53%)" } },
  { name: "Matrix", value: "theme-matrix", colors: { bg: "hsl(240 10% 3.9%)", fg: "hsl(130 100% 50%)" } },
];

export function ThemeSwitcher() {
  const { setTheme, theme: activeTheme } = useTheme()

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {themes.map((theme) => (
        <div
          key={theme.value}
          className={`cursor-pointer rounded-md border-2 p-1 ${activeTheme === theme.value ? "border-primary" : "border-muted"}`}
          onClick={() => setTheme(theme.value)}
        >
          <div className="space-y-2 rounded-sm bg-slate-50 p-2 dark:bg-slate-800">
            <div className="space-y-1.5 rounded-md p-2" style={{ backgroundColor: theme.colors.bg }}>
              <div className="h-2 w-10 rounded-lg" style={{ backgroundColor: theme.colors.fg }} />
              <div className="h-2 w-16 rounded-lg" style={{ backgroundColor: theme.colors.fg }} />
            </div>
          </div>
          <span className="block w-full p-2 text-center font-normal">{theme.name}</span>
        </div>
      ))}
    </div>
  )
}
