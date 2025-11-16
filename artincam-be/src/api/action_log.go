package api

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"

	"artincam-be/src/api/dto"
	"artincam-be/src/api/serializers"
	"artincam-be/src/db/qx"
	"artincam-be/src/db/repositories"
)

func (s *Server) actionLogRouter() http.Handler {
	r := chi.NewRouter()
	r.Get("/", s.actionLogListHandler)
	r.Post("/", s.createActionLogHandler)

	return r
}

// List godoc
// @Summary      List actionLogs
// @Description  List actionLogs
// @Tags         action-log
// @Accept       json
// @Produce      json
// @Router       /api/v1/action-logs [get]
// @Success      200 {array} dto.ActionLogResponse
func (s *Server) actionLogListHandler(w http.ResponseWriter, r *http.Request) {
	repo := repositories.NewActionLogRepository(r.Context(), s.DbConn)
	actionLogs, err := repo.GetAllActionLogs()

	if err != nil {
		render.Status(r, http.StatusInternalServerError)
		render.JSON(w, r, CreateErrorResponse("Failed to fetch actionLogs"))
		return
	}

	render.Status(r, http.StatusCreated)
	render.JSON(w, r, CreateResponse(serializers.SerializeActionLogs(actionLogs)))
}

// Agent godoc
// @Summary      Create an actionLog
// @Description  Create an actionLog
// @Tags         action-log
// @Accept       json
// @Produce      json
// @Param        actionLog  body      dto.ActionLogCreateRequestParams  true  "ActionLog Create"
// @Success      201 {object} dto.ActionLogResponse
// @Router       /api/v1/action-logs [post]
func (s *Server) createActionLogHandler(w http.ResponseWriter, r *http.Request) {
	var (
		rParams      dto.ActionLogCreateRequestParams
		createParams qx.CreateActionLogParams
	)

	repo := repositories.NewActionLogRepository(r.Context(), s.DbConn)

	if err := DecodeRequestBody(w, r, &rParams); err != nil {
		return
	}

	jsonString, err := json.Marshal(rParams.Message)

	if err != nil {
		render.Status(r, http.StatusUnprocessableEntity)
		render.JSON(w, r, CreateErrorResponse("Invalid agent config json."))
		return
	}

	createParams.AgentID = rParams.AgentID
	createParams.Message = string(jsonString)
	createParams.Category = rParams.Category

	actionLog, err := repo.CreateActionLog(createParams)

	if err != nil {
		render.Status(r, http.StatusInternalServerError)
		render.JSON(w, r, CreateErrorResponse("Failed to create actionLog."))
		return
	}

	render.Status(r, http.StatusCreated)
	render.JSON(w, r, CreateResponse(serializers.SerializeActionLog(actionLog)))
}
