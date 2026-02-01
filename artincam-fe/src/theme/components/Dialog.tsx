import type { Theme } from "@mui/material";
import type { Components } from "@mui/material/styles";

const Dialog: Components<Omit<Theme, "components">>["MuiDialog"] = {
  defaultProps: {
    slotProps: {
      paper: {
        variant: "elevation",
        elevation: 6,
      },
    },
  },
};

export default Dialog;
