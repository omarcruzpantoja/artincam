package repositories

import (
	"context"

	"artincam-be/src/db/qx"

	"github.com/google/uuid"
)

type AgentRepoOption func(*AgentRepository)

type AgentRepository struct {
	Ctx context.Context
	Db  qx.DBTX
}

func NewAgentRepository(ctx context.Context, db qx.DBTX, opts ...AgentRepoOption) *AgentRepository {
	r := &AgentRepository{
		Ctx: ctx,
		Db:  db,
	}

	for _, opt := range opts {
		opt(r)
	}

	return r
}

func (r *AgentRepository) GetAllAgents() ([]qx.Agent, error) {
	agents, err := qx.New(r.Db).GetAllAgents(r.Ctx)

	if err != nil {
		return nil, err
	}

	return agents, nil
}

func (r *AgentRepository) GetAgentByID(id string) (*qx.Agent, error) {
	agent, err := qx.New(r.Db).GetAgentByID(r.Ctx, id)

	if err != nil {
		return nil, err
	}

	return &agent, nil
}

func (r *AgentRepository) CreateAgent(agent qx.CreateAgentParams) (*qx.Agent, error) {
	if agent.ID == "" {
		agent.ID = uuid.New().String()
	}

	a, err := qx.New(r.Db).CreateAgent(r.Ctx, agent)

	if err != nil {

		return nil, err
	}

	return &a, nil
}

func (r *AgentRepository) PatchAgent(agent qx.PatchAgentParams) (*qx.Agent, error) {
	a, err := qx.New(r.Db).PatchAgent(r.Ctx, agent)

	if err != nil {
		return nil, err
	}

	return &a, nil
}

func (r *AgentRepository) DeleteAgent(id string) error {
	err := qx.New(r.Db).DeleteAgent(r.Ctx, id)

	if err != nil {
		return err
	}

	return nil
}
