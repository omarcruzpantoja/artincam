import { useState, type ReactNode } from "react";
import { ThemeProvider, createTheme } from "@mui/material";

import { ThemeContext, DarkTheme, LightTheme, type ThemeName } from "./utils";

const ThemeContextProvider = ({ children }: { children: ReactNode }) => {
  const [themeName, setThemeName] = useState<ThemeName>("dark");

  const theme = createTheme(themeName === "dark" ? DarkTheme : LightTheme);

  const toggleTheme = (): void => {
    setThemeName((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ themeName, toggleTheme }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContextProvider;
