import { CssBaseline, Box } from "@mui/material";
import { Outlet } from "react-router-dom";

import Footer from "./Footer";
import Sidebar from "./Sidebar";
import Header from "./Header";

const Layout = () => {
  return (
    <>
      <CssBaseline />

      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        {/* ---- SIDEBAR ---- */}
        <Sidebar />
        {/* ---- MAIN CONTENT ---- */}
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.default",
            minHeight: "100vh",
          }}
        >
          {/* ---- HEADER ---- */}
          <Header />

          {/* ---- BODY ---- */}
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Outlet />
          </Box>

          {/* ---- FOOTER ---- */}
          <Footer />
        </Box>
      </Box>
    </>
  );
};

export default Layout;
