import { Layout } from "@components/Layout";
import { AgentDetail } from "@components/Screens/AgentDetail";
import { AgentEdit } from "@components/Screens/AgentEdit";
import { AgentList } from "@components/Screens/AgentList";
import { Dashboard } from "@components/Screens/Dashboard";
import BreakpointsProvider from "@providers/BreakpointsProvider";
import SettingsProvider from "@providers/SettingsProvider";
import ThemeProvider from "@providers/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type React from "react";
import { Route, Routes } from "react-router-dom";

import "./App.css";

const queryClient = new QueryClient();

const App = (): React.JSX.Element => {
  return (
    <SettingsProvider>
      <ThemeProvider>
        <BreakpointsProvider>
          <QueryClientProvider client={queryClient}>
            <Routes>
              {/* Layout wraps all “app” routes */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="agents" element={<AgentList />} />
                <Route
                  path="/agents/create"
                  element={<AgentEdit mode="create" />}
                />
                <Route path="/agents/:agentId" element={<AgentDetail />} />
                <Route
                  path="/agents/:agentId/edit"
                  element={<AgentEdit mode="edit" />}
                />
                {/* <Route path="schedules" element={<SchedulesPage />} /> */}
                {/* <Route path="logs" element={<LogsPage />} /> */}
                {/* <Route path="settings" element={<SettingsPage />} /> */}
                {/* <Route path="about" element={<AboutPage />} /> */}
              </Route>
            </Routes>
          </QueryClientProvider>
        </BreakpointsProvider>
      </ThemeProvider>
    </SettingsProvider>
  );
};

export default App;
