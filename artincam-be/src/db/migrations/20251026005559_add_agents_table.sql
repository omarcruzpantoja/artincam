-- +goose Up
-- +goose StatementBegin
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS agent_type (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL  CHECK (LENGTH(name) < 32),
  description TEXT NOT NULL DEFAULT '' CHECK (LENGTH(description) < 1024),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent (
  id TEXT PRIMARY KEY NOT NULL
    CHECK(length(id)=36 AND id GLOB '????????-????-4???-[89ab]???-????????????'),
  name TEXT NOT NULL CHECK (LENGTH(name) < 256),
  description TEXT NOT NULL DEFAULT '' CHECK (LENGTH(description) < 1024),
  agent_type_id INTEGER NOT NULL,
  config TEXT NOT NULL CHECK (json_valid(config)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_type_id) REFERENCES agent_type(id) ON DELETE CASCADE
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS agent;
DROP TABLE IF EXISTS agent_type;
-- +goose StatementEnd
