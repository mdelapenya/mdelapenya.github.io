HUGO_VERSION=0.145.0
PORT=1313
HUGO_BUILT_IMAGE=hugo-local
HUGO_CONTAINER=hugo-serve
BASE_URL ?= http://host.docker.internal:1313
DOCKER_NETWORK ?=

.PHONY: build serve clean test test-playwright test-broadcast

# Build the Docker image
build:
	docker build -t $(HUGO_BUILT_IMAGE) \
		--platform linux/amd64 \
		--build-arg HUGO_VERSION=$(HUGO_VERSION) \
		.

# Serve the site locally (detached container)
serve: build
	docker run --rm -d \
		--name $(HUGO_CONTAINER) \
		--platform linux/amd64 \
		-v ${PWD}:/src \
		-p $(PORT):1313 \
		$(HUGO_BUILT_IMAGE) \
		hugo server \
		--bind 0.0.0.0 \
		--buildDrafts \
		--buildFuture

# Run all tests
test: test-playwright test-broadcast

# Run Playwright E2E tests (requires Hugo dev server running via 'make serve')
test-playwright:
	docker run --rm \
		$(if $(DOCKER_NETWORK),--network $(DOCKER_NETWORK),) \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-v $$(pwd)/tests:/tests \
		-v $$(pwd)/static:/static:ro \
		-w /tests \
		-e BASE_URL=$(BASE_URL) \
		$(if $(DOCKER_NETWORK),,-e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal) \
		mcr.microsoft.com/playwright:v1.50.1-noble \
		sh -c "npm install && npx playwright test"

# Run broadcast Go tests
test-broadcast:
	cd broadcast && go test -v -count=1 ./...

# Clean up Docker images
clean:
	docker rmi $(HUGO_BUILT_IMAGE) || true
