package api

import (
	"github.com/go-chi/chi/v5"
	httpSwagger "github.com/swaggo/http-swagger"

	_ "artincam-be/docs"
)

func (s *Server) registerRoutes() {
	s.router.Route("/api/", func(r chi.Router) {
		r.Mount("/v1/agents", s.agentRouter())
		r.Mount("/v1/agent-types", s.agentTypeRouter())
	})

	s.router.Route("/ws/", func(r chi.Router) {
		r.Get("/v1/agent/{id}", s.wsAgentConnectionHandler(s.Connections))
	})

	// access swagger in browser with /swagger/index.html
	s.router.Get("/swagger/*", httpSwagger.Handler(
		httpSwagger.URL("http://localhost:8080/swagger/doc.json")))

}
