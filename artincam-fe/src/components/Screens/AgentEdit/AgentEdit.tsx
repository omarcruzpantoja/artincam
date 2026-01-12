import React, { useEffect, useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useNavigate, useParams } from "react-router-dom";
import {
  agentService,
  type AgentStatus,
  type CameraConfig,
  type CameraMode,
  type TimeUnit,
  type WriteAgentPayload,
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
      resolution: { width: 1640, height: 1232 },
      rtsp_stream: { address: "" },
      transforms: { vertical_flip: false, horizontal_flip: false },
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

const LabelWithTip = ({ label, tip }: { label: string; tip?: string }) => {
  if (!tip)
    return (
      <Typography variant="caption" sx={{ fontWeight: "bold" }}>
        {label}
      </Typography>
    );

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
      <Typography variant="caption" sx={{ fontWeight: "bold" }}>
        {label}
      </Typography>
      <Tooltip title={tip} placement="top" arrow>
        <InfoOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
      </Tooltip>
    </Box>
  );
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Typography
    variant="overline"
    color="text.secondary"
    sx={{ letterSpacing: 0.6, fontWeight: 800 }}
  >
    {children}
  </Typography>
);

const FormGrid = ({ children }: { children: React.ReactNode }) => (
  <Box
    sx={{
      mt: 0.5,
      display: "grid",
      gap: 2,
      gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
      alignItems: "start",
    }}
  >
    {children}
  </Box>
);

const nativeSelectSlotProps = { select: { native: true } } as const;

const AgentEdit = ({ mode }: AgentEditPageProps) => {
  const isEdit = mode === "edit";
  const { agentId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState<WriteAgentPayload>({
    ...defaultCreateValues,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [agentId, isEdit]);

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
      config: { ...prev.config, camera: updater(prev.config.camera) },
    }));
  };

  const updateAgentConfig = (
    updater: (
      config: WriteAgentPayload["config"]
    ) => WriteAgentPayload["config"]
  ): void => {
    setForm((prev) => ({ ...prev, config: updater(prev.config) }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (mode === "create") {
      try {
        const response = await agentService.createAgent(form);
        navigate(`/agents/${response.data.id}`);
      } catch (err) {
        console.log(err);
      }
      return;
    }

    try {
      await agentService.updateAgent(agentId || "", form);
      navigate(`/agents/${agentId}`);
    } catch (err) {
      console.log(err);
    }
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
      <Stack
        spacing={2.5}
        sx={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            {isEdit ? "Edit Agent" : "Create Agent"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {isEdit
              ? "Update this agent's details and configuration."
              : "Create a new agent and define its configuration."}
          </Typography>
        </Box>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
            <CardHeader
              title={
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Basic Information
                </Typography>
              }
              sx={{ px: 2.5, py: 2 }}
            />
            <Divider />
            <CardContent sx={{ p: 2.5 }}>
              <Stack
                spacing={2}
                sx={{ display: "flex", flexDirection: "column" }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "repeat(auto-fit, minmax(200px, max-content))",
                    },
                  }}
                >
                  <TextField
                    label={<LabelWithTip label="Name" />}
                    value={form.name}
                    onChange={handleTopLevelChange("name")}
                    required
                  />

                  <TextField
                    label={<LabelWithTip label="Agent Type ID" />}
                    type="number"
                    value={form.agent_type_id}
                    onChange={handleTopLevelChange("agent_type_id")}
                  />
                </Box>

                <TextField
                  label={<LabelWithTip label="Description" />}
                  value={form.description}
                  onChange={handleTopLevelChange("description")}
                  fullWidth
                />

                <TextField
                  label={
                    <LabelWithTip
                      label="Agent Directory"
                      tip="Directory where agent script is located, only works when server and agent are on the same machine."
                    />
                  }
                  value={form.config.agent_dir}
                  onChange={(e) =>
                    updateAgentConfig((config) => ({
                      ...config,
                      agent_dir: e.target.value,
                    }))
                  }
                  fullWidth
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardHeader
              title={
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Camera Configuration
                </Typography>
              }
              sx={{ px: 2.5, py: 2 }}
            />
            <Divider />

            <CardContent sx={{ p: 2.5 }}>
              <Stack
                spacing={3}
                sx={{ display: "flex", flexDirection: "column" }}
              >
                {/* General */}
                <Box>
                  <SectionTitle>General</SectionTitle>

                  <FormGrid>
                    <TextField
                      select
                      label={
                        <LabelWithTip
                          label="Mode"
                          tip="Determines operation mode: image, video, image/video, or rtsp_stream."
                        />
                      }
                      value={form.config.camera.mode}
                      onChange={(e) =>
                        updateCamera((cam) => ({
                          ...cam,
                          mode: e.target.value as CameraMode,
                        }))
                      }
                      fullWidth
                    >
                      <MenuItem value="image">image</MenuItem>
                      <MenuItem value="video">video</MenuItem>
                      <MenuItem value="image/video">image/video</MenuItem>
                      <MenuItem value="rtsp_stream">rtsp_stream</MenuItem>
                    </TextField>

                    <TextField
                      select
                      label={<LabelWithTip label="Status" />}
                      value={form.config.camera.status ?? ""}
                      onChange={(e) =>
                        updateCamera((cam) => ({
                          ...cam,
                          status: (e.target.value || null) as AgentStatus,
                        }))
                      }
                      fullWidth
                    >
                      <MenuItem value=""></MenuItem>
                      <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                      <MenuItem value="STOPPED">STOPPED</MenuItem>
                      <MenuItem value="FAILURE">FAILURE</MenuItem>
                    </TextField>

                    <TextField
                      label={
                        <LabelWithTip
                          label="Output Directory"
                          tip="Directory where captured images and videos are stored in agent."
                        />
                      }
                      value={form.config.camera.output_dir}
                      onChange={(e) =>
                        updateCamera((cam) => ({
                          ...cam,
                          output_dir: e.target.value,
                        }))
                      }
                      fullWidth
                    />

                    <TextField
                      label={
                        <LabelWithTip
                          label="Location"
                          tip="Location of where agent is physically located. Only lowercase letters, numbers, and hyphens allowed."
                        />
                      }
                      value={form.config.camera.location}
                      onChange={(e) =>
                        updateCamera((cam) => ({
                          ...cam,
                          location: e.target.value,
                        }))
                      }
                      fullWidth
                    />

                    <TextField
                      label={
                        <LabelWithTip
                          label="Pi ID"
                          tip="Unique identifier for the Raspberry Pi (0–9999)."
                        />
                      }
                      type="number"
                      value={form.config.camera.pi_id}
                      onChange={(e) =>
                        updateCamera((cam) => ({
                          ...cam,
                          pi_id: Number(e.target.value) || 0,
                        }))
                      }
                      fullWidth
                    />

                    {/* optional spacer so md layout stays visually even */}
                    <Box sx={{ display: { xs: "none", md: "block" } }} />
                  </FormGrid>
                </Box>

                <Divider />

                {/* Image Capture */}
                <Box>
                  <SectionTitle>Image Capture</SectionTitle>
                  <FormGrid>
                    <Box
                      sx={{
                        display: "grid",
                        gap: 2,
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: "repeat(auto-fit, minmax(200px, max-content))",
                        },
                      }}
                    >
                      <TextField
                        label={
                          <LabelWithTip
                            label="Image Capture Time"
                            tip="How long to capture images before stopping for a cycle (e.g. 10 seconds)"
                          />
                        }
                        type="number"
                        value={form.config.camera.image_capture_time ?? ""}
                        onChange={(e) =>
                          updateCamera((cam) => ({
                            ...cam,
                            image_capture_time:
                              Number(e.target.value) || undefined,
                          }))
                        }
                      />

                      <TextField
                        select
                        label={<LabelWithTip label="Image Capture Unit" />}
                        value={
                          form.config.camera.image_capture_time_unit ?? "s"
                        }
                        onChange={(e) =>
                          updateCamera((cam) => ({
                            ...cam,
                            image_capture_time_unit: e.target.value as TimeUnit,
                          }))
                        }
                      >
                        <MenuItem value="s">s</MenuItem>
                        <MenuItem value="m">m</MenuItem>
                        <MenuItem value="h">h</MenuItem>
                        <MenuItem value="d">d</MenuItem>
                      </TextField>
                    </Box>

                    <Box
                      sx={{
                        display: "grid",
                        gap: 2,
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: "repeat(auto-fit, minmax(200px, max-content))",
                        },
                      }}
                    >
                      <TextField
                        label={
                          <LabelWithTip
                            label="Image Rest Time"
                            tip="How long to wait between image captures (e.g. 5 seconds)"
                          />
                        }
                        type="number"
                        value={form.config.camera.image_rest_time ?? ""}
                        onChange={(e) =>
                          updateCamera((cam) => ({
                            ...cam,
                            image_rest_time:
                              Number(e.target.value) || undefined,
                          }))
                        }
                        fullWidth
                      />

                      <TextField
                        select
                        label={<LabelWithTip label="Image Rest Unit" />}
                        value={form.config.camera.image_rest_time_unit ?? "s"}
                        onChange={(e) =>
                          updateCamera((cam) => ({
                            ...cam,
                            image_rest_time_unit: e.target.value as TimeUnit,
                          }))
                        }
                        fullWidth
                      >
                        <MenuItem value="s">s</MenuItem>
                        <MenuItem value="m">m</MenuItem>
                        <MenuItem value="h">h</MenuItem>
                        <MenuItem value="d">d</MenuItem>
                      </TextField>
                    </Box>
                  </FormGrid>
                </Box>

                <Divider />

                {/* Video Capture */}
                <Box>
                  <SectionTitle>Video Capture</SectionTitle>

                  <FormGrid>
                    <Box
                      sx={{
                        display: "grid",
                        gap: 2,
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: "repeat(auto-fit, minmax(200px, max-content))",
                        },
                      }}
                    >
                      <TextField
                        label={
                          <LabelWithTip
                            label="Recording Time"
                            tip="How long to record video (e.g. 10 seconds)"
                          />
                        }
                        type="number"
                        value={form.config.camera.recording_time ?? ""}
                        onChange={(e) =>
                          updateCamera((cam) => ({
                            ...cam,
                            recording_time: Number(e.target.value) || undefined,
                          }))
                        }
                        fullWidth
                      />

                      <TextField
                        select
                        label={<LabelWithTip label="Recording Unit" />}
                        value={form.config.camera.recording_time_unit ?? "s"}
                        onChange={(e) =>
                          updateCamera((cam) => ({
                            ...cam,
                            recording_time_unit: e.target.value as TimeUnit,
                          }))
                        }
                        fullWidth
                      >
                        <MenuItem value="s">s</MenuItem>
                        <MenuItem value="m">m</MenuItem>
                        <MenuItem value="h">h</MenuItem>
                        <MenuItem value="d">d</MenuItem>
                      </TextField>
                    </Box>

                    <Box
                      sx={{
                        display: "grid",
                        gap: 2,
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: "repeat(auto-fit, minmax(200px, max-content))",
                        },
                      }}
                    >
                      <TextField
                        label={
                          <LabelWithTip
                            label="Cycle Rest Time"
                            tip="How long to wait between cycles (e.g. 5 seconds)"
                          />
                        }
                        type="number"
                        value={form.config.camera.cycle_rest_time ?? ""}
                        onChange={(e) =>
                          updateCamera((cam) => ({
                            ...cam,
                            cycle_rest_time:
                              Number(e.target.value) || undefined,
                          }))
                        }
                        fullWidth
                      />

                      <TextField
                        select
                        label={<LabelWithTip label="Cycle Rest Unit" />}
                        value={form.config.camera.cycle_rest_time_unit ?? "s"}
                        onChange={(e) =>
                          updateCamera((cam) => ({
                            ...cam,
                            cycle_rest_time_unit: e.target.value as TimeUnit,
                          }))
                        }
                        fullWidth
                      >
                        <MenuItem value="s">s</MenuItem>
                        <MenuItem value="m">m</MenuItem>
                        <MenuItem value="h">h</MenuItem>
                        <MenuItem value="d">d</MenuItem>
                      </TextField>
                    </Box>
                    <TextField
                      label={
                        <LabelWithTip
                          label="Framerate (fps)"
                          tip="Frames per second for the video stream."
                        />
                      }
                      type="number"
                      value={form.config.camera.framerate ?? ""}
                      onChange={(e) =>
                        updateCamera((cam) => ({
                          ...cam,
                          framerate: Number(e.target.value) || undefined,
                        }))
                      }
                      fullWidth
                    />

                    <TextField
                      label={
                        <LabelWithTip
                          label="Bitrate (bps)"
                          tip="Higher values increase quality and file size. Recommended: 8388608 (8MB)."
                        />
                      }
                      type="number"
                      value={form.config.camera.bitrate ?? ""}
                      onChange={(e) =>
                        updateCamera((cam) => ({
                          ...cam,
                          bitrate: Number(e.target.value) || undefined,
                        }))
                      }
                      fullWidth
                    />
                  </FormGrid>
                </Box>

                <Divider />

                {/* Resolution & RTSP */}
                <Box>
                  <SectionTitle>Resolution &amp; RTSP</SectionTitle>
                  <FormGrid>
                    <TextField
                      label={
                        <LabelWithTip
                          label="RTSP Address"
                          tip="Used only if mode is rtsp_stream."
                        />
                      }
                      value={form.config.camera.rtsp_stream?.address ?? ""}
                      onChange={(e) =>
                        updateCamera((cam) => ({
                          ...cam,
                          rtsp_stream: { address: e.target.value },
                        }))
                      }
                      fullWidth
                      placeholder="rtsp://user:pass@host:port/stream"
                    />
                    <Box
                      sx={{
                        mt: 0.5,
                        display: "grid",
                        gap: 2,
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: "repeat(auto-fit, minmax(200px, max-content))",
                        },
                        alignItems: "start",
                      }}
                    >
                      <TextField
                        label={
                          <LabelWithTip
                            label="Resolution Width"
                            tip="Default: 1640. 1920x1080 not recommended as it limits FoV."
                          />
                        }
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
                      />

                      <TextField
                        label={
                          <LabelWithTip
                            label="Resolution Height"
                            tip="Default: 1232. 1920x1080 not recommended as it limits FoV."
                          />
                        }
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
                      />
                    </Box>
                  </FormGrid>
                </Box>

                <Divider />

                {/* Transforms (kept exactly in the “direction + spacing” pattern) */}
                <Box>
                  <SectionTitle>Transforms</SectionTitle>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    sx={{ mt: 0.75 }}
                  >
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
                        />
                      }
                      label={
                        <LabelWithTip
                          label="Vertical Flip"
                          tip="Boolean to vertically flip the image/video."
                        />
                      }
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={
                            form.config.camera.transforms.horizontal_flip
                          }
                          onChange={(e) =>
                            updateCamera((cam) => ({
                              ...cam,
                              transforms: {
                                ...cam.transforms,
                                horizontal_flip: e.target.checked,
                              },
                            }))
                          }
                        />
                      }
                      label={
                        <LabelWithTip
                          label="Horizontal Flip"
                          tip="Boolean to horizontally flip the image/video."
                        />
                      }
                    />
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Footer actions */}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            color="inherit"
            type="button"
            onClick={() => {
              if (isEdit) navigate(`/agents/${agentId}`);
              else navigate("/agents");
            }}
          >
            Cancel
          </Button>

          <Button variant="contained" type="submit">
            {isEdit ? "Save Changes" : "Create Agent"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default AgentEdit;
