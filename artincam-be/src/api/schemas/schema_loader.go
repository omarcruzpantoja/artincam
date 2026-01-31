package schemas

import (
	"embed"
	"encoding/json"
	"fmt"
	"io"

	"github.com/santhosh-tekuri/jsonschema/v5"
)

//go:embed *.json
var schemaFS embed.FS

var ArtincamAgentConfigSchema *jsonschema.Schema

func LoadAll() error {
	compiler := jsonschema.NewCompiler()

	// Tell compiler to load from embed.FS when it sees embed:// URLs
	compiler.LoadURL = func(u string) (io.ReadCloser, error) {
		// strip prefix embed://
		path := u
		if len(u) > len("embed://") && u[:len("embed://")] == "embed://" {
			path = u[len("embed://"):]
		}
		return schemaFS.Open(path)
	}

	// Use our custom scheme
	s, err := compiler.Compile("embed://artincam_agent_config_schema.json")
	if err != nil {
		return fmt.Errorf("compile schema: %w", err)
	}

	ArtincamAgentConfigSchema = s
	return nil
}

func Validate(schema *jsonschema.Schema, payload []byte) error {
	var v any
	if err := json.Unmarshal(payload, &v); err != nil {
		return err
	}
	return schema.Validate(v)
}
