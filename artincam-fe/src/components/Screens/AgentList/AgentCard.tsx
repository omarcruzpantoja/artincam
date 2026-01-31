import { useMemo } from "react";
import { Box, Card, CardContent, Chip, Link, Typography } from "@mui/material";
import type { Agent } from "@services/agentService";
import { Link as RouterLink } from "react-router-dom";

export type AgentStatus = "ACTIVE" | "STOPPED" | "FAILURE";

interface AgentCardProps {
  agent: Agent;
}

const statusMeta = (status: AgentStatus) => {
  if (status === "ACTIVE")
    return { label: "Active", color: "success" as const };
  if (status === "STOPPED")
    return { label: "Offline", color: "default" as const };
  return { label: "Failure", color: "warning" as const };
};

export const AgentCard = ({ agent }: AgentCardProps) => {
  const camera = agent.config.camera;
  const status: AgentStatus = camera.status as AgentStatus;
  const meta = useMemo(() => statusMeta(status), [status]);

  const description =
    (agent as any).description || camera.location || "No description provided.";

  return (
    <Card variant="outlined" background={1} sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 2 }}>
        {/* Row 1: Title + Status */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 1,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              lineHeight: 1.2,
            }}
            noWrap
          >
            <Link
              component={RouterLink}
              to={`/agents/${agent.id}`}
              underline="none"
              sx={{
                color: "primary.main",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              {agent.name}
            </Link>
          </Typography>

          <Chip
            size="small"
            label={meta.label}
            color={meta.color}
            sx={{ fontWeight: 600 }}
          />
        </Box>

        {/* Row 2: Agent ID */}
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            mb: 1,
          }}
        >
          <Box
            component="span"
            sx={{ textTransform: "uppercase", letterSpacing: 0.4 }}
          >
            Agent ID:
          </Box>{" "}
          <Box
            component="span"
            sx={{
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              color: "text.primary",
            }}
          >
            {agent.id}
          </Box>
        </Typography>

        {/* Row 3: Description */}
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};
