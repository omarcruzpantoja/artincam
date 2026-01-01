package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rs/cors"

	"artincam-be/src/db/qx"
	"artincam-be/src/tools/connectionmap"
)

type Server struct {
	Addr        string
	router      *chi.Mux
	httpHandler http.Handler
	Connections *connectionmap.ConnectionMap
	DbConn      qx.DBTX
	// In here we have wss connection holder
}

type ServerOption func(*Server)

func NewServer(addr string, opts ...ServerOption) *Server {
	r := chi.NewRouter()

	// ----- Set up CORS -----
	handler := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: false, // if sending cookies/auth headers
	}).Handler(r)

	s := &Server{
		Addr:        addr,
		router:      r,
		Connections: connectionmap.New(),
		httpHandler: handler,
	}

	for _, opt := range opts {
		opt(s)
	}

	s.registerRoutes()
	return s
}

func (s *Server) Start() error {
	return http.ListenAndServe(s.Addr, s.httpHandler)
}
