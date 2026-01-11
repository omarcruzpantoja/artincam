import React from "react";

import { Box, Stack } from "@mui/material";
import { agentService, type Agent } from "@services/agentService";
import { AgentCard } from "./AgentCard";
import PageHeader from "@components/common/PageHeader";

const AgentList = (): React.JSX.Element => {
  const [agents, setAgents] = React.useState([] as Agent[]);

  React.useEffect(() => {
    const fetchAgents = async () => {
      const response = await agentService.listAgents();
      setAgents(response.data);
    };

    fetchAgents();
  }, []);

  return (
    <Stack direction="column" height={1}>
      <PageHeader
        title="Agents"
        breadcrumb={[
          { label: "Home", url: "/" },
          { label: "Agents", active: true },
        ]}
      />
      {/* /Box should only take 80 width */}
      <Box
        sx={{
          p: "10%",
          pt: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </Box>
    </Stack>
  );
};

export default AgentList;
