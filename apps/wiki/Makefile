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

.PHONY: build warm

# Builds for linux/amd64 and pushes to zot. The context is the monorepo root, because
# the app depends on the shared pnpm workspace. With BUILDER=im the build runs natively
# on the i-m host through an ssh buildx builder instead of QEMU on the local machine.
build:
	docker buildx build $(BUILD_ARGS) \
	--push \
	--platform linux/amd64 \
	-t $(IMAGE) \
	-f $(abspath Dockerfile) $(abspath ../..)

# Link previews wait a few seconds; the first render of a card takes longer on a small
# VM, so the deploy hits every card once to fill the in-process cache.
warm:
	@curl -fsS https://wiki.fasberry.fun/sitemap.xml \
	| grep -o '<loc>[^<]*' \
	| sed 's|<loc>||' \
	| sed 's|^https://wiki.fasberry.fun||' \
	| while read -r path; do \
		printf '%s ' "$$path"; \
		curl -s -o /dev/null -m 90 -w '%{http_code} %{time_total}s\n' "https://wiki.fasberry.fun/og/docs$$path/image.png"; \
	done
