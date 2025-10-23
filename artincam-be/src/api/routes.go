package api

import (
	_ "artincam-be/docs"

	"github.com/go-chi/chi/v5"

	httpSwagger "github.com/swaggo/http-swagger"
)

func (s *Server) registerRoutes() {
	s.router.Route("/api/", func(r chi.Router) {
		r.Mount("/v1/agents", agentRouter(s))
	})
	s.router.Get("/ws/agent", WsAgentConnectionHandler(s.Connections))

	// access swagger in browser with /swagger/index.html
	s.router.Get("/swagger/*", httpSwagger.Handler(
		httpSwagger.URL("http://localhost:8080/swagger/doc.json")))

}
