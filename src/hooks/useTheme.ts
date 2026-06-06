import { useMemo } from "react";

import { useTheme as useThemeContext } from "../providers/ThemeProvider";

export type ThemeOption = {
  label: string;
  value: "light" | "dark" | "system";
  description: string;
};

export const themeOptions: ThemeOption[] = [
  {
    label: "Light",
    value: "light",
    description: "Clean bright interface for daytime work.",
  },
  {
    label: "Dark",
    value: "dark",
    description: "Premium dark interface for focused work.",
  },
  {
    label: "System",
    value: "system",
    description: "Automatically follows your device preference.",
  },
];

export function useTheme() {
  return useThemeContext();
}

export function useThemeOptions() {
  const { theme, setTheme, resolvedTheme, toggleTheme, isDark } =
    useThemeContext();

  const currentThemeOption = useMemo(() => {
    return (
      themeOptions.find((option) => option.value === theme) ?? themeOptions[2]
    );
  }, [theme]);

  const nextThemeLabel = isDark ? "Light" : "Dark";

  return {
    theme,
    resolvedTheme,
    isDark,
    themeOptions,
    currentThemeOption,
    nextThemeLabel,
    setTheme,
    toggleTheme,
  };
}

export function useThemeClasses() {
  const { isDark, resolvedTheme } = useThemeContext();

  const classes = useMemo(() => {
    return {
      page: isDark
        ? "bg-[#050816] text-white"
        : "bg-slate-50 text-slate-950",

      card: isDark
        ? "border-white/10 bg-white/[0.04] text-white"
        : "border-slate-200 bg-white text-slate-950",

      mutedCard: isDark
        ? "border-white/10 bg-white/[0.03] text-slate-300"
        : "border-slate-200 bg-slate-50 text-slate-600",

      input: isDark
        ? "border-white/10 bg-white/5 text-white placeholder:text-slate-500"
        : "border-slate-200 bg-white text-slate-950 placeholder:text-slate-400",

      subtleText: isDark ? "text-slate-400" : "text-slate-500",

      strongText: isDark ? "text-white" : "text-slate-950",

      border: isDark ? "border-white/10" : "border-slate-200",

      glass: isDark
        ? "border-white/10 bg-slate-950/70 backdrop-blur-2xl"
        : "border-slate-200/70 bg-white/75 backdrop-blur-2xl",

      gradientText:
        "bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent",

      primaryButton:
        "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 text-white shadow-xl shadow-violet-500/20",

      secondaryButton: isDark
        ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
        : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
    };
  }, [isDark]);

  return {
    resolvedTheme,
    isDark,
    classes,
  };
}

export function useThemeIcon() {
  const { isDark } = useThemeContext();

  return {
    isDark,
    iconLabel: isDark ? "Switch to light mode" : "Switch to dark mode",
    iconName: isDark ? "sun" : "moon",
  };
}