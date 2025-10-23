package api

import (
	"artincam-be/src/tools/connectionmap"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type Server struct {
	Addr        string
	router      *chi.Mux
	Connections *connectionmap.ConnectionMap
	// In here we have wss connection holder
}

func NewServer(addr string) *Server {
	r := chi.NewRouter()

	s := &Server{
		Addr:   addr,
		router: r,
		Connections: connectionmap.New(),
	}

	s.registerRoutes()
	return s
}

func (s *Server) Start() error {
	return http.ListenAndServe(s.Addr, s.router)
}
