package repositories

import (
	"context"

	"artincam-be/src/db/qx"
)

type AssetFileRepoOption func(*AssetFileRepository)

type AssetFileRepository struct {
	Ctx context.Context
	Db  qx.DBTX
}

func NewAssetFileRepository(ctx context.Context, db qx.DBTX, opts ...AssetFileRepoOption) *AssetFileRepository {
	r := &AssetFileRepository{
		Ctx: ctx,
		Db:  db,
	}

	for _, opt := range opts {
		opt(r)
	}

	return r
}

func (r *AssetFileRepository) GetAllAssetFiles(
	params qx.GetAllAssetFilesParams, sortField string, sortOrder string,
) ([]qx.AssetFile, error) {

	var (
		ats []qx.AssetFile
		err error
	)

	// TODO: refactor this in the future to be less verbose and more dynamic
	if sortField == "timestamp" && sortOrder == "desc" {
		ats, err = qx.New(r.Db).GetAllAssetFilesTimestampDesc(r.Ctx, qx.GetAllAssetFilesTimestampDescParams{
			AgentID:  params.AgentID,
			Column1:  params.Column1,
			CameraID: params.CameraID,
			Column3:  params.Column3,
			Limit:    params.Limit,
			Offset:   params.Offset,
		})
	} else if sortField == "unique_id" && sortOrder == "asc" {
		ats, err = qx.New(r.Db).GetAllAssetFilesUniqueIdAsc(r.Ctx, qx.GetAllAssetFilesUniqueIdAscParams{
			AgentID:  params.AgentID,
			Column1:  params.Column1,
			CameraID: params.CameraID,
			Column3:  params.Column3,
			Limit:    params.Limit,
			Offset:   params.Offset,
		})
	} else if sortField == "unique_id" && sortOrder == "desc" {
		ats, err = qx.New(r.Db).GetAllAssetFilesUniqueIdDesc(r.Ctx, qx.GetAllAssetFilesUniqueIdDescParams{
			AgentID:  params.AgentID,
			Column1:  params.Column1,
			CameraID: params.CameraID,
			Column3:  params.Column3,
			Limit:    params.Limit,
			Offset:   params.Offset,
		})
	} else if sortField == "file_name" && sortOrder == "asc" {
		ats, err = qx.New(r.Db).GetAllAssetFilesFileNameAsc(r.Ctx, qx.GetAllAssetFilesFileNameAscParams{
			AgentID:  params.AgentID,
			Column1:  params.Column1,
			CameraID: params.CameraID,
			Column3:  params.Column3,
			Limit:    params.Limit,
			Offset:   params.Offset,
		})
	} else if sortField == "file_name" && sortOrder == "desc" {
		ats, err = qx.New(r.Db).GetAllAssetFilesFileNameDesc(r.Ctx, qx.GetAllAssetFilesFileNameDescParams{
			AgentID:  params.AgentID,
			Column1:  params.Column1,
			CameraID: params.CameraID,
			Column3:  params.Column3,
			Limit:    params.Limit,
			Offset:   params.Offset,
		})
	} else if sortField == "file_size" && sortOrder == "asc" {
		ats, err = qx.New(r.Db).GetAllAssetFilesFileSizeAsc(r.Ctx, qx.GetAllAssetFilesFileSizeAscParams{
			AgentID:  params.AgentID,
			Column1:  params.Column1,
			CameraID: params.CameraID,
			Column3:  params.Column3,
			Limit:    params.Limit,
			Offset:   params.Offset,
		})
	} else if sortField == "file_size" && sortOrder == "desc" {
		ats, err = qx.New(r.Db).GetAllAssetFilesFileSizeDesc(r.Ctx, qx.GetAllAssetFilesFileSizeDescParams{
			AgentID:  params.AgentID,
			Column1:  params.Column1,
			CameraID: params.CameraID,
			Column3:  params.Column3,
			Limit:    params.Limit,
			Offset:   params.Offset,
		})
	} else {
		ats, err = qx.New(r.Db).GetAllAssetFiles(r.Ctx, params)
	}

	if err != nil {
		return nil, err
	}

	return ats, nil
}

func (r *AssetFileRepository) CountAssetFiles(params qx.CountAssetFilesParams) (int64, error) {
	count, err := qx.New(r.Db).CountAssetFiles(r.Ctx, params)

	if err != nil {
		return 0, err
	}

	return count, nil
}

func (r *AssetFileRepository) GetAssetFileByID(id int64) (*qx.AssetFile, error) {
	at, err := qx.New(r.Db).GetAssetFileByID(r.Ctx, id)

	if err != nil {
		return nil, err
	}

	return &at, nil
}

func (r *AssetFileRepository) CreateAssetFile(assetFile qx.CreateAssetFileParams) (*qx.AssetFile, error) {
	at, err := qx.New(r.Db).CreateAssetFile(r.Ctx, assetFile)

	if err != nil {
		return nil, err
	}

	return &at, nil
}

func (r *AssetFileRepository) PatchAssetFile(assetFile qx.PatchAssetFileParams) (*qx.AssetFile, error) {
	at, err := qx.New(r.Db).PatchAssetFile(r.Ctx, assetFile)

	if err != nil {
		return nil, err
	}

	return &at, nil
}

func (r *AssetFileRepository) DeleteAssetFile(id int64) error {
	err := qx.New(r.Db).DeleteAssetFile(r.Ctx, id)

	if err != nil {
		return err
	}

	return nil
}
