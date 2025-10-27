package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/mattn/go-sqlite3"

	"artincam-be/src/api"
	"artincam-be/src/api/schemas"
	"artincam-be/src/db/qx"
	"artincam-be/src/tools"
)

// @title Artincam Control Center API Docs
// @version 1.0
// @description API docs for Artincam Control Center App.
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html
func main() {
	// Initialize schemas
	var err error
	err = schemas.LoadAll()

	if err != nil {
		log.Fatal("❌ Failed to load schemas:", err)
	} else {
		log.Println("✅ Schemas loaded successfully")
	}

	// Initialize DB connection
	dbConn, err := sql.Open("sqlite3", tools.Getenv("GOOSE_DBSTRING", "", true))

	if err != nil {
		log.Fatal("❌ Failed to connect to the database:", err)
	}

	// Start API server
	s := api.NewServer(fmt.Sprintf(":%s", tools.Getenv("SERVICE_PORT", "8080", false)), WithDbConn(dbConn))

	fmt.Println("✅ Server running on", s.Addr)
	if err := s.Start(); err != nil {
		log.Fatal(err)
	}
}

func WithDbConn(dbConn qx.DBTX) api.ServerOption {
	return func(s *api.Server) {
		s.DbConn = dbConn
	}
}
