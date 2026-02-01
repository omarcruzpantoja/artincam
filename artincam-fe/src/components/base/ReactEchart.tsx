import { Box, type BoxProps, useTheme } from "@mui/material";
import { grey } from "@theme/palette/colors";
import type { EChartsReactProps } from "echarts-for-react";
import { default as ReactEChartsCore } from "echarts-for-react/lib/core";
import merge from "lodash.merge";
import { useMemo } from "react";

export interface ReactEchartProps extends BoxProps {
  echarts: EChartsReactProps["echarts"];
  option: EChartsReactProps["option"];
}

const ReactEchart = ({ option, ref, ...rest }: ReactEchartProps) => {
  const theme = useTheme();

  const isTouchDevice = useMemo(() => {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }, []);

  const defaultTooltip = useMemo(
    () => ({
      padding: [7, 10],
      axisPointer: {
        type: "none",
      },
      textStyle: {
        fontFamily: "Plus Jakarta Sans",
        fontWeight: 400,
        fontSize: 12,
        color: theme.vars.palette.common.white,
      },
      backgroundColor: grey[800],
      borderWidth: 0,
      borderColor: theme.vars.palette.menuDivider,
      extraCssText: "box-shadow: none;",
      transitionDuration: 0,
      confine: true,
      triggerOn: isTouchDevice ? "click" : "mousemove|click",
      ...theme.applyStyles("dark", {
        backgroundColor: grey[900],
        borderWidth: 1,
      }),
    }),
    [theme, isTouchDevice],
  );

  return (
    <Box
      component={ReactEChartsCore}
      ref={ref}
      option={{
        ...option,
        tooltip: merge(defaultTooltip, option.tooltip),
      }}
      {...rest}
    />
  );
};

export default ReactEchart;
