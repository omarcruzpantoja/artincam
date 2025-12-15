import { CssBaseline, Box, Container, useTheme } from "@mui/material";
import { Outlet } from "react-router-dom";

import Footer from "./Footer";
import Sidebar from "./Sidebar";
import Header from "./Header";

const Layout = () => {
  const theme = useTheme();

  return (
    <>
      <CssBaseline />

      {/* App background layer */}
      <Box
        sx={{
          minHeight: "100vh",
          // subtle gradient backdrop
          background:
            theme.palette.mode === "dark"
              ? "radial-gradient(1200px 600px at 20% 10%, rgba(25, 118, 210, 0.18), transparent 55%), radial-gradient(900px 500px at 85% 20%, rgba(156, 39, 176, 0.14), transparent 55%), radial-gradient(700px 500px at 60% 95%, rgba(0, 200, 83, 0.10), transparent 55%), linear-gradient(180deg, rgba(10,10,10,1) 0%, rgba(12,12,12,1) 50%, rgba(9,9,9,1) 100%)"
              : "radial-gradient(1100px 520px at 20% 10%, rgba(25, 118, 210, 0.14), transparent 55%), radial-gradient(900px 520px at 85% 20%, rgba(156, 39, 176, 0.10), transparent 55%), radial-gradient(700px 500px at 60% 95%, rgba(0, 200, 83, 0.08), transparent 55%), linear-gradient(180deg, rgba(250,250,250,1) 0%, rgba(245,245,245,1) 45%, rgba(248,248,248,1) 100%)",
        }}
      >
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
          {/* ---- SIDEBAR ---- */}
          <Sidebar />

          {/* ---- MAIN CONTENT WRAPPER ---- */}
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
            }}
          >
            {/* ---- HEADER ---- */}
            <Header />

            {/* ---- BODY ---- */}
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                py: { xs: 2, md: 3 },
                px: { xs: 2, md: 3 },
              }}
            >
              {/* Centered content container (prettier than full-width) */}
              <Container
                maxWidth="xl"
                disableGutters
                sx={{
                  // “main surface” card
                  borderRadius: 3,
                  p: { xs: 2, md: 3 },
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(18,18,18,0.72)"
                      : "rgba(255,255,255,0.72)",
                  border:
                    theme.palette.mode === "dark"
                      ? "1px solid rgba(255,255,255,0.08)"
                      : "1px solid rgba(0,0,0,0.06)",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 18px 60px rgba(0,0,0,0.45)"
                      : "0 18px 60px rgba(0,0,0,0.10)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                }}
              >
                <Outlet />
              </Container>
            </Box>

            {/* ---- FOOTER ---- */}
            <Box
              sx={{
                mt: "auto",
                px: { xs: 2, md: 3 },
                pb: 2,
              }}
            >
              <Box
                sx={{
                  borderRadius: 3,
                  px: { xs: 2, md: 3 },
                  py: 2,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(18,18,18,0.55)"
                      : "rgba(255,255,255,0.55)",
                  border:
                    theme.palette.mode === "dark"
                      ? "1px solid rgba(255,255,255,0.06)"
                      : "1px solid rgba(0,0,0,0.06)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                }}
              >
                <Footer />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Layout;
