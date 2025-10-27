-- name: GetAllAgents :many
SELECT * FROM agent;

-- name: GetAgentByID :one
SELECT * FROM agent WHERE id = ? LIMIT 1;

-- name: CreateAgent :one
INSERT INTO agent (id, name, description, agent_type_id, config, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
RETURNING *;

-- name: PatchAgent :one
UPDATE agent
SET name = ?, description = ?, config = ?, updated_at = CURRENT_TIMESTAMP
WHERE id = ?
RETURNING *;

-- name: DeleteAgent :exec
DELETE FROM agent WHERE id = ?;