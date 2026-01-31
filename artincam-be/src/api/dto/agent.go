package dto

import (
	"time"
)

type AgentResponse struct {
	ID          string      `json:"id" example:"886b2ec7-96b6-47c4-ba27-207bef033d43"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
	AgentTypeID int64       `json:"agent_type_id"`
	Config      interface{} `json:"config"`
	CreatedAt   *time.Time  `json:"created_at" example:"2025-10-26T13:31:44Z"`
	UpdatedAt   *time.Time  `json:"updated_at" example:"2025-10-26T13:31:44Z"`
}

type AgentCreateRequestParams struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
	AgentTypeID int64       `json:"agent_type_id"`
	Config      interface{} `json:"config"`
}

type AgentPatchRequestParams struct {
	Name        *string      `json:"name"`
	Description *string      `json:"description"`
	Config      *interface{} `json:"config"`
	ID          string       `json:"id"`
}

type AgentActionMessage struct {
	Mode string `json:"mode"`
	Type string `json:"type"`
}

type ConfigUpdateMessage struct {
	Mode   string                `json:"mode"`
	Config ArtincamPiAgentConfig `json:"config"`
	Type   string                `json:"type"`
}

// ----- Artincam Pi Agent Config -----
type ArtincamPiAgentConfig struct {
	Camera   Camera `json:"camera"`
	AgentDir string `json:"agent_dir"`
}

type Camera struct {
	Mode                 string      `json:"mode" example:"video"`
	Status               string      `json:"status,omitempty" example:"ACTIVE"`
	Resolution           Resolution  `json:"resolution"`
	RtspStream           *RtspStream `json:"rtsp_stream,omitempty"`
	Transforms           Transforms  `json:"transforms"`
	Framerate            int         `json:"framerate,omitempty"`
	Bitrate              *int        `json:"bitrate,omitempty"`
	RecordingTime        int         `json:"recording_time,omitempty"`
	RecordingTimeUnit    string      `json:"recording_time_unit,omitempty"`
	CycleRestTime        int         `json:"cycle_rest_time,omitempty"`
	CycleRestTimeUnit    string      `json:"cycle_rest_time_unit,omitempty"`
	OutputDir            string      `json:"output_dir"`
	Location             string      `json:"location"`
	PiID                 int         `json:"pi_id"`
	ImageCaptureTime     int         `json:"image_capture_time,omitempty"`
	ImageCaptureTimeUnit string      `json:"image_capture_time_unit,omitempty"`
	ImageRestTime        float64     `json:"image_rest_time,omitempty"`
	ImageRestTimeUnit    string      `json:"image_rest_time_unit,omitempty"`
}

type Resolution struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

type RtspStream struct {
	Address string `json:"address"`
}

type Transforms struct {
	VerticalFlip   bool `json:"vertical_flip"`
	HorizontalFlip bool `json:"horizontal_flip"`
}

// ----- END Artincam Pi Agent Config -----
