import { Box, Divider, Typography } from "@mui/material";
import { getServerHost } from "@services/baseService";

type SidenavFooterProps = {
  version?: string;
};

const SidenavFooter = ({ version }: SidenavFooterProps): React.JSX.Element => {
  const appVersion = version ?? import.meta.env.VITE_APP_VERSION ?? "dev";
  const hostname = getServerHost();

  return (
    <>
      <Divider />

      <Box
        sx={{
          px: 2,
          py: 1,
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

export default SidenavFooter;
