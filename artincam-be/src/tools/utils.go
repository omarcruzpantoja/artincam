package tools

import (
	"log"
	"os"
)

func Getenv(key string, defaultValue string, raiseError bool) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	if raiseError {
		log.Fatal("❌ Missing required environment variable:", key)
	}

	return defaultValue
}
