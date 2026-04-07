import { Box, Typography } from "@mui/material";
import type React from "react";

const Footer = (): React.JSX.Element => {
  return (
    <Box
      component="footer"
      sx={{
        textAlign: "center",
        py: 1.65,
        borderTop: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Typography variant="caption" color="text.secondary">
        Artincam - Control Center © {new Date().getFullYear()}
      </Typography>
    </Box>
  );
};

export default Footer;
