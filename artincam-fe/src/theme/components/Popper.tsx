import { type Theme } from "@mui/material";
import { type Components } from "@mui/material/styles";

const Popper: Components<Omit<Theme, "components">>["MuiPopper"] = {
  defaultProps: {},
  styleOverrides: {
    root: ({ theme }) => ({
      zIndex: theme.zIndex.tooltip,
    }),
  },
};

export default Popper;
