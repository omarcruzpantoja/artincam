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

run:
	@go run src/main.go

build:
	@go build -o bin/artincam src/main.go

build-arm:
	@GOOS=linux GOARCH=arm GOARM=7 go build -o bin/artincam src/main.go

build-arm64:
	@GOOS=linux GOARCH=arm64 go build -o bin/artincam src/main.go


live-run:
	@air --build.cmd "swag init --dir src && go build -o bin/artincam src/main.go" \
	     --build.bin "./bin/artincam" \
	     --build.full_bin=false \
	     --build.exclude_dir "docs,bin" \
	     --build.include_ext "go,tpl,tmpl,html"	# @air

# ----- TESTS -----
run-tests t:
	go test --cover ./src/...

# ----- FORMAT -----
lint:
	golangci-lint run -E errcheck
