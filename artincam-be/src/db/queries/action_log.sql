-- name: GetAllActionLogs :many
SELECT * FROM action_log 
WHERE 
    (? IS NULL OR agent_id = ?)
  AND
    (? IS NULL OR category = ?)
ORDER BY created_at DESC
LIMIT ? OFFSET ?;

-- name: CountActionLogs :one
SELECT COUNT(*) AS count
FROM action_log
WHERE ? IS NULL OR agent_id = ?;

-- name: GetActionLogByID :one
SELECT * FROM action_log WHERE id = ? LIMIT 1;

-- name: CreateActionLog :one
INSERT INTO action_log (agent_id, message, category, created_at, updated_at)
VALUES (?, ?, ?,CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
RETURNING *;

-- name: DeleteActionLog :exec
DELETE FROM action_log WHERE id = sqlc.arg('id');
