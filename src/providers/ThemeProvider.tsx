import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";

type ResolvedTheme = "light" | "dark";

type ThemeProviderContext = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
};

const THEME_STORAGE_KEY = "quickai-theme";

const ThemeContext = createContext<ThemeProviderContext | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredTheme(storageKey: string, defaultTheme: Theme): Theme {
  if (typeof window === "undefined") return defaultTheme;

  const storedTheme = window.localStorage.getItem(storageKey) as Theme | null;

  if (
    storedTheme === "light" ||
    storedTheme === "dark" ||
    storedTheme === "system"
  ) {
    return storedTheme;
  }

  return defaultTheme;
}

function applyThemeToDocument(resolvedTheme: ResolvedTheme) {
  const root = window.document.documentElement;

  root.classList.remove("light", "dark");
  root.classList.add(resolvedTheme);

  root.style.colorScheme = resolvedTheme;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() =>
    getStoredTheme(storageKey, defaultTheme),
  );

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const initialTheme = getStoredTheme(storageKey, defaultTheme);

    return initialTheme === "system" ? getSystemTheme() : initialTheme;
  });

  useEffect(() => {
    const rootTheme = theme === "system" ? getSystemTheme() : theme;

    setResolvedTheme(rootTheme);
    applyThemeToDocument(rootTheme);
    window.localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function handleSystemThemeChange() {
      const nextTheme = getSystemTheme();

      setResolvedTheme(nextTheme);
      applyThemeToDocument(nextTheme);
    }

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [theme]);

  const value = useMemo<ThemeProviderContext>(() => {
    function setTheme(nextTheme: Theme) {
      setThemeState(nextTheme);
    }

    function toggleTheme() {
      setThemeState((currentTheme) => {
        const currentResolvedTheme =
          currentTheme === "system" ? getSystemTheme() : currentTheme;

        return currentResolvedTheme === "dark" ? "light" : "dark";
      });
    }

    return {
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      isDark: resolvedTheme === "dark",
    };
  }, [theme, resolvedTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }

  return context;
}