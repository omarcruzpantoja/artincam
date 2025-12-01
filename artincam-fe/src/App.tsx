import React from "react";
import { Routes, Route } from "react-router-dom";
import { CssBaseline } from "@mui/material";

import { Layout } from "@components/Layout";
import { ThemeContextProvider } from "@components/Contexts/ThemeContext";
import { Dashboard } from "@components/Screens/Dashboard";
import { AgentList } from "@components/Screens/AgentList";

import "./App.css";
// -----------------------------
// THEMES
// -----------------------------

function App(): React.JSX.Element {
  return (
    <ThemeContextProvider>
      <CssBaseline />
      <Routes>
        {/* Layout wraps all “app” routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="agents" element={<AgentList />} />
          {/* <Route path="schedules" element={<SchedulesPage />} /> */}
          {/* <Route path="logs" element={<LogsPage />} /> */}
          {/* <Route path="settings" element={<SettingsPage />} /> */}
          {/* <Route path="about" element={<AboutPage />} /> */}
        </Route>
      </Routes>
    </ThemeContextProvider>
  );
}

export default App;
