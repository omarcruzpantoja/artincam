package repositories

import (
	"context"

	"artincam-be/src/db/qx"
)

type AgentTypeRepoOption func(*AgentTypeRepository)

type AgentTypeRepository struct {
	Ctx context.Context
	Db  qx.DBTX
}

func NewAgentTypeRepository(ctx context.Context, db qx.DBTX, opts ...AgentTypeRepoOption) *AgentTypeRepository {
	r := &AgentTypeRepository{
		Ctx: ctx,
		Db:  db,
	}

	for _, opt := range opts {
		opt(r)
	}

	return r
}

func (r *AgentTypeRepository) GetAllAgentTypes() ([]qx.AgentType, error) {
	ats, err := qx.New(r.Db).GetAllAgentTypes(r.Ctx)

	if err != nil {
		return nil, err
	}

	return ats, nil
}

func (r *AgentTypeRepository) GetAgentTypeByID(id int64) (*qx.AgentType, error) {
	at, err := qx.New(r.Db).GetAgentTypeByID(r.Ctx, id)

	if err != nil {
		return nil, err
	}

	return &at, nil
}

func (r *AgentTypeRepository) CreateAgentType(agentType qx.CreateAgentTypeParams) (*qx.AgentType, error) {
	at, err := qx.New(r.Db).CreateAgentType(r.Ctx, agentType)
	if err != nil {
		return nil, err
	}

	return &at, nil
}

func (r *AgentTypeRepository) PatchAgentType(agent qx.PatchAgentTypeParams) (*qx.AgentType, error) {
	at, err := qx.New(r.Db).PatchAgentType(r.Ctx, agent)

	if err != nil {
		return nil, err
	}

	return &at, nil
}

func (r *AgentTypeRepository) DeleteAgentType(id int64) error {
	err := qx.New(r.Db).DeleteAgentType(r.Ctx, id)

	if err != nil {
		return err
	}

	return nil
}
