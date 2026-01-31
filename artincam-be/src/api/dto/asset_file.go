package dto

import (
	"time"
)

type AssetFileResponse struct {
	ID        int64      `json:"id"`
	AgentID   string     `json:"agent_id"`
	CameraID  string     `json:"camera_id"`
	Location  string     `json:"location"`
	Timestamp time.Time  `json:"timestamp"`
	UniqueID  string     `json:"unique_id"`
	FileName  string     `json:"file_name"`
	FileSize  int64      `json:"file_size" example:"2048"`
	CreatedAt *time.Time `json:"created_at" example:"2025-10-26T13:31:44Z"`
	UpdatedAt *time.Time `json:"updated_at" example:"2025-10-26T13:31:44Z"`
}

type AssetFilePatchRequest struct {
	CameraID  *string    `json:"camera_id"`
	Location  *string    `json:"location"`
	Timestamp *time.Time `json:"timestamp"`
	UniqueID  *string    `json:"unique_id"`
	FileName  *string    `json:"file_name"`
	FileSize  *int64     `json:"file_size" example:"2048"`
	CreatedAt *time.Time `json:"created_at" example:"2025-10-26T13:31:44Z"`
	UpdatedAt *time.Time `json:"updated_at" example:"2025-10-26T13:31:44Z"`
}
