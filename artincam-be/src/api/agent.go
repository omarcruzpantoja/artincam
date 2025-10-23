package api

import (
	"artincam-be/src/types"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
)

func agentRouter(s *Server) http.Handler {
	r := chi.NewRouter()
	r.Get("/", TempAgentListHandler(s))
	r.Post("/{id}/action", AgentCommandHandler(s))

	return r
}

// // List godoc
// // @Summary      List agents
// // @Description  List agents
// // @Tags         agent
// // @Accept       json
// // @Produce      json
// // @Router       /api/v1/agents [get]
// func AgentListHandler(w http.ResponseWriter, r *http.Request) {

// 	render.Status(r, http.StatusCreated)
// 	render.JSON(w, r, CreateResponse("boo"))
// }

// List godoc
// @Summary      List agents
// @Description  List agents
// @Tags         agent
// @Accept       json
// @Produce      json
// @Router       /api/v1/agents [get]
func TempAgentListHandler(s *Server) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		activeConn := s.Connections.ListIDs()

		render.Status(r, http.StatusCreated)
		render.JSON(w, r, CreateResponse(activeConn))
	}
}

// Post godoc
// @Summary      Send action to agent
// @Description  Send action to agent
// @Tags         agent
// @Accept       json
// @Produce      json
// @Param        id   path      string  true  "Agent ID"
// @Param        agent-action  body      types.AgentAction  true  "AgentAction"
// @Router       /api/v1/agents/{id}/action [post]
func AgentCommandHandler(s *Server) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		var action types.AgentAction

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
