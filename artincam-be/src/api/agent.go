package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"

	"artincam-be/src/db/qx"
	"artincam-be/src/db/repositories"
)

func (s *Server) agentRouter() http.Handler {
	r := chi.NewRouter()
	r.Get("/", s.agentListHandler)
	r.Post("/", s.createAgentHandler)
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
		render.JSON(w, r, CreateErrorResponse("Failed to fetch agents"))
		return
	}

	render.Status(r, http.StatusCreated)
	render.JSON(w, r, CreateResponse(agents))
}

// Agent godoc
// @Summary      Create an agent
// @Description  Create an agent
// @Tags         agent
// @Accept       json
// @Produce      json
// @Param        agent  body      qx.CreateAgentParams  true  "AgentCreate"
// @Success      201 {object} dto.AgentResponse
// @Router       /api/v1/agents [post]
func (s *Server) createAgentHandler(w http.ResponseWriter, r *http.Request) {
	var agentParams qx.CreateAgentParams

	repo := repositories.NewAgentRepository(r.Context(), s.DbConn)

	if err := DecodeRequestBody(w, r, &agentParams); err != nil {
		return
	}

	agent, err := repo.CreateAgent(agentParams)

	if err != nil {
		render.Status(r, http.StatusInternalServerError)
		render.JSON(w, r, CreateErrorResponse("Failed to create agent."))
		return
	}

	render.Status(r, http.StatusCreated)
	render.JSON(w, r, CreateResponse(agent))
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

// // Post godoc
// // @Summary      Send action to agent
// // @Description  Send action to agent
// // @Tags         agent
// // @Accept       json
// // @Produce      json
// // @Param        id   path      string  true  "Agent ID"
// // @Param        agent-action  body      types.AgentAction  true  "AgentAction"
// // @Router       /api/v1/agents/{id}/action [post]
// func AgentCommandHandler(s *Server) func(w http.ResponseWriter, r *http.Request) {
// 	return func(w http.ResponseWriter, r *http.Request) {
// 		var action types.AgentAction

// 		if err := DecodeRequestBody(w, r, &action); err != nil {
// 			return
// 		}

// 		agentId := chi.URLParam(r, "id")
// 		conn, exists := s.Connections.Get(agentId)

// 		if !exists {
// 			render.Status(r, http.StatusBadRequest)
// 			render.JSON(w, r, CreateErrorResponse("Agent is not online."))
// 		}

// 		// send message
// 		action.Type = "camera-command"
// 		conn.Conn.WriteJSON(action)

// 		render.Status(r, http.StatusCreated)
// 		render.JSON(w, r, CreateResponse(action))
// 	}
// }
