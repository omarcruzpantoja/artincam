CREATE TABLE goose_db_version (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		version_id INTEGER NOT NULL,
		is_applied INTEGER NOT NULL,
		tstamp TIMESTAMP DEFAULT (datetime('now'))
	);
CREATE TABLE sqlite_sequence(name,seq);
CREATE TABLE agent_type (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL  CHECK (LENGTH(name) < 32),
  description TEXT NOT NULL DEFAULT '' CHECK (LENGTH(description) < 1024),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE agent (
  id TEXT PRIMARY KEY, -- UUID stored as TEXT
  name TEXT NOT NULL CHECK (LENGTH(name) < 256),
  description TEXT NOT NULL DEFAULT '' CHECK (LENGTH(description) < 1024),
  agent_type_id INTEGER NOT NULL,
  config TEXT NOT NULL CHECK (json_valid(config)), -- ensure valid JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_type_id) REFERENCES agent_type(id) ON DELETE CASCADE
);
