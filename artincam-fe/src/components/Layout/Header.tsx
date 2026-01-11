import React from "react";
import IconifyIcon from "@components/base/IconifyIcon";
import { useSettingsContext } from "@providers/SettingsProvider";
import { AppBar, Box, Button, Toolbar, paperClasses } from "@mui/material";

const Header = (): React.JSX.Element => {
  const {
    config: { drawerWidth },
    handleDrawerToggle,
  } = useSettingsContext();

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        borderBottom: `1px solid`,
        borderColor: "divider",
        [`&.${paperClasses.root}`]: {
          outline: "none",
        },
      }}
    >
      <Toolbar variant="appbar" sx={{ px: { xs: 3, md: 5 } }}>
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            alignItems: "center",
            gap: 1,
            pr: 2,
          }}
        >
          <Button
            color="neutral"
            variant="soft"
            shape="circle"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
          >
            <IconifyIcon
              icon="material-symbols:menu-rounded"
              sx={{ fontSize: 20 }}
            />
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
