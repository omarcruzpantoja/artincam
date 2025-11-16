package serializers

import (
	"artincam-be/src/api/dto"
	"artincam-be/src/db/qx"
	"encoding/json"

	"time"
)

func SerializeActionLog(a *qx.ActionLog) *dto.ActionLogResponse {
	var (
		createdAt *time.Time
		updatedAt *time.Time
		m         interface{}
	)

	if a.CreatedAt.Valid {
		createdAt = &a.CreatedAt.Time
	}

	if a.UpdatedAt.Valid {
		updatedAt = &a.UpdatedAt.Time
	}

	json.Unmarshal([]byte(a.Message), &m)

	return &dto.ActionLogResponse{
		ID:        a.ID,
		AgentID:   a.AgentID,
		Message:   m,
		Category:  a.Category,
		CreatedAt: createdAt,
		UpdatedAt: updatedAt,
	}
}

func SerializeActionLogs(ats []qx.ActionLog) []*dto.ActionLogResponse {
	responses := make([]*dto.ActionLogResponse, 0, len(ats))

	for _, at := range ats {
		responses = append(responses, SerializeActionLog(&at))
	}

	return responses
}
