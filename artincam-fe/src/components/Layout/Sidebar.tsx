import React from "react";
import {
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
} from "@mui/material";
import { NavLink } from "react-router-dom";
import Dashboard from "@mui/icons-material/Dashboard";
import Videocam from "@mui/icons-material/Videocam";

import SidebarFooter from "./LayoutSidebar";

type NavItem = {
  label: string;
  path: string;
  icon: React.ReactElement;
  identifier: string;
};

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    path: "/",
    icon: <Dashboard />,
    identifier: "dashboard",
  },
  {
    label: "Agents",
    path: "/agents",
    icon: <Videocam />,
    identifier: "agentList",
  },
];

const SIDEBAR_WIDTH = 260;

const Sidebar = (): React.JSX.Element => {
  const theme = useTheme();

  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        borderRight: isDark
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid rgba(0,0,0,0.08)",
        bgcolor: isDark ? "rgba(18,18,18,0.55)" : "rgba(255,255,255,0.55)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      {/* ---- BRAND / APP INFO ---- */}
      <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
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

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, lineHeight: 1.1 }}
              noWrap
            >
              Artincam
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              Control Center
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider
        sx={{
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        }}
      />

      {/* ---- NAVIGATION ---- */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", p: 1 }}>
        <List dense sx={{ py: 0 }}>
          {navItems.map((item) => (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NavLink}
                to={item.path}
                // Let NavLink define active styles, no extra state needed
                sx={{
                  borderRadius: 2,
                  px: 1.25,
                  py: 1,
                  position: "relative",
                  color: "text.primary",
                  "& .MuiListItemIcon-root": {
                    minWidth: 40,
                    color: "text.secondary",
                  },
                  "&:hover": {
                    bgcolor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)",
                  },

                  // Active styling (NavLink adds `.active`)
                  "&.active": {
                    bgcolor: isDark
                      ? "rgba(25, 118, 210, 0.18)"
                      : "rgba(25, 118, 210, 0.10)",
                    border: isDark
                      ? "1px solid rgba(25, 118, 210, 0.35)"
                      : "1px solid rgba(25, 118, 210, 0.25)",
                    "& .MuiListItemIcon-root": {
                      color: isDark ? "rgba(255,255,255,0.90)" : "#1976d2",
                    },
                    "& .MuiListItemText-primary": {
                      fontWeight: 700,
                    },
                    // left accent bar
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      left: 8,
                      top: 10,
                      bottom: 10,
                      width: 3,
                      borderRadius: 999,
                      bgcolor: "#1976d2",
                      opacity: isDark ? 0.9 : 0.8,
                    },
                    pl: 2, // make room for the accent bar
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      <SidebarFooter />
    </Box>
  );
};

export default Sidebar;
