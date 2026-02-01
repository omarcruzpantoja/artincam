import {
  checkboxClasses,
  formControlLabelClasses,
  radioClasses,
  type Theme,
} from "@mui/material";
import type { Components } from "@mui/material/styles";

const FormControlLabel: Components<
  Omit<Theme, "components">
>["MuiFormControlLabel"] = {
  styleOverrides: {
    root: {
      marginLeft: -9,
      [`& .${checkboxClasses.root}, & .${radioClasses.root}, & .${formControlLabelClasses.label}`]:
        {
          alignSelf: "flex-start",
        },
    },
    label: {
      fontSize: 14,
    },
  },
};

export default FormControlLabel;
