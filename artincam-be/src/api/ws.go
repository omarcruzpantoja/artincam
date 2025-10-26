package api

import (
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"

	"artincam-be/src/tools/connectionmap"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func WsAgentConnectionHandler(connectionMap *connectionmap.ConnectionMap) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {

		// get all query params
		q := r.URL.Query()
		agentId := q.Get("x-agent-id")

		if agentId == "" {
			// we need this agent id to know who is knocking the door. return bad request
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
		arcticPiHandler(connectionMap, wsConn)
	}
}

func arcticPiHandler(connMap *connectionmap.ConnectionMap, wsConn *connectionmap.WSConnection) {
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
