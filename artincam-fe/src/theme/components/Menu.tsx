import { listItemIconClasses, type Theme } from "@mui/material";
import type { Components } from "@mui/material/styles";

export const MenuItem: Components<Omit<Theme, "components">>["MuiMenuItem"] = {
  defaultProps: { dense: true },
  styleOverrides: {
    root: ({ theme }) => ({
      "&:hover": {
        backgroundColor: theme.vars.palette.background.menuElevation1,
      },
      padding: "8px 16px",
      [`& .${listItemIconClasses.root}`]: {
        minWidth: 24,
        "& svg": {
          fontSize: 16,
        },
      },
    }),
    dense: {
      padding: "6px 16px",
    },
  },
};
