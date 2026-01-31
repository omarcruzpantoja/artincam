package api

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
	"github.com/guregu/null/v6"

	"artincam-be/src/api/dto"
	"artincam-be/src/api/filters"
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
// @Param        agent_id   query     string  false  "Filter by Agent ID"
// @Param        category   query     string  false  "Filter by Category"
// @Param        limit      query     int64   false  "Limit number of results"
// @Param        offset     query     int64   false  "Offset for results"
// @Success      200 {array} dto.ActionLogResponse
func (s *Server) actionLogListHandler(w http.ResponseWriter, r *http.Request) {
	repo := repositories.NewActionLogRepository(r.Context(), s.DbConn)
	filter := filters.ActionLogFilter{}

	if err := filter.Parse(r.URL.Query()); err != nil {
		render.Status(r, http.StatusBadRequest)
		render.JSON(w, r, CreateErrorResponse("Invalid filter parameters."))
		return
	}

	actionLogs, err := repo.GetAllActionLogs(qx.GetAllActionLogsParams{
		AgentID:     null.StringFromPtr(filter.AgentID).String,
		Column1:     null.StringFromPtr(filter.AgentID).NullString,
		Category:    null.StringFromPtr(filter.Category).String,
		Column3:     null.StringFromPtr(filter.Category).NullString,
		CreatedAt:   null.TimeFromPtr(filter.StartDate).NullTime,
		Column5:     null.TimeFromPtr(filter.StartDate).NullTime,
		CreatedAt_2: null.TimeFromPtr(filter.EndDate).NullTime,
		Column7:     null.TimeFromPtr(filter.StartDate).NullTime,
		Limit:       filter.Limit,
		Offset:      filter.Offset,
	})

	if err != nil {
		render.Status(r, http.StatusInternalServerError)
		render.JSON(w, r, CreateErrorResponse("Failed to fetch actionLogs"))
		return
	}

	actionLogCount, err := repo.CountActionLogs(qx.CountActionLogsParams{
		Column1: null.StringFromPtr(filter.AgentID).NullString,
		AgentID: null.StringFromPtr(filter.AgentID).String,
	})

	response := CreateResponse(serializers.SerializeActionLogs(actionLogs))
	response.Meta = MetaResponse{
		Count: actionLogCount,
	}

	render.Status(r, http.StatusOK)
	render.JSON(w, r, response)
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
