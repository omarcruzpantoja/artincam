-- name: GetAllActionLogs :many
SELECT * FROM action_log;

-- name: GetActionLogByID :one
SELECT * FROM action_log WHERE id = ? LIMIT 1;

-- name: CreateActionLog :one
INSERT INTO action_log (agent_id, message, category, created_at, updated_at)
VALUES (?, ?, ?,CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
RETURNING *;

-- name: DeleteActionLog :exec
DELETE FROM action_log WHERE id = sqlc.arg('id');
