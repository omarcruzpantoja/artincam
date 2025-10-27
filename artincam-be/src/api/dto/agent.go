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
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Config      interface{} `json:"config"`
	ID          string      `json:"id"`
}
