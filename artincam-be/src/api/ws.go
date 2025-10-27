package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"

	"artincam-be/src/api/dto"
	"artincam-be/src/db/qx"
	"artincam-be/src/db/repositories"
	"artincam-be/src/tools/connectionmap"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func (s *Server) wsAgentConnectionHandler(connectionMap *connectionmap.ConnectionMap) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {

		// get all query params
		ctx := r.Context()
		agentId := chi.URLParam(r, "id")

		repo := repositories.NewAgentRepository(ctx, s.DbConn)
		agent, err := repo.GetAgentByID(agentId)

		if err != nil {
			http.Error(w, "Agent not found", http.StatusNotFound)
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		wsConn := &connectionmap.WSConnection{
			Id:   agentId,
			Conn: conn,
		}

		if err != nil {
			fmt.Println("upgrade error:", err)
			return
		}
		defer conn.Close()

		fmt.Printf("📡 Agent %s connected!\n", agentId)
		connectionMap.Add(wsConn)

		// depending on the agent type have different handlers

		if agent.AgentTypeID == qx.ARTICAM_PI_AGENT_TYPE_ID {
			fmt.Println("🛠️  Starting Arctic Pi handler")
			arcticPiHandler(agent, connectionMap, wsConn)
			return
		}
	}
}

func arcticPiHandler(agent *qx.Agent, connMap *connectionmap.ConnectionMap, wsConn *connectionmap.WSConnection) {

	config := &dto.ArtincamPiAgentConfig{}
	err := json.Unmarshal([]byte(agent.Config), config)

	if err != nil {
		fmt.Println("error unmarshalling agent config:", err)
	} else {

		var action dto.AgentInitMessage
		action.Type = "agent-init"
		action.Mode = config.Camera.Mode
		action.Config = *config
		wsConn.Conn.WriteJSON(action)
	}

	for {

		_, msg, err := wsConn.Conn.ReadMessage()

		if err != nil {
			fmt.Println("read error:", err)
			connMap.Delete(wsConn.Id)
			break
		}

		fmt.Printf("→ Received: %s\n", msg)

	}

}
