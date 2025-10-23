package main

import (
	"fmt"
	"log"

	"artincam-be/src/api"
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
	s := api.NewServer(":8080")

	fmt.Println("✅ Server running on", s.Addr)
	if err := s.Start(); err != nil {
		log.Fatal(err)
	}
}
