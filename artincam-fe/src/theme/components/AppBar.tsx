import type { Theme } from "@mui/material";
import type { Components } from "@mui/material/styles";

const AppBar: Components<Omit<Theme, "components">>["MuiAppBar"] = {
  defaultProps: {
    color: "inherit",
  },
  styleOverrides: {
    root: {
      boxShadow: "none",
    },
  },
};

export default AppBar;
