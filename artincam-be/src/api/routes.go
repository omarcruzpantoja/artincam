package api

func (s *Server) registerRoutes() {
	s.router.Get("/ws/agent", WsAgentConnectionHandler(s.Connections))
}
