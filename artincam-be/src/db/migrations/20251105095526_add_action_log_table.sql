-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS action_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL
    CHECK(length(agent_id)=36 AND agent_id GLOB '????????-????-4???-[89ab]???-????????????'),
  message TEXT NOT NULL CHECK (json_valid(message)),
  category TEXT NOT NULL CHECK (category IN ('health')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES agent(id) ON DELETE CASCADE
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS action_log;
-- +goose StatementEnd
