import type React from "react";
import {
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
} from "@mui/material";
import { NavLink } from "react-router-dom";
import Dashboard from "@mui/icons-material/Dashboard";
import Videocam from "@mui/icons-material/Videocam";

type NavItem = {
  label: string;
  path: string;
  icon: React.ReactElement;
};

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/", icon: <Dashboard /> },
  {
    label: "Agents",
    path: "/agents",
    icon: <Videocam />,
  },
  // {
  //   label: "Schedules",
  //   path: "/schedules",
  //   icon: <Schedule />,
  // },
  // { label: "Logs", path: "/logs", icon: <ListAlt /> },
  // {
  //   label: "Settings",
  //   path: "/settings",
  //   icon: <Settings />,
  // },
  // {
  //   label: "About",
  //   path: "/about",
  //   icon: <HelpOutline />,
  // },
];

const Sidebar = (): React.JSX.Element => {
  return (
    <Box
      component={Paper}
      square
      elevation={2}
      sx={{
        width: 240,
        bgcolor: "background.paper",
        borderRight: 1,
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ---- USER INFO ---- */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Avatar sx={{ bgcolor: "primary.main", color: "#000" }}>AC</Avatar>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Artincam
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Control Center
          </Typography>
        </Box>
      </Box>

      {/* ---- NAVIGATION ---- */}
      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        <List dense>
          {navItems.map((item) => {
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);

            return (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  component={NavLink}
                  to={item.path}
                  selected={isActive}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Box>
  );
};

export default Sidebar;
