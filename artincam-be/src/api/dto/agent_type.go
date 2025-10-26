package dto

import "time"

type AgentTypeResponse struct {
	ID          int64      `json:"id"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	CreatedAt   *time.Time `json:"created_at" example:"2025-10-26T13:31:44Z"`
	UpdatedAt   *time.Time `json:"updated_at" example:"2025-10-26T13:31:44Z"`
}
