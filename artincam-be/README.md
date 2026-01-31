#### Install DB migration plugin


`go install -tags='no_clickhouse no_libsql no_mssql no_mysql no_vertica no_ydb' github.com/pressly/goose/v3/cmd/goose@latest`

### Install SQL generator tool

`sudo snap install sqlc`

### Install live reloader
`go install github.com/air-verse/air@1.61.1`

### Install linter

```shell

# binary will be in $(go env GOPATH)/bin/golangci-lint

curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(go env GOPATH)/bin v1.62.2

golangci-lint --version
```

## Install SQLite3
`sudo apt install sqlite3` 

### Create database
sqlite3 /path/to/db