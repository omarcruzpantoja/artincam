package dto

import (
	"time"
)

type ActionLogResponse struct {
	ID        int64       `json:"id"`
	AgentID   string      `json:"agent_id"`
	Message   interface{} `json:"message"`
	Category  string      `json:"category"`
	CreatedAt *time.Time  `json:"created_at" example:"2025-10-26T13:31:44Z"`
	UpdatedAt *time.Time  `json:"updated_at" example:"2025-10-26T13:31:44Z"`
}

type ActionLogCreateRequestParams struct {
	AgentID  string                 `json:"agent_id"`
	Category string                 `json:"category"`
	Message  map[string]interface{} `json:"message"`
}
