import React from "react";
import { AppBar, Toolbar, Typography, IconButton } from "@mui/material";
import DarkMode from "@mui/icons-material/DarkMode";
import LightMode from "@mui/icons-material/LightMode";

import { useThemeController } from "@components/Contexts/ThemeContext";

const Header = (): React.JSX.Element => {
  const { themeName, toggleTheme } = useThemeController();

  return (
    <AppBar
      position="static"
      elevation={1}
      color="transparent"
      sx={{
        backdropFilter: "blur(10px)",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Toolbar sx={{ minHeight: 56 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}></Typography>
        <IconButton onClick={toggleTheme}>
          {themeName === "dark" ? <LightMode /> : <DarkMode />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
