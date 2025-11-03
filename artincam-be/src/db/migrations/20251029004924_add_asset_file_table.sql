-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS asset_file (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  camera_id TEXT NOT NULL,
  location TEXT NOT NULL CHECK (LENGTH(location) < 512),
  timestamp DATETIME NOT NULL,
  unique_id TEXT UNIQUE NOT NULL CHECK (LENGTH(unique_id) < 64),
  file_name TEXT NOT NULL CHECK (LENGTH(file_name) < 256),
  file_size INTEGER NOT NULL DEFAULT -1 CHECK (file_size >= -1),
  file_type TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS asset_file;
-- +goose StatementEnd
