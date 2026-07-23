/**
 * useTheme hook.
 *
 * Purpose: Manage the light/dark theme by toggling the `dark` class on <html>
 *          and persisting the choice in localStorage. Defaults to dark.
 *
 * Output:  { theme, toggleTheme }.
 * Example: const { theme, toggleTheme } = useTheme();
 */
import { useEffect, useState } from "react";

type Theme = "dark" | "light";
const STORAGE_KEY = "portfolio_theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(STORAGE_KEY) as Theme) || "dark",
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  /** Purpose: Flip between dark and light. Output: void. */
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, toggleTheme };
}
