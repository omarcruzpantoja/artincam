import type { Theme } from "@mui/material";
import type { Components } from "@mui/material/styles";

const Stack: Components<Omit<Theme, "components">>["MuiStack"] = {
  defaultProps: {
    useFlexGap: true,
    direction: "row",
  },
};

export default Stack;
