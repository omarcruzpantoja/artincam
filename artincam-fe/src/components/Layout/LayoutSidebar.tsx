import { Box, Divider, Typography, useTheme } from "@mui/material";
import { getServerHost } from "@services/baseService";

type SidebarFooterProps = {
  /** Optional override (useful for tests / storybook) */
  version?: string;
};

const SidebarFooter = ({ version }: SidebarFooterProps): React.JSX.Element => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const appVersion = version ?? import.meta.env.VITE_APP_VERSION ?? "dev";
  const hostname = getServerHost();

  return (
    <>
      <Divider
        sx={{
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        }}
      />

      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          sx={{ lineHeight: 1.2 }}
        >
          Version:
          <Box
            component="span"
            sx={{
              ml: 0.5,
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            }}
          >
            {appVersion}
          </Box>
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          title={hostname}
          sx={{ lineHeight: 1.2 }}
        >
          Host:
          <Box
            component="span"
            sx={{
              ml: 0.5,
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            }}
          >
            {hostname}
          </Box>
        </Typography>
      </Box>
    </>
  );
};

export default SidebarFooter;
