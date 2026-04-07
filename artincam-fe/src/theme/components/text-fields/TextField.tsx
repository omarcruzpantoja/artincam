import type { Theme } from "@mui/material";
import type { Components } from "@mui/material/styles";

declare module "@mui/material" {
  interface TextFieldPropsSizeOverrides {
    large: true;
  }
  interface InputBasePropsSizeOverrides {
    large: true;
  }
}

const TextField: Components<Omit<Theme, "components">>["MuiTextField"] = {
  defaultProps: {
    variant: "filled",
  },
  styleOverrides: {
    root: {
      "& input::-webkit-contacts-auto-fill-button, & input::-webkit-credentials-auto-fill-button":
        {
          visibility: "hidden",
          display: "none !important",
          pointerEvents: "none",
          position: "absolute",
          right: 0,
        },
    },
  },
};

export default TextField;
