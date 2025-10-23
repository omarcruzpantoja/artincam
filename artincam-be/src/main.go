package main

import (
	"fmt"
	"log"

	"artincam-be/src/api"
)

func main() {
	s := api.NewServer(":8080")

	fmt.Println("✅ Server running on", s.Addr)
	if err := s.Start(); err != nil {
		log.Fatal(err)
	}
}
