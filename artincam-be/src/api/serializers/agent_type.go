package serializers

import (
	"artincam-be/src/api/dto"
	"artincam-be/src/db/qx"
	"time"
)

func SerializeAgentType(at *qx.AgentType) *dto.AgentTypeResponse {
	var createdAt *time.Time
	var updatedAt *time.Time

	if at.CreatedAt.Valid {
		createdAt = &at.CreatedAt.Time
	}

	if at.UpdatedAt.Valid {
		updatedAt = &at.UpdatedAt.Time
	}

	return &dto.AgentTypeResponse{
		ID:          at.ID,
		Name:        at.Name,
		Description: at.Description,
		CreatedAt:   createdAt,
		UpdatedAt:   updatedAt,
	}
}

func SerializeAgentTypes(ats []qx.AgentType) []*dto.AgentTypeResponse {
	responses := make([]*dto.AgentTypeResponse, 0, len(ats))

	for _, at := range ats {
		responses = append(responses, SerializeAgentType(&at))
	}

	return responses
}
