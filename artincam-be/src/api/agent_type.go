package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"

	"artincam-be/src/api/serializers"
	"artincam-be/src/db/qx"
	"artincam-be/src/db/repositories"
)

func (s *Server) agentTypeRouter() http.Handler {
	r := chi.NewRouter()
	r.Get("/", s.agentTypeListHandler)
	r.Post("/", s.createAgentTypeHandler)

	return r
}

// List godoc
// @Summary      List agentTypes
// @Description  List agentTypes
// @Tags         agent-type
// @Accept       json
// @Produce      json
// @Router       /api/v1/agent-types [get]
// @Success      200 {array} dto.AgentTypeResponse
func (s *Server) agentTypeListHandler(w http.ResponseWriter, r *http.Request) {
	repo := repositories.NewAgentTypeRepository(r.Context(), s.DbConn)
	agentTypes, err := repo.GetAllAgentTypes()

	if err != nil {
		render.Status(r, http.StatusInternalServerError)
		render.JSON(w, r, CreateErrorResponse("Failed to fetch agentTypes"))
		return
	}

	render.Status(r, http.StatusCreated)
	render.JSON(w, r, CreateResponse(serializers.SerializeAgentTypes(agentTypes)))
}

// Agent godoc
// @Summary      Create an agentType
// @Description  Create an agentType
// @Tags         agent-type
// @Accept       json
// @Produce      json
// @Param        agentType  body      qx.CreateAgentTypeParams  true  "AgentCreate"
// @Success      201 {object} dto.AgentTypeResponse
// @Router       /api/v1/agent-types [post]
func (s *Server) createAgentTypeHandler(w http.ResponseWriter, r *http.Request) {
	var agentTypeParams qx.CreateAgentTypeParams

	repo := repositories.NewAgentTypeRepository(r.Context(), s.DbConn)

	if err := DecodeRequestBody(w, r, &agentTypeParams); err != nil {
		return
	}

	agentType, err := repo.CreateAgentType(agentTypeParams)

	if err != nil {
		render.Status(r, http.StatusInternalServerError)
		render.JSON(w, r, CreateErrorResponse("Failed to create agentType."))
		return
	}

	render.Status(r, http.StatusCreated)
	render.JSON(w, r, CreateResponse(serializers.SerializeAgentType(agentType)))
}
