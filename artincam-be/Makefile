v := false
html := false
go_test_flags := -tags no_test_coverage
go_test_coverage_flags := -func=coverage/coverage.out

# Add verbose flag if v=true
ifeq ($(v),true)
    go_test_flags += -v
endif

# Add 
ifeq ($(html),true)
    go_test_coverage_flags = -html=coverage/coverage.out
endif

# ----- BUILD & RUN -----
run:
	@swag init --dir src
	@go run src/main.go

build:
	@swag init --dir src
	@go build -o bin/artincam src/main.go

build-arm:
	@GOOS=linux GOARCH=arm GOARM=7 go build -o bin/artincam src/main.go

build-arm64:
	@GOOS=linux GOARCH=arm64 go build -o bin/artincam src/main.go


live-run: generate-queries
	@air --build.cmd "swag init --dir src && go build -o bin/artincam src/main.go" \
	     --build.bin "./bin/artincam" \
	     --build.full_bin=false \
	     --build.exclude_dir "docs,bin" \
	     --build.include_ext "go,tpl,tmpl,html"	# @air

generate-queries:
	@sqlc generate

# ----- TESTS -----
run-tests t:
	go test --cover ./src/...

# ----- FORMAT -----
lint:
	golangci-lint run -E errcheck

# ----- DB Migrations -----
create-migration gm:
	goose create ${message} sql

migrate:
	@goose up
	@make -s dump-schema

migrate-to:
	@goose up-to ${version}
# 	@make -s dump-schema

migrate-one:
	@goose up-by-one
# 	@make -s dump-schema

downgrade:
	@goose down || true
# 	@make -s dump-schema

downgrade-to:
	@goose down-to ${version}  || true
# 	@make -s dump-schema

dump-schema:
	sqlite3 ${GOOSE_DBSTRING} .schema > src/db/schema.sql

# 	pg_dump ${DATABASE_NAME} --schema-only | grep -v -e '^--' -e '^COMMENT ON' -e '^REVOKE' -e \
# 		'^GRANT' -e '^SET' -e 'ALTER DEFAULT PRIVILEGES' -e 'OWNER TO' | cat -s > \
# 		${DB_SOURCE_DIR}/schema.sql
