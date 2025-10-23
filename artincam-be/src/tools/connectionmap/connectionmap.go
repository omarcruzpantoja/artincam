package connectionmap

import (
	"artincam-be/src/tools/safemap"
	"sync"

	"github.com/gorilla/websocket"
)

type WSConnection struct {
	Id   string
	Conn *websocket.Conn
}

type ConnectionMap struct {
	m  *safemap.SafeMap[string, *WSConnection]
	mu sync.Mutex
}

// New creates a new connection map.
func New() *ConnectionMap {
	return &ConnectionMap{
		m: safemap.New[string, *WSConnection](),
	}
}

// Add registers a new connection.
func (cm *ConnectionMap) Add(conn *WSConnection) {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	// if connection exists in the map, close the previous connection and set the new one
	c, exists := cm.m.Get(conn.Id)

	if exists {
		c.Conn.Close()
	}

	cm.m.Set(conn.Id, conn)
}

func (cm *ConnectionMap) Get(id string) (*WSConnection, bool) {
	return cm.m.Get(id)
}

// Remove deletes a connection by ID.
func (cm *ConnectionMap) Delete(id string) {
	cm.m.Delete(id)
}

// ListIDs returns all active connection IDs.
func (cm *ConnectionMap) ListIDs() []string {
	return cm.m.Keys()
}

// Count returns the number of active connections.
func (cm *ConnectionMap) Count() int {
	return cm.m.Len()
}
