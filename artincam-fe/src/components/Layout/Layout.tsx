import { mainDrawerWidth } from "@lib/constants";
import { Box, Drawer, drawerClasses, Toolbar } from "@mui/material";

import { useSettingsContext } from "@providers/SettingsProvider";
import { Outlet } from "react-router-dom";

import Footer from "./Footer";
import Header from "./Header";
import Sidenav from "./sidenav";
import SidenavDrawerContent from "./sidenav/SidenavDrawerContent";

const Layout = () => {
  const {
    config: { drawerWidth, openNavbarDrawer },
    setConfig,
  } = useSettingsContext();

  const toggleNavbarDrawer = () => {
    setConfig({
      openNavbarDrawer: !openNavbarDrawer,
    });
  };
  return (
    <Box>
      <Box sx={{ display: "flex", zIndex: 1, position: "relative" }}>
        <Header />

        {/* ---- SIDENAV ---- */}
        <Sidenav />
        {/* Temporary drawer for mobile */}
        <Drawer
          variant="temporary"
          open={openNavbarDrawer}
          onClose={toggleNavbarDrawer}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", md: "none" },
            [`& .${drawerClasses.paper}`]: {
              pt: 3,
              boxSizing: "border-box",
              width: mainDrawerWidth.full,
            },
          }}
        >
          <SidenavDrawerContent variant="temporary" />
        </Drawer>

        {/* ---- MAIN CONTENT WRAPPER ---- */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 0,
            minHeight: "100vh",
            width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
            display: "flex",
            flexDirection: "column",
            ml: { md: `${mainDrawerWidth.collapsed}px`, lg: 0 },
          }}
        >
          <Toolbar variant="appbar" />

          {/* ---- BODY ---- */}
          <Box sx={{ flex: 1 }}>
            <Box
              sx={[
                {
                  height: 1,
                  bgcolor: "background.default",
                },
              ]}
            >
              <Outlet />
            </Box>
          </Box>

          {/* ---- FOOTER ---- */}
          <Footer />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
