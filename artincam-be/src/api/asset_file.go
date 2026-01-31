package api

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
	"github.com/guregu/null/v6"

	"artincam-be/src/api/dto"
	"artincam-be/src/api/filters"
	"artincam-be/src/api/serializers"
	"artincam-be/src/db/qx"
	"artincam-be/src/db/repositories"
)

func (s *Server) assetFileRouter() http.Handler {
	r := chi.NewRouter()
	r.Get("/", s.assetFileListHandler)
	r.Get("/{id}/content", s.GetAgentContent)
	r.Post("/", s.createAssetFileHandler)
	r.Patch("/{id}", s.PatchAssetFileHandler)

	return r
}

// List godoc
// @Summary      List assetFiles
// @Description  List assetFiles
// @Tags         asset-file
// @Accept       json
// @Produce      json
// @Router       /api/v1/asset-files [get]
// @Param        agent_id   query     string  false  "Filter by Agent ID"
// @Param        limit      query     int64   false  "Limit number of results"
// @Param        offset     query     int64   false  "Offset for results"
// @Success      200 {array} dto.AssetFileResponse
func (s *Server) assetFileListHandler(w http.ResponseWriter, r *http.Request) {
	repo := repositories.NewAssetFileRepository(r.Context(), s.DbConn)
	filter := filters.AssetFileFilter{}

	if err := filter.Parse(r.URL.Query()); err != nil {
		render.Status(r, http.StatusBadRequest)
		render.JSON(w, r, CreateErrorResponse("Invalid filter parameters."))
		return
	}

	params := qx.GetAllAssetFilesParams{
		AgentID:     null.StringFromPtr(filter.AgentID).String,
		Column1:     null.StringFromPtr(filter.AgentID).NullString,
		Timestamp:   null.TimeFromPtr(filter.StartDate).Time,
		Column5:     null.TimeFromPtr(filter.StartDate).NullTime,
		Timestamp_2: null.TimeFromPtr(filter.EndDate).Time,
		Column7:     null.TimeFromPtr(filter.EndDate).NullTime,
		Limit:       filter.Limit,
		Offset:      filter.Offset,
	}
	assetFiles, err := repo.GetAllAssetFiles(params, filter.SortField, filter.SortOrder)

	if err != nil {
		render.Status(r, http.StatusInternalServerError)
		render.JSON(w, r, CreateErrorResponse("Failed to fetch assetFiles"))
		return
	}

	assetFileCount, err := repo.CountAssetFiles(qx.CountAssetFilesParams{
		Column1: null.StringFromPtr(filter.AgentID).NullString,
		AgentID: null.StringFromPtr(filter.AgentID).String,
	})

	if err != nil {
		render.Status(r, http.StatusInternalServerError)
		render.JSON(w, r, CreateErrorResponse("Failed to fetch assetFiles"))
		return
	}

	response := CreateResponse(serializers.SerializeAssetFiles(assetFiles))
	response.Meta = MetaResponse{
		Count: assetFileCount,
	}

	render.Status(r, http.StatusOK)
	render.JSON(w, r, response)
}

// Agent godoc
// @Summary      Create an assetFile
// @Description  Create an assetFile
// @Tags         asset-file
// @Accept       json
// @Produce      json
// @Param        assetFile  body      qx.CreateAssetFileParams  true  "AgentCreate"
// @Success      201 {object} dto.AssetFileResponse
// @Router       /api/v1/asset-files [post]
func (s *Server) createAssetFileHandler(w http.ResponseWriter, r *http.Request) {
	assetFile := qx.CreateAssetFileParams{}

	repo := repositories.NewAssetFileRepository(r.Context(), s.DbConn)

	if err := DecodeRequestBody(w, r, &assetFile); err != nil {
		return
	}

	af, err := repo.CreateAssetFile(assetFile)

	if err != nil {
		render.Status(r, http.StatusInternalServerError)
		render.JSON(w, r, CreateErrorResponse("Failed to create assetFile."))
		return
	}

	render.Status(r, http.StatusCreated)
	render.JSON(w, r, CreateResponse(serializers.SerializeAssetFile(af)))
}

// Agent godoc
// @Summary      Update an assetFile
// @Description  Update an assetFile
// @Tags         asset-file
// @Accept       json
// @Produce      json
// @Param        id         path      int64                      true  "Asset File ID"
// @Param        assetFile  body      dto.AssetFilePatchRequest  true  "AgentUpdate"
// @Success      200 {object} dto.AssetFilePatchRequest
// @Router       /api/v1/asset-files/{id}/ [patch]
func (s *Server) PatchAssetFileHandler(w http.ResponseWriter, r *http.Request) {
	assetFile := dto.AssetFilePatchRequest{}
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)

	if err != nil {
		render.Status(r, http.StatusBadRequest)
		render.JSON(w, r, CreateErrorResponse("Invalid asset file ID."))
		return
	}

	repo := repositories.NewAssetFileRepository(r.Context(), s.DbConn)

	af, err := repo.GetAssetFileByID(id)

	if err != nil {
		render.Status(r, http.StatusNotFound)
		render.JSON(w, r, CreateErrorResponse("Asset file not found."))
		return
	}
	if err := DecodeRequestBody(w, r, &assetFile); err != nil {
		return
	}

	afParams := qx.PatchAssetFileParams{
		ID:        af.ID,
		CameraID:  null.StringFromPtr(assetFile.CameraID).NullString,
		Location:  null.StringFromPtr(assetFile.Location).NullString,
		Timestamp: null.TimeFromPtr(assetFile.Timestamp).NullTime,
		UniqueID:  null.StringFromPtr(assetFile.UniqueID).NullString,
		FileName:  null.StringFromPtr(assetFile.FileName).NullString,
		FileSize:  null.IntFromPtr(assetFile.FileSize).NullInt64,
	}

	af, err = repo.PatchAssetFile(afParams)

	if err != nil {
		render.Status(r, http.StatusInternalServerError)
		render.JSON(w, r, CreateErrorResponse("Failed to update assetFile."))
		return
	}

	render.Status(r, http.StatusOK)
	render.JSON(w, r, CreateResponse(serializers.SerializeAssetFile(af)))
}

// AgentSnapshot godoc
// @Summary      Get asset file content
// @Description  Get asset file content
// @Tags         asset-file
// @Accept       json
// @Produce      image/jpeg
// @Param        id   path      int64  true  "Asset File ID"
// @Success      200 {file}  jpeg
// @Router       /api/v1/asset-files/{id}/content [get]
func (s *Server) GetAgentContent(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)

	if err != nil {
		render.Status(r, http.StatusBadRequest)
		render.JSON(w, r, CreateErrorResponse("Invalid asset file ID."))
		return
	}

	af, err := repositories.NewAssetFileRepository(r.Context(), s.DbConn).GetAssetFileByID(id)

	// Resolve latest content path for agent
	if err != nil {
		http.Error(w, "Asset file not found.", http.StatusNotFound)
		return
	}

	agent, err := repositories.NewAgentRepository(r.Context(), s.DbConn).GetAgentByID(af.AgentID)

	if err != nil {
		http.Error(w, "Agent not found.", http.StatusNotFound)
		return
	}

	config := &dto.ArtincamPiAgentConfig{}
	err = json.Unmarshal([]byte(agent.Config), &config)

	if err != nil {
		render.Status(r, http.StatusInternalServerError)
		render.JSON(w, r, CreateErrorResponse("Failed to parse agent config."))
		return
	}

	fileName := config.AgentDir + "/" + config.Camera.OutputDir + "/" + af.FileName
	file, err := os.Open(fileName)

	if err != nil {
		http.Error(w, "Asset file content not found.", http.StatusNotFound)
		return
	}

	defer file.Close()

	// If the file is a video, set the appropriate content type
	if !strings.HasSuffix(af.FileName, ".jpg") {
		render.Status(r, http.StatusUnprocessableEntity)
		render.JSON(w, r, CreateErrorResponse("Asset file type is not supported for content retrieval."))
		return
	}

	w.Header().Set("Content-Type", "image/jpeg")
	w.Header().Set("Cache-Control", "no-store")
	io.Copy(w, file)
}
