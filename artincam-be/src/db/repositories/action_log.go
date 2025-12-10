package repositories

import (
	"context"

	"artincam-be/src/db/qx"
)

type ActionLogRepoOption func(*ActionLogRepository)

type ActionLogRepository struct {
	Ctx context.Context
	Db  qx.DBTX
}

func NewActionLogRepository(ctx context.Context, db qx.DBTX, opts ...ActionLogRepoOption) *ActionLogRepository {
	r := &ActionLogRepository{
		Ctx: ctx,
		Db:  db,
	}

	for _, opt := range opts {
		opt(r)
	}

	return r
}

func (r *ActionLogRepository) GetAllActionLogs(params qx.GetAllActionLogsParams) ([]qx.ActionLog, error) {
	als, err := qx.New(r.Db).GetAllActionLogs(r.Ctx, params)

	if err != nil {
		return nil, err
	}

	return als, nil
}

func (r *ActionLogRepository) CountActionLogs(params qx.CountActionLogsParams) (int64, error) {
	count, err := qx.New(r.Db).CountActionLogs(r.Ctx, params)

	if err != nil {
		return 0, err
	}

	return count, nil
}

func (r *ActionLogRepository) GetActionLogByID(id int64) (*qx.ActionLog, error) {
	at, err := qx.New(r.Db).GetActionLogByID(r.Ctx, id)

	if err != nil {
		return nil, err
	}

	return &at, nil
}

func (r *ActionLogRepository) CreateActionLog(agentType qx.CreateActionLogParams) (*qx.ActionLog, error) {
	at, err := qx.New(r.Db).CreateActionLog(r.Ctx, agentType)

	if err != nil {
		return nil, err
	}

	return &at, nil
}

func (r *ActionLogRepository) DeleteActionLog(id int64) error {
	err := qx.New(r.Db).DeleteActionLog(r.Ctx, id)

	if err != nil {
		return err
	}

	return nil
}
