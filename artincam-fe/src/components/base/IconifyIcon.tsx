import { Icon, type IconProps } from "@iconify/react";
import { registerIcons } from "@lib/iconify/iconify-register";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { useId } from "react";

interface IconifyProps extends Omit<IconProps, "color"> {
  sx?: SxProps<Theme>;
  flipOnRTL?: boolean;
  icon: string;
  color?: string;
}

export const IconifyIcon = ({
  icon,
  flipOnRTL = false,
  color,
  sx,
  ...rest
}: IconifyProps) => {
  const uniqueId = useId();

  registerIcons();

  return (
    <Box
      component={Icon}
      className="iconify"
      sx={[
        flipOnRTL && {
          transform: (theme) =>
            theme.direction === "rtl" ? "scaleX(-1)" : "none",
        },
        { verticalAlign: "baseline" },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      // biome-ignore lint/suspicious/noExplicitAny: <Generic props for Iconify Icon>
      {...(rest as any)}
      icon={icon}
      id={uniqueId}
      color={color}
      ssr
    />
  );
};

export default IconifyIcon;
