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
id TEXT PRIMARY KEY NOT NULL
   CHECK(length(id)=36 AND id GLOB '????????-????-4???-[89ab]???-????????????'),
  name TEXT NOT NULL CHECK (LENGTH(name) < 256),
  description TEXT NOT NULL DEFAULT '' CHECK (LENGTH(description) < 1024),
  agent_type_id INTEGER NOT NULL,
  config TEXT NOT NULL CHECK (json_valid(config)), -- ensure valid JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_type_id) REFERENCES agent_type(id) ON DELETE CASCADE
);
CREATE TABLE asset_file (
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
