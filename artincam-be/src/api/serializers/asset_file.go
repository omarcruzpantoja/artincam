package serializers

import (
	"artincam-be/src/api/dto"
	"artincam-be/src/db/qx"
	"time"
)

func SerializeAssetFile(at *qx.AssetFile) *dto.AssetFileResponse {
	var (
		createdAt *time.Time
		updatedAt *time.Time
	)

	if at.CreatedAt.Valid {
		createdAt = &at.CreatedAt.Time
	}

	if at.UpdatedAt.Valid {
		updatedAt = &at.UpdatedAt.Time
	}

	return &dto.AssetFileResponse{
		ID:        at.ID,
		AgentID:   at.AgentID,
		CameraID:  at.CameraID,
		Location:  at.Location,
		Timestamp: at.Timestamp,
		UniqueID:  at.UniqueID,
		FileName:  at.FileName,
		FileSize:  at.FileSize,
		CreatedAt: createdAt,
		UpdatedAt: updatedAt,
	}
}

func SerializeAssetFiles(ats []qx.AssetFile) []*dto.AssetFileResponse {
	responses := make([]*dto.AssetFileResponse, 0, len(ats))

	for _, at := range ats {
		responses = append(responses, SerializeAssetFile(&at))
	}

	return responses
}
