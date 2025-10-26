package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"artincam-be/src/db/qx"
	"artincam-be/src/tools/connectionmap"
)

type Server struct {
	Addr        string
	router      *chi.Mux
	Connections *connectionmap.ConnectionMap
	DbConn      qx.DBTX
	// In here we have wss connection holder
}

type ServerOption func(*Server)

func NewServer(addr string, opts ...ServerOption) *Server {
	r := chi.NewRouter()

	s := &Server{
		Addr:        addr,
		router:      r,
		Connections: connectionmap.New(),
	}

	for _, opt := range opts {
		opt(s)
	}

	s.registerRoutes()
	return s
}

func (s *Server) Start() error {
	return http.ListenAndServe(s.Addr, s.router)
}
