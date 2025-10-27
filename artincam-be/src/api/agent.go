package api

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"

	"artincam-be/src/api/dto"
	"artincam-be/src/api/schemas"
	"artincam-be/src/api/serializers"
	"artincam-be/src/db/qx"
	"artincam-be/src/db/repositories"
)

func (s *Server) agentRouter() http.Handler {
	r := chi.NewRouter()
	r.Get("/", s.agentListHandler)
	r.Post("/", s.createAgentHandler)
	r.Patch("/{id}", s.patchAgentHandler)
	r.Delete("/{id}", s.deleteAgentHandler)
	// r.Get("/", TempAgentListHandler(s))
	// r.Post("/{id}/action", AgentCommandHandler(s))

	return r
}

// List godoc
// @Summary      List agents
// @Description  List agents
// @Tags         agent
// @Accept       json
// @Produce      json
// @Router       /api/v1/agents [get]
// @Success      200 {array} dto.AgentResponse
func (s *Server) agentListHandler(w http.ResponseWriter, r *http.Request) {
	repo := repositories.NewAgentRepository(r.Context(), s.DbConn)
	agents, err := repo.GetAllAgents()

	if err != nil {
		render.Status(r, http.StatusInternalServerError)
		render.JSON(w, r, CreateErrorResponse("Failed to fetch agents."))
		return
	}

	render.Status(r, http.StatusCreated)
	render.JSON(w, r, CreateResponse(serializers.SerializeAgents(agents)))
}

// Agent godoc
// @Summary      Create an agent
// @Description  Create an agent
// @Tags         agent
// @Accept       json
// @Produce      json
// @Param        agent  body      dto.AgentCreateRequestParams  true  "AgentCreate"
// @Success      201 {object} dto.AgentResponse
// @Router       /api/v1/agents [post]
func (s *Server) createAgentHandler(w http.ResponseWriter, r *http.Request) {
	var (
		agentParams dto.AgentCreateRequestParams
		agt         qx.CreateAgentParams
		configBytes []byte
		err         error
	)

	repo := repositories.NewAgentRepository(r.Context(), s.DbConn)

	if err = DecodeRequestBody(w, r, &agentParams); err != nil {
		return
	}

	configBytes, err = json.Marshal(agentParams.Config)

	if err != nil {
		render.Status(r, http.StatusUnprocessableEntity)
		render.JSON(w, r, CreateErrorResponse("Invalid agent config format."))
		return
	}

	if err = validateConfig(agentParams.AgentTypeID, configBytes); err != nil {
		render.Status(r, http.StatusUnprocessableEntity)
		render.JSON(w, r, CreateErrorResponse("Invalid agent config format."))
		return
	}

	agt.Name = agentParams.Name
	agt.Description = agentParams.Description
	agt.AgentTypeID = agentParams.AgentTypeID
	agt.Config = string(configBytes)

	agent, err := repo.CreateAgent(agt)

	if err != nil {
		render.Status(r, http.StatusInternalServerError)
		render.JSON(w, r, CreateErrorResponse("Failed to create agent."))
		return
	}

	render.Status(r, http.StatusCreated)
	render.JSON(w, r, CreateResponse(serializers.SerializeAgent(agent)))
}

// Agent godoc
// @Summary      Update an agent
// @Description  Update an agent
// @Tags         agent
// @Accept       json
// @Produce      json
// @param 			id   path      string  true  "Agent ID"
// @Param        agent  body      dto.AgentPatchRequestParams  true  "PatchAgent"
// @Success      200 {object} dto.AgentResponse
// @Router       /api/v1/agents/{id} [patch]
func (s *Server) patchAgentHandler(w http.ResponseWriter, r *http.Request) {
	var (
		agt         qx.PatchAgentParams
		agentParams dto.AgentPatchRequestParams
		configBytes []byte
		err         error
		agent       *qx.Agent
	)

	id := chi.URLParam(r, "id")
	repo := repositories.NewAgentRepository(r.Context(), s.DbConn)
	agent, err = repo.GetAgentByID(id)

	if err != nil {
		render.Status(r, http.StatusNotFound)
		render.JSON(w, r, CreateErrorResponse("Agent not found."))
		return
	}

	if err = DecodeRequestBody(w, r, &agentParams); err != nil {
		return
	}

	configBytes, err = json.Marshal(agentParams.Config)

	if err != nil {
		render.Status(r, http.StatusUnprocessableEntity)
		render.JSON(w, r, CreateErrorResponse("Invalid agent config json."))
		return
	}

	if err = validateConfig(agent.AgentTypeID, configBytes); err != nil {
		render.Status(r, http.StatusUnprocessableEntity)
		render.JSON(w, r, CreateErrorResponse("Invalid agent config format."))
		return
	}

	agt.ID = id
	agt.Name = agentParams.Name
	agt.Description = agentParams.Description
	agt.Config = string(configBytes)
	agent, err = repo.PatchAgent(agt)

	if err != nil {
		render.Status(r, http.StatusInternalServerError)
		render.JSON(w, r, CreateErrorResponse("Failed to update agent."))
		return
	}

	render.Status(r, http.StatusCreated)
	render.JSON(w, r, CreateResponse(serializers.SerializeAgent(agent)))
}

// Agent godoc
// @Summary      Delete an agent
// @Description  Delete an agent
// @Tags         agent
// @Accept       json
// @Produce      json
// @param 			id   path      string  true  "Agent ID"
// @Success      204
// @Router       /api/v1/agents/{id} [delete]
func (s *Server) deleteAgentHandler(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	repo := repositories.NewAgentRepository(r.Context(), s.DbConn)
	err := repo.DeleteAgent(id)

	if err != nil {
		render.Status(r, http.StatusInternalServerError)
		render.JSON(w, r, CreateErrorResponse("Failed to delete agent."))
		return
	}

	render.Status(r, http.StatusNoContent)
}

// // List godoc
// // @Summary      List agents
// // @Description  List agents
// // @Tags         agent
// // @Accept       json
// // @Produce      json
// // @Router       /api/v1/agents [get]
// func TempAgentListHandler(s *Server) func(w http.ResponseWriter, r *http.Request) {
// 	return func(w http.ResponseWriter, r *http.Request) {
// 		activeConn := s.Connections.ListIDs()

// 		render.Status(r, http.StatusCreated)
// 		render.JSON(w, r, CreateResponse(activeConn))
// 	}
// }

// Post godoc
// @Summary      Send action to agent
// @Description  Send action to agent
// @Tags         agent
// @Accept       json
// @Produce      json
// @Param        id   path      string  true  "Agent ID"
// @Param        agent-action  body      dto.AgentActionMessage  true  "AgentAction"
// @Router       /api/v1/agents/{id}/action [post]
func AgentCommandHandler(s *Server) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		var action dto.AgentActionMessage

		if err := DecodeRequestBody(w, r, &action); err != nil {
			return
		}

		agentId := chi.URLParam(r, "id")
		conn, exists := s.Connections.Get(agentId)

		if !exists {
			render.Status(r, http.StatusBadRequest)
			render.JSON(w, r, CreateErrorResponse("Agent is not online."))
		}

		// send message
		action.Type = "camera-command"
		conn.Conn.WriteJSON(action)

		render.Status(r, http.StatusCreated)
		render.JSON(w, r, CreateResponse(action))
	}
}

func validateConfig(agentType int64, configBytes []byte) error {
	switch agentType {
	case 1: // Artincam
		return schemas.Validate(schemas.ArtincamAgentConfigSchema, configBytes)
	}
	return nil
}
