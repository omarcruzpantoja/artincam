import { useMemo, type HTMLAttributeAnchorTarget } from "react";
import {
  Avatar,
  Box,
  IconButton,
  List,
  Toolbar,
  Typography,
  type SxProps,
} from "@mui/material";
import { useSettingsContext } from "@providers/SettingsProvider";
import NavItem from "./NavItem";
import SidenavSimpleBar from "./SidenavSimpleBar";
import IconifyIcon from "@components/base/IconifyIcon";
import SidenavFooter from "./SidenavFooter";

interface SidenavDrawerContentProps {
  variant?: "permanent" | "temporary";
}

export interface SubMenuItem {
  name: string;
  pathName: string;
  key?: string;
  selectionPrefix?: string;
  path: string;
  target?: HTMLAttributeAnchorTarget;
  active?: boolean;
  icon?: string;
  iconSx?: SxProps;
  items?: SubMenuItem[];
}

export interface MenuItem {
  id: string;
  key?: string; // used for the locale
  subheader?: string;
  icon: string;
  target?: HTMLAttributeAnchorTarget;
  iconSx?: SxProps;
  items: SubMenuItem[];
}

const routes: MenuItem[] = [
  {
    id: "pages",
    icon: "material-symbols:view-quilt-outline",
    items: [
      {
        name: "Dashboard",
        path: "/",
        pathName: "dashboard",
        icon: "material-symbols:query-stats-rounded",
        active: true,
      },
      {
        name: "Agents",
        path: "/agents",
        pathName: "agents",
        icon: "material-symbols:photo-camera-rounded",
        active: true,
      },
    ],
  },
];

const SidenavDrawerContent = ({
  variant = "permanent",
}: SidenavDrawerContentProps) => {
  const {
    config: { sidenavCollapsed, openNavbarDrawer },
    setConfig,
  } = useSettingsContext();

  const expanded = useMemo(
    () =>
      variant === "temporary" || (variant === "permanent" && !sidenavCollapsed),
    [sidenavCollapsed]
  );

  const toggleNavbarDrawer = () => {
    setConfig({
      openNavbarDrawer: !openNavbarDrawer,
    });
  };

  return (
    <>
      <Toolbar variant="appbar" sx={{ display: "block", px: { xs: 0 } }}>
        <Box
          sx={[
            {
              paddingTop: 4,
              height: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            },
            !expanded && {
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            },
            expanded && {
              pl: { xs: 4, md: 6 },
              pr: { xs: 2, md: 3 },
            },
          ]}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: "rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.08)",
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
            {expanded && (
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
            )}
          </Box>
          <IconButton
            sx={{ mt: 1, display: { md: "none" } }}
            onClick={toggleNavbarDrawer}
          >
            <IconifyIcon
              icon="material-symbols:left-panel-close-outline"
              fontSize={24}
            />
          </IconButton>
        </Box>
      </Toolbar>
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <SidenavSimpleBar>
          <Box
            sx={[
              {
                py: 2,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              },
              !expanded && {
                px: 2,
              },
              expanded && {
                px: { xs: 2, md: 4 },
              },
            ]}
          >
            <div>
              {routes.map((r) => (
                <Box key={r.id}>
                  <List
                    dense
                    key={r.id}
                    sx={{
                      mb: 3,
                      pb: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    {r.items.map((item) => (
                      <NavItem key={item.pathName} item={item} level={0} />
                    ))}
                  </List>
                </Box>
              ))}
            </div>
          </Box>
        </SidenavSimpleBar>
      </Box>
      <SidenavFooter />
    </>
  );
};

export default SidenavDrawerContent;
