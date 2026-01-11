import { formHelperTextClasses, type Theme } from "@mui/material";
import { type Components } from "@mui/material/styles";

const FormHelperText: Components<
  Omit<Theme, "components">
>["MuiFormHelperText"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      [`&.${formHelperTextClasses.error}`]: {
        color: theme.vars.palette.error.light,
      },
    }),
  },
};

export default FormHelperText;
