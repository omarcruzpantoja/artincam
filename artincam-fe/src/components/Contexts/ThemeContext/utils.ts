import { createContext, useContext } from "react";
import { createTheme } from "@mui/material";

export type ThemeName = "light" | "dark";

export const LightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1976d2" },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
  },
  shape: { borderRadius: 10 },
});

export const DarkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#90caf9" },
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
  },
  shape: { borderRadius: 10 },
});

interface ThemeContextState {
  themeName: ThemeName;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextState | undefined>(
  undefined
);

export const useThemeController = () => {
  const ctx = useContext(ThemeContext);

  if (!ctx)
    throw new Error("useThemeController must be inside ThemeContextProvider");

  return ctx;
};
