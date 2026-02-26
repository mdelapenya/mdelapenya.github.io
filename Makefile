HUGO_VERSION=0.145.0
PORT=1313
HUGO_BUILT_IMAGE=hugo-local
HUGO_CONTAINER=hugo-serve

.PHONY: build serve clean

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

# Clean up Docker images
clean:
	docker rmi $(HUGO_BUILT_IMAGE) || true
