STAGE   ?= prod
NAME    ?= wiki
TAG     ?= latest
BUILDER ?=

REGISTRY_HOST ?= registry.fasberry.fun
REGISTRY      := $(REGISTRY_HOST)
IMAGE         := $(REGISTRY)/$(STAGE)/$(NAME):$(TAG)
BUILD_ARGS    :=

ifneq ($(BUILDER),)
BUILD_ARGS += --builder $(BUILDER)
endif

.PHONY: build

# Builds for linux/amd64 and pushes to zot. The context is the monorepo root, because
# the app depends on the shared pnpm workspace. With BUILDER=im the build runs natively
# on the i-m host through an ssh buildx builder instead of QEMU on the local machine.
build:
	docker buildx build $(BUILD_ARGS) \
	--push \
	--platform linux/amd64 \
	-t $(IMAGE) \
	-f $(abspath Dockerfile) $(abspath ../..)
