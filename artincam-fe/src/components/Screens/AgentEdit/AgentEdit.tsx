import { useEffect, useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import {
  agentService,
  type CameraMode,
  type TimeUnit,
  type CameraConfig,
  type WriteAgentPayload,
  type AgentStatus,
} from "@services/agentService";

interface AgentEditPageProps {
  mode: "create" | "edit";
}

const defaultCreateValues: WriteAgentPayload = {
  name: "",
  description: "",
  agent_type_id: 1,

  config: {
    camera: {
      mode: "image",
      status: "STOPPED",

      resolution: {
        width: 1640,
        height: 1232,
      },

      rtsp_stream: {
        address: "",
      },

      transforms: {
        vertical_flip: false,
        horizontal_flip: false,
      },

      framerate: 24,
      bitrate: 8388608,

      recording_time: 10,
      recording_time_unit: "s",

      cycle_rest_time: 0,
      cycle_rest_time_unit: "s",

      output_dir: "/var/lib/artincam/output",
      location: "zone1",

      pi_id: 0,

      image_capture_time: 5,
      image_capture_time_unit: "s",

      image_rest_time: 10,
      image_rest_time_unit: "s",
    },
    agent_dir: "/opt/artincam/camera/artincam",
  },
};

const AgentEdit = ({ mode }: AgentEditPageProps) => {
  const isEdit = mode === "edit";
  const { agentId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState<WriteAgentPayload>({
    ...defaultCreateValues,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load agent on edit
  useEffect(() => {
    if (!isEdit || !agentId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await agentService.getAgent(agentId);

        if (cancelled) return;

        // Map backend agent → form state
        setForm({
          name: response.data.name ?? "",
          description: response.data.description ?? "",
          agent_type_id:
            response.data.agent_type_id ?? defaultCreateValues.agent_type_id,
          config: response.data.config ?? defaultCreateValues.config,
        });
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load agent details."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [agentId, isEdit]);

  // ---- handlers ----

  const handleTopLevelChange =
    (field: keyof WriteAgentPayload) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const raw = event.target.value;

      setForm((prev) => ({
        ...prev,
        [field]:
          field === "agent_type_id"
            ? Number(raw) || 0
            : (raw as WriteAgentPayload[typeof field]),
      }));
    };

  const updateCamera = (
    updater: (camera: CameraConfig) => CameraConfig
  ): void => {
    setForm((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        camera: updater(prev.config.camera),
      },
    }));
  };

  const updateAgentConfig = (
    updater: (
      config: WriteAgentPayload["config"]
    ) => WriteAgentPayload["config"]
  ): void => {
    setForm((prev) => ({
      ...prev,
      config: updater(prev.config),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // TODO: call agentService.create or agentService.update here using `form`
    // agentService.createAgent(form) or similar
    if (mode === "create") {
      try {
        const response = await agentService.createAgent(form);
        navigate(`/agents/${response.data.id}`);
      } catch (error) {
        console.log(error);
      }
    } else {
      try {
        await agentService.updateAgent(agentId || "", form);
        navigate(`/agents/${agentId}`);
      } catch (error) {
        console.log(error);
      }
    }

    console.log("Submitting agent form:", form);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack alignItems="center">
          <CircularProgress />
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        {isEdit ? "Edit Agent" : "Create Agent"}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {isEdit
          ? "Update this agent's details and configuration."
          : "Create a new agent and define its configuration."}
      </Typography>

      <Grid container spacing={3}>
        {/* LEFT: Basic Info */}
        <Grid>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <TextField
              label="Name"
              value={form.name}
              onChange={handleTopLevelChange("name")}
              fullWidth
              required
              margin="normal"
            />

            <TextField
              label="Description"
              value={form.description}
              onChange={handleTopLevelChange("description")}
              fullWidth
              margin="normal"
              multiline
              minRows={3}
            />

            <TextField
              label="Agent Type ID"
              type="number"
              value={form.agent_type_id}
              onChange={handleTopLevelChange("agent_type_id")}
              fullWidth
              margin="normal"
            />
          </Paper>
        </Grid>

        {/* RIGHT: Configuration (camera fields) */}
        <Grid>
          <Paper
            sx={{
              p: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Camera Configuration
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              {/* Mode & Status */}
              <Grid>
                <TextField
                  select
                  label="Mode"
                  value={form.config.camera.mode}
                  onChange={(e) =>
                    updateCamera((cam) => ({
                      ...cam,
                      mode: e.target.value as CameraMode,
                    }))
                  }
                  fullWidth
                  margin="normal"
                  SelectProps={{ native: true }}
                >
                  <option value="rtsp_stream">rtsp_stream</option>
                  <option value="video">video</option>
                  <option value="image">image</option>
                  <option value="image/video">image/video</option>
                </TextField>
              </Grid>

              <Grid>
                <TextField
                  select
                  label="Status"
                  value={form.config.camera.status ?? ""}
                  onChange={(e) =>
                    updateCamera((cam) => ({
                      ...cam,
                      status: (e.target.value || null) as AgentStatus,
                    }))
                  }
                  fullWidth
                  margin="normal"
                  SelectProps={{ native: true }}
                >
                  <option value=""></option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="STOPPED">STOPPED</option>
                  <option value="FAILURE">FAILURE</option>
                </TextField>
              </Grid>

              {/* Resolution */}
              <Grid>
                <TextField
                  label="Resolution Width"
                  type="number"
                  value={form.config.camera.resolution.width}
                  onChange={(e) =>
                    updateCamera((cam) => ({
                      ...cam,
                      resolution: {
                        ...cam.resolution,
                        width: Number(e.target.value) || 0,
                      },
                    }))
                  }
                  fullWidth
                  margin="normal"
                />
              </Grid>

              <Grid>
                <TextField
                  label="Resolution Height"
                  type="number"
                  value={form.config.camera.resolution.height}
                  onChange={(e) =>
                    updateCamera((cam) => ({
                      ...cam,
                      resolution: {
                        ...cam.resolution,
                        height: Number(e.target.value) || 0,
                      },
                    }))
                  }
                  fullWidth
                  margin="normal"
                />
              </Grid>

              {/* RTSP address (optional) */}
              <Grid>
                <TextField
                  label="RTSP Address"
                  value={form.config.camera.rtsp_stream?.address ?? ""}
                  onChange={(e) =>
                    updateCamera((cam) => ({
                      ...cam,
                      rtsp_stream: { address: e.target.value },
                    }))
                  }
                  fullWidth
                  margin="normal"
                  placeholder="rtsp://user:pass@host:port/stream"
                />
              </Grid>

              {/* Framerate / Bitrate */}
              <Grid>
                <TextField
                  label="Framerate (fps)"
                  type="number"
                  value={form.config.camera.framerate ?? ""}
                  onChange={(e) =>
                    updateCamera((cam) => ({
                      ...cam,
                      framerate: Number(e.target.value) || undefined,
                    }))
                  }
                  fullWidth
                  margin="normal"
                />
              </Grid>

              <Grid>
                <TextField
                  label="Bitrate (bps)"
                  type="number"
                  value={form.config.camera.bitrate ?? ""}
                  onChange={(e) =>
                    updateCamera((cam) => ({
                      ...cam,
                      bitrate: Number(e.target.value) || undefined,
                    }))
                  }
                  fullWidth
                  margin="normal"
                />
              </Grid>

              {/* Output & Location & Pi ID */}
              <Grid>
                <TextField
                  label="Output Directory"
                  value={form.config.camera.output_dir}
                  onChange={(e) =>
                    updateCamera((cam) => ({
                      ...cam,
                      output_dir: e.target.value,
                    }))
                  }
                  fullWidth
                  margin="normal"
                />
              </Grid>

              <Grid>
                <TextField
                  label="Agent Directory"
                  value={form.config.agent_dir}
                  onChange={(e) =>
                    updateAgentConfig((config) => ({
                      ...config,
                      agent_dir: e.target.value,
                    }))
                  }
                  fullWidth
                  margin="normal"
                />
              </Grid>

              <Grid>
                <TextField
                  label="Location"
                  value={form.config.camera.location}
                  onChange={(e) =>
                    updateCamera((cam) => ({
                      ...cam,
                      location: e.target.value,
                    }))
                  }
                  fullWidth
                  margin="normal"
                  helperText="Lowercase, digits, hyphens only"
                />
              </Grid>

              <Grid>
                <TextField
                  label="Pi ID"
                  type="number"
                  value={form.config.camera.pi_id}
                  onChange={(e) =>
                    updateCamera((cam) => ({
                      ...cam,
                      pi_id: Number(e.target.value) || 0,
                    }))
                  }
                  fullWidth
                  margin="normal"
                />
              </Grid>

              {/* Image capture + rest */}
              <Grid>
                <TextField
                  label="Image Capture Time"
                  type="number"
                  value={form.config.camera.image_capture_time ?? ""}
                  onChange={(e) =>
                    updateCamera((cam) => ({
                      ...cam,
                      image_capture_time: Number(e.target.value) || undefined,
                    }))
                  }
                  fullWidth
                  margin="normal"
                />
              </Grid>

              <Grid size={1.5}>
                <TextField
                  select
                  label="Image Capture Time Unit"
                  value={form.config.camera.image_capture_time_unit ?? "s"}
                  onChange={(e) =>
                    updateCamera((cam) => ({
                      ...cam,
                      image_capture_time_unit: e.target.value as TimeUnit,
                    }))
                  }
                  fullWidth
                  margin="normal"
                >
                  <option value="s">s</option>
                  <option value="m">m</option>
                  <option value="h">h</option>
                  <option value="d">d</option>
                </TextField>
              </Grid>

              <Grid>
                <TextField
                  label="Image Rest Time"
                  type="number"
                  value={form.config.camera.image_rest_time ?? ""}
                  onChange={(e) =>
                    updateCamera((cam) => ({
                      ...cam,
                      image_rest_time: Number(e.target.value) || undefined,
                    }))
                  }
                  fullWidth
                  margin="normal"
                />
              </Grid>

              <Grid size={1.5}>
                <TextField
                  select
                  label="Image Rest Time Unit"
                  value={form.config.camera.image_rest_time_unit ?? "s"}
                  onChange={(e) =>
                    updateCamera((cam) => ({
                      ...cam,
                      image_rest_time_unit: e.target.value as TimeUnit,
                    }))
                  }
                  fullWidth
                  margin="normal"
                >
                  <option value="s">s</option>
                  <option value="m">m</option>
                  <option value="h">h</option>
                  <option value="d">d</option>
                </TextField>
              </Grid>

              {/* Transforms: vertical & horizontal flip */}
              <Grid>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.config.camera.transforms.vertical_flip}
                      onChange={(e) =>
                        updateCamera((cam) => ({
                          ...cam,
                          transforms: {
                            ...cam.transforms,
                            vertical_flip: e.target.checked,
                          },
                        }))
                      }
                      color="primary"
                    />
                  }
                  label="Vertical Flip"
                />
              </Grid>

              <Grid>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.config.camera.transforms.horizontal_flip}
                      onChange={(e) =>
                        updateCamera((cam) => ({
                          ...cam,
                          transforms: {
                            ...cam.transforms,
                            horizontal_flip: e.target.checked,
                          },
                        }))
                      }
                      color="primary"
                    />
                  }
                  label="Horizontal Flip"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Actions */}
      <Stack
        direction="row"
        spacing={2}
        justifyContent="flex-end"
        sx={{ mt: 3 }}
      >
        <Button
          variant="outlined"
          color="inherit"
          type="button"
          onClick={() => {
            if (isEdit) {
              navigate(`/agents/${agentId}`);
            } else {
              navigate("/agents");
            }
          }}
        >
          Cancel
        </Button>
        <Button variant="contained" color="primary" type="submit">
          {isEdit ? "Save Changes" : "Create Agent"}
        </Button>
      </Stack>
    </Box>
  );
};

export default AgentEdit;
