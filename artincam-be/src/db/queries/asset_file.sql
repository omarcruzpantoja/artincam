-- name: GetAllAssetFiles :many
SELECT * FROM asset_file;

-- name: GetAssetFileByID :one
SELECT * FROM asset_file WHERE id = ? LIMIT 1;

-- name: CreateAssetFile :one
INSERT INTO asset_file (camera_id, location, timestamp, unique_id, file_name, file_size, file_type, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
RETURNING *;

-- name: PatchAssetFile :one
UPDATE asset_file
SET
  camera_id   = COALESCE(sqlc.narg('camera_id'), camera_id),
  location    = COALESCE(sqlc.narg('location'), location),
  timestamp   = COALESCE(sqlc.narg('timestamp'), timestamp),
  unique_id   = COALESCE(sqlc.narg('unique_id'), unique_id),
  file_name   = COALESCE(sqlc.narg('file_name'), file_name),
  file_size   = COALESCE(sqlc.narg('file_size'), file_size),
  updated_at  = CURRENT_TIMESTAMP
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: DeleteAssetFile :exec
DELETE FROM asset_file WHERE id = ?;
