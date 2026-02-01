// import { SubMenuItem } from "routes/sitemap";
import IconifyIcon from "@components/base/IconifyIcon";
import { cssVarRgba } from "@lib/utils";
import { Box } from "@mui/material";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon, { listItemIconClasses } from "@mui/material/ListItemIcon";
import ListItemText, { listItemTextClasses } from "@mui/material/ListItemText";
import { useBreakpoints } from "@providers/BreakpointsProvider";
import { useSettingsContext } from "@providers/SettingsProvider";
import { COLLAPSE_NAVBAR } from "@reducers/SettingsReducer";
import { type MouseEvent, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router";
import NavItemPopper from "./NavItemPopper";
import type { SubMenuItem } from "./SidenavDrawerContent";

interface NavItemProps {
  item: SubMenuItem;
  level: number;
}

const NavItem = ({ item, level }: NavItemProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [openPopperMenu, setOpenPopperMenu] = useState(false);
  const { pathname } = useLocation();
  const { currentBreakpoint, up } = useBreakpoints();
  const upLg = up("lg");
  const sidenavCollapsed = false; // This is currently always false because there is nothing changing its value.
  const {
    config: { openNavbarDrawer },
    configDispatch,
    handleDrawerToggle,
  } = useSettingsContext();

  const hasNestedItems = useMemo(() => Object.hasOwn(item, "items"), [item]);

  const expandIcon = (
    <IconifyIcon
      icon="material-symbols:expand-more-rounded"
      className="expand-icon"
      sx={[
        {
          fontSize: 12,
          transition: (theme) =>
            theme.transitions.create("transform", {
              duration: theme.transitions.duration.shorter,
            }),
        },
        sidenavCollapsed && {
          transform: (theme) =>
            theme.direction === "rtl" ? "rotate(-270deg)" : "rotate(270deg)",
          position: "absolute",
          right: 8,
        },
      ]}
    />
  );

  const toggleCollapseItem = () => {
    if (!hasNestedItems) {
      if (openNavbarDrawer) {
        handleDrawerToggle();
      } else if (!upLg && !sidenavCollapsed) {
        configDispatch({ type: COLLAPSE_NAVBAR });
      }
      return;
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
    setOpenPopperMenu(false);
  };

  const handleMouseEnter = (event: MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
    setOpenPopperMenu(true);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <We want to refresh nav items when breakpoint changes.>
  useEffect(() => {}, [currentBreakpoint, sidenavCollapsed]);

  return (
    <ListItem key={item.pathName} disablePadding>
      <ListItemButton
        component={item.items ? "div" : NavLink}
        to={item.path}
        onClick={toggleCollapseItem}
        target={item.target ? item.target : undefined}
        onMouseEnter={sidenavCollapsed ? handleMouseEnter : undefined}
        onMouseLeave={sidenavCollapsed ? handleClose : undefined}
        aria-expanded={openPopperMenu}
        selected={
          item.path === "/" ? pathname === "/" : pathname.startsWith(item.path)
        }
        sx={[
          (theme) => ({
            p: theme.spacing("3.5px", 2),
            "&.Mui-selected": {
              [`& .${listItemTextClasses.primary}`]: {
                color: "primary.main",
              },
            },
          }),
          !item.active && {
            [`& .${listItemTextClasses.primary}`]: {
              color: "text.disabled",
            },
            [`& .${listItemIconClasses.root}`]: {
              color: "text.disabled",
            },
          },
          sidenavCollapsed && {
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            textAlign: "center",
            p: 1,
          },
          (!sidenavCollapsed || level !== 0) && {
            minWidth: 180,
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "center",
            textAlign: "left",
          },
          openPopperMenu && {
            backgroundColor: ({ vars }) =>
              level === 0
                ? cssVarRgba(vars.palette.primary.mainChannel, 0.36)
                : "action.hover",
          },
        ]}
      >
        {item.icon && (
          <ListItemIcon
            sx={{
              "& .iconify": {
                fontSize: sidenavCollapsed ? 24 : 18,
              },
            }}
          >
            <IconifyIcon icon={item.icon} sx={item.iconSx} />
          </ListItemIcon>
        )}

        <Box
          sx={[
            {
              flex: 1,
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            },
            level === 0 &&
              sidenavCollapsed && {
                px: 1,
              },
          ]}
        >
          <ListItemText
            sx={[
              {
                [`& .${listItemTextClasses.primary}`]: {
                  typography: "caption",
                  fontWeight: "medium",
                  whiteSpace: "nowrap",
                  lineHeight: 1.3,
                  color: level === 0 ? "text.primary" : "text.secondary",
                },
              },
              sidenavCollapsed && {
                [`& .${listItemTextClasses.primary}`]: {
                  lineClamp: 1,
                  wordBreak: "break-all",
                  whiteSpace: "normal",
                },
              },
            ]}
          >
            {item.name}
          </ListItemText>
          {hasNestedItems && expandIcon}
        </Box>
        {hasNestedItems && sidenavCollapsed && (
          <NavItemPopper
            handleClose={handleClose}
            anchorEl={anchorEl as HTMLElement}
            open={!!anchorEl && openPopperMenu}
            level={level + 1}
          >
            <List
              dense
              disablePadding
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: "2px",
              }}
            ></List>
          </NavItemPopper>
        )}
      </ListItemButton>
    </ListItem>
  );
};

export default NavItem;
