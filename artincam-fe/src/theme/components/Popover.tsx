import { type Theme } from "@mui/material";
import { type Components } from "@mui/material/styles";

const Popover: Components<Omit<Theme, "components">>["MuiPopover"] = {
  defaultProps: {
    slotProps: {
      paper: {
        variant: "elevation",
        elevation: 6,
      },
    },
  },
};

export default Popover;
