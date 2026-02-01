import type { Theme } from "@mui/material";
import type { Components } from "@mui/material/styles";

const Typography: Components<Omit<Theme, "components">>["MuiTypography"] = {
  defaultProps: {
    variantMapping: {
      subtitle2: "p",
    },
  },
};

export default Typography;
