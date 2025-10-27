package serializers

import (
	"artincam-be/src/api/dto"
	"artincam-be/src/db/qx"

	"encoding/json"
	"time"
)

func SerializeAgent(a *qx.Agent) *dto.AgentResponse {
	var (
		createdAt *time.Time
		updatedAt *time.Time
	)

	if a.CreatedAt.Valid {
		createdAt = &a.CreatedAt.Time
	}

	if a.UpdatedAt.Valid {
		updatedAt = &a.UpdatedAt.Time
	}

	return &dto.AgentResponse{
		ID:          a.ID,
		Name:        a.Name,
		Description: a.Description,
		AgentTypeID: a.AgentTypeID,
		Config:      json.RawMessage(a.Config),
		CreatedAt:   createdAt,
		UpdatedAt:   updatedAt,
	}
}

func SerializeAgents(ats []qx.Agent) []*dto.AgentResponse {
	responses := make([]*dto.AgentResponse, 0, len(ats))

	for _, at := range ats {
		responses = append(responses, SerializeAgent(&at))
	}

	return responses
}
