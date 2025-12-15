import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  IconButton,
  useTheme,
} from "@mui/material";
import DarkMode from "@mui/icons-material/DarkMode";
import LightMode from "@mui/icons-material/LightMode";

import { useThemeController } from "@components/Contexts/ThemeContext";

const Header = (): React.JSX.Element => {
  const { themeName, toggleTheme } = useThemeController();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

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

        <IconButton>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
              border: isDark
                ? "1px solid rgba(255,255,255,0.10)"
                : "1px solid rgba(0,0,0,0.08)",
            }}
            variant="rounded"
          >
            <img
              src="/artincam-fav.svg"
              width="26"
              height="26"
              style={{ display: "block" }}
              alt="Artincam"
            />
          </Avatar>
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
