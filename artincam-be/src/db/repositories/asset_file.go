package repositories

import (
	"context"
	"fmt"

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

func (r *AssetFileRepository) GetAllAssetFiles() ([]qx.AssetFile, error) {
	ats, err := qx.New(r.Db).GetAllAssetFiles(r.Ctx)

	if err != nil {
		return nil, err
	}

	return ats, nil
}

func (r *AssetFileRepository) GetAssetFileByID(id int64) (*qx.AssetFile, error) {
	at, err := qx.New(r.Db).GetAssetFileByID(r.Ctx, id)

	if err != nil {
		return nil, err
	}

	return &at, nil
}

func (r *AssetFileRepository) CreateAssetFile(agentType qx.CreateAssetFileParams) (*qx.AssetFile, error) {
	at, err := qx.New(r.Db).CreateAssetFile(r.Ctx, agentType)
	if err != nil {
		fmt.Println((err))
		return nil, err
	}

	return &at, nil
}

func (r *AssetFileRepository) PatchAssetFile(agent qx.PatchAssetFileParams) (*qx.AssetFile, error) {
	at, err := qx.New(r.Db).PatchAssetFile(r.Ctx, agent)

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
