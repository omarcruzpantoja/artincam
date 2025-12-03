-- name: GetAllAssetFiles :many
SELECT *
FROM asset_file
WHERE
    ( ? IS NULL OR agent_id = ? )
  AND
    ( ? IS NULL OR camera_id = ? )
ORDER BY timestamp ASC
LIMIT ? OFFSET ?;

-- name: GetAllAssetFilesTimestampDesc :many
SELECT *
FROM asset_file
WHERE
    ( ? IS NULL OR agent_id = ? )
  AND
    ( ? IS NULL OR camera_id = ? )
ORDER BY timestamp DESC
LIMIT ? OFFSET ?;

-- name: GetAllAssetFilesUniqueIdAsc :many
SELECT *
FROM asset_file
WHERE
    ( ? IS NULL OR agent_id = ? )
  AND
    ( ? IS NULL OR camera_id = ? )
ORDER BY unique_id ASC
LIMIT ? OFFSET ?;

-- name: GetAllAssetFilesUniqueIdDesc :many
SELECT *
FROM asset_file
WHERE
    ( ? IS NULL OR agent_id = ? )
  AND
    ( ? IS NULL OR camera_id = ? )
ORDER BY unique_id DESC
LIMIT ? OFFSET ?;

-- name: GetAllAssetFilesFileNameAsc :many
SELECT *
FROM asset_file
WHERE
    ( ? IS NULL OR agent_id = ? )
  AND
    ( ? IS NULL OR camera_id = ? )
ORDER BY file_name ASC
LIMIT ? OFFSET ?;

-- name: GetAllAssetFilesFileNameDesc :many
SELECT *
FROM asset_file
WHERE
    ( ? IS NULL OR agent_id = ? )
  AND
    ( ? IS NULL OR camera_id = ? )
ORDER BY file_name DESC
LIMIT ? OFFSET ?;

-- name: CountAssetFiles :one
SELECT COUNT(*) AS count
FROM asset_file
WHERE
    ( ? IS NULL OR agent_id = ? )
  AND
    ( ? IS NULL OR camera_id = ? );

-- name: GetAssetFileByID :one
SELECT * FROM asset_file WHERE id = ? LIMIT 1;

-- name: CreateAssetFile :one
INSERT INTO asset_file (agent_id, camera_id, location, timestamp, unique_id, file_name, file_size, file_type, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
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
