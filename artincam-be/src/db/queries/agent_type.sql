-- name: GetAllAgentTypes :many
SELECT * FROM agent_type;

-- name: GetAgentTypeByID :one
SELECT * FROM agent_type WHERE id = ? LIMIT 1;

-- name: CreateAgentType :one
INSERT INTO agent_type (name, description, created_at, updated_at)
VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
RETURNING *;

-- name: PatchAgentType :one
UPDATE agent_type
SET 
  name   = COALESCE(sqlc.narg('name'), name),
  description = COALESCE(sqlc.narg('description'), description),
  updated_at = CURRENT_TIMESTAMP
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: DeleteAgentType :exec
DELETE FROM agent_type WHERE id = sqlc.arg('id');
