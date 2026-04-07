import { paperClasses, type Theme } from "@mui/material";
import type { Components } from "@mui/material/styles";

const Drawer: Components<Omit<Theme, "components">>["MuiDrawer"] = {
  defaultProps: {
    slotProps: {
      paper: {
        variant: "elevation",
        elevation: 6,
      },
    },
  },
  styleOverrides: {
    docked: {
      [`& .${paperClasses.root}`]: {
        boxShadow: "none",
      },
    },
  },
};

export default Drawer;
