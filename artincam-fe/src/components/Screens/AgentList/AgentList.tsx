import React from "react";

import { AgentCard } from "./AgentCard";
import { agentService, type Agent } from "@services/agentService";

const AgentDetail = (): React.JSX.Element => {
  const [agents, setAgents] = React.useState([] as Agent[]);

  React.useEffect(() => {
    const fetchAgents = async () => {
      const response = await agentService.listAgents();
      setAgents(response.data);
    };

    fetchAgents();
  }, []);

  return (
    <>
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </>
  );
};

export default AgentDetail;
