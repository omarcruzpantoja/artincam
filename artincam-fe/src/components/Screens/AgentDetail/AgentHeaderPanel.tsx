// src/components/Agents/AgentHeaderPanel.tsx
import {
  alpha,
  Box,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import { useMemo, useState } from "react";

import ActionsMenu, { type ActionItem } from "@components/Common/ActionsMenu";

export type StatusChipMeta = {
  label: string;
  color: "default" | "primary" | "secondary" | "success" | "warning" | "error" | "info";
};

type AgentHeaderPanelProps<TAction extends string> = {
  agent: {
    id: string;
    name: string;
    description?: string | null;
  };

  /** e.g. "Gainesville, FL" */
  locationText: string;

  /** e.g. "RTSP • H264" or "Capture Only" */
  modeText: string;

  /** chip meta derived from status */
  meta: StatusChipMeta;

  /** accent color used in the left dot + gradient */
  accentColor?: string;

  /** surface/border (optional overrides, else computed from theme) */
  panelBg?: string;
  borderColor?: string;

  /** actions menu */
  actionItems: ActionItem<TAction>[];
  onAction: (action: TAction) => void;

  /** optional menu id/aria */
  menuId?: string;
  ariaLabel?: string;
};

export default function AgentHeaderPanel<TAction extends string>({
  agent,
  locationText,
  modeText,
  meta,
  accentColor,
  panelBg,
  borderColor,
  actionItems,
  onAction,
  menuId,
  ariaLabel = "Agent actions",
}: AgentHeaderPanelProps<TAction>) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const accent = accentColor ?? theme.palette.primary.main;

  // sensible defaults if caller doesn't pass these
  const computedBorder = useMemo(
    () => borderColor ?? alpha(theme.palette.divider, isDark ? 0.22 : 0.55),
    [borderColor, theme.palette.divider, isDark]
  );

  const computedPanelBg = useMemo(() => {
    if (panelBg) return panelBg;
    // subtle glassy panel
    return alpha(theme.palette.background.paper, isDark ? 0.55 : 0.9);
  }, [panelBg, theme.palette.background.paper, isDark]);

  const [copied, setCopied] = useState(false);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: `1px solid ${computedBorder}`,
        bgcolor: computedPanelBg,
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Top meta bar */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1,
          borderBottom: `1px solid ${alpha(theme.palette.divider, isDark ? 0.22 : 0.6)}`,
          background: isDark
            ? `linear-gradient(90deg, ${alpha(accent, 0.12)} 0%, transparent 55%)`
            : `linear-gradient(90deg, ${alpha(accent, 0.1)} 0%, transparent 65%)`,
        }}
      >
        <Box
          sx={{
            width: 9,
            height: 9,
            borderRadius: 999,
            bgcolor: accent,
            boxShadow: isDark ? `0 0 14px ${alpha(accent, 0.3)}` : "none",
          }}
        />

        <Chip
          size="small"
          label={meta.label}
          color={meta.color}
          sx={{ height: 24, "& .MuiChip-label": { fontWeight: 800 } }}
        />

        <Divider
          orientation="vertical"
          flexItem
          sx={{
            mx: 1,
            borderColor: alpha(theme.palette.divider, isDark ? 0.25 : 0.55),
          }}
        />

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1 }} noWrap>
            {agent.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {locationText} • {modeText}
          </Typography>
        </Box>

        <ActionsMenu<TAction>
          items={actionItems}
          onAction={onAction}
          ariaLabel={ariaLabel}
          menuId={menuId ?? `agent-${agent.id}-actions-menu`}
        />
      </Box>

      {/* Header body */}
      <Box sx={{ px: 2.5, py: 2, flex: 1 }}>
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ letterSpacing: 0.4, textTransform: "uppercase" }}
            >
              Agent ID
            </Typography>

            <Typography
              variant="body2"
              sx={{
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              }}
            >
              {agent.id}
            </Typography>

            <Tooltip title={copied ? "Copied!" : "Copy ID"}>
              <IconButton
                size="small"
                onClick={() => {
                  navigator.clipboard.writeText(agent.id);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1000);
                }}
                sx={{
                  borderRadius: 1.5,
                  border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.22 : 0.55)}`,
                  bgcolor: alpha(theme.palette.text.primary, isDark ? 0.06 : 0.04),
                  "&:hover": {
                    bgcolor: alpha(theme.palette.text.primary, isDark ? 0.1 : 0.06),
                  },
                }}
              >
                {copied ? (
                  <CheckIcon fontSize="inherit" color="success" />
                ) : (
                  <ContentCopyIcon fontSize="inherit" />
                )}
              </IconButton>
            </Tooltip>
          </Stack>

          {agent.description ? (
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ letterSpacing: 0.4, textTransform: "uppercase" }}
              >
                Description
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {agent.description}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No description.
            </Typography>
          )}
        </Stack>
      </Box>
    </Paper>
  );
}
