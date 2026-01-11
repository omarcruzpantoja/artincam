import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";

import ActionsMenu, { type ActionItem } from "@components/Common/ActionsMenu";

export type StatusChipMeta = {
  label: string;
  color:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "info";
};

type AgentHeaderPanelProps<TAction extends string> = {
  agent: {
    id: string;
    name: string;
    description?: string | null;
  };

  modeText: string;

  meta: StatusChipMeta;

  actionItems: ActionItem<TAction>[];
  onAction: (action: TAction) => void;

  menuId?: string;
  ariaLabel?: string;
};

const Label = ({ children }: { children: React.ReactNode }) => {
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ letterSpacing: 0.4, textTransform: "uppercase" }}
    >
      {children}
    </Typography>
  );
};

const MonoValue = ({ children }: { children: React.ReactNode }) => {
  return (
    <Typography
      variant="body2"
      sx={{
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontWeight: 600,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
      title={typeof children === "string" ? children : undefined}
    >
      {children}
    </Typography>
  );
};

const AgentHeaderPanel = <TAction extends string>({
  agent,
  modeText,
  meta,
  actionItems,
  onAction,
  menuId,
  ariaLabel = "Agent actions",
}: AgentHeaderPanelProps<TAction>) => {
  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(agent.id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 900);
    } catch {
      // ignore
    }
  };

  const descriptionText = agent.description?.trim()
    ? agent.description.trim()
    : "No description.";

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <CardHeader
        title={
          <Typography
            variant="h6"
            sx={{ fontWeight: 900, lineHeight: 1.15 }}
            noWrap
          >
            {agent.name}
          </Typography>
        }
        // Best practice: status directly under title (state is primary context)
        subheader={
          <Box sx={{ mt: 0.75 }}>
            <Chip
              size="small"
              label={meta.label}
              color={meta.color}
              sx={{ fontWeight: 800 }}
            />
          </Box>
        }
        action={
          <ActionsMenu<TAction>
            items={actionItems}
            onAction={onAction}
            ariaLabel={ariaLabel}
            menuId={menuId ?? `agent-${agent.id}-actions-menu`}
          />
        }
        sx={{
          px: 2.5,
          py: 2,
          "& .MuiCardHeader-content": { minWidth: 0 },
          "& .MuiCardHeader-action": {
            alignSelf: "flex-start",
            mt: 0.25,
            mr: 0.25,
          },
        }}
      />

      <Divider />

      <CardContent sx={{ p: 2.5 }}>
        {/* One coherent details grid (description is just another row) */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          {/* Agent ID */}
          <Box sx={{ minWidth: 0 }}>
            <Label>Agent ID</Label>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mt: 0.75,
                minWidth: 0,
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <MonoValue>{agent.id}</MonoValue>
              </Box>

              <Tooltip title={copied ? "Copied!" : "Copy ID"}>
                <IconButton
                  size="small"
                  onClick={copyId}
                  aria-label="Copy agent id"
                >
                  {copied ? (
                    <CheckIcon fontSize="inherit" />
                  ) : (
                    <ContentCopyIcon fontSize="inherit" />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Mode */}
          <Box sx={{ minWidth: 0 }}>
            <Label>Mode</Label>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, mt: 0.75 }}
              noWrap
              title={modeText}
            >
              {modeText}
            </Typography>
          </Box>

          {/* Description spans full width */}
          <Box sx={{ gridColumn: { xs: "1 / -1", sm: "1 / -1" }, minWidth: 0 }}>
            <Label>Description</Label>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.75,
                lineHeight: 1.55,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {descriptionText}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AgentHeaderPanel;
