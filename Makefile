HUGO_VERSION=0.169.0
PORT=1313
HUGO_BUILT_IMAGE=hugo-local
HUGO_CONTAINER=hugo-serve
BASE_URL ?= http://host.docker.internal:1313
DOCKER_NETWORK ?=
PLAYWRIGHT_VERSION=1.60.0

.PHONY: build serve clean test test-playwright test-broadcast i18n-test i18n-check i18n-sync

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
test: test-playwright test-broadcast i18n-test i18n-check

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
		mcr.microsoft.com/playwright:v$(PLAYWRIGHT_VERSION)-noble \
		sh -c "npm install && npx playwright test"

# Run broadcast Go tests
test-broadcast:
	cd broadcast && go test -v -count=1 ./...

# Unit tests for the translation sync script (needs Node 20+)
i18n-test:
	node --test scripts/translation-sync.test.mjs scripts/translation-content.test.mjs

# Report front matter drift and body problems (code, URLs, typography, links) in translations (needs Node)
i18n-check:
	node scripts/translation-sync.mjs
	node scripts/translation-content.mjs

# Copy the synced front matter fields from each original into its translations
i18n-sync:
	node scripts/translation-sync.mjs --fix

# Clean up Docker images
clean:
	docker rmi $(HUGO_BUILT_IMAGE) || true
