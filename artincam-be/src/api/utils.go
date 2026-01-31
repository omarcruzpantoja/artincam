package api

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-chi/render"
)

// ----- RESPONSES -----

type DataResponse struct {
	Meta interface{} `json:"meta,omitempty"`
	Data interface{} `json:"data,omitempty"`
}

type ErrorResponse struct {
	Detail string `json:"detail,omitempty"`
}

type MetaResponse struct {
	Count int64 `json:"count,omitempty"`
}

func DecodeRequestBody(w http.ResponseWriter, r *http.Request, bind interface{}) error {
	err := json.NewDecoder(r.Body).Decode(&bind)

	if err != nil {
		// TODO: use better logging solution
		log.Printf("Error while decoding: %v\n", err)

		// If there is an error in decoding, return 400 Bad Request
		render.Status(r, http.StatusUnprocessableEntity)
		render.JSON(w, r, CreateErrorResponse("Invalid attributes provided."))

		return err
	}
	return nil
}

func CreateErrorResponse(detail string) *ErrorResponse {
	return &ErrorResponse{
		Detail: detail,
	}
}

func CreateResponse(data interface{}) *DataResponse {
	return &DataResponse{
		Meta: nil,
		Data: data,
	}
}
