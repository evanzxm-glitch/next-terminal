# Dual-Container Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the modified Next Terminal 1.3.9 source and two-container deployment through GitHub and GHCR.

**Architecture:** Docker Compose runs the application and guacd on one private
network with a shared data mount. GitHub Actions builds both images and publishes
fixed version tags to GHCR.

**Tech Stack:** Docker Compose, Docker Buildx, GitHub Actions, GHCR, Go 1.20, Node.js 16, Guacamole Server 1.4.0

---

### Task 1: Define the two-container deployment

**Files:**
- Modify: `docker-compose.subpath.yml`
- Modify: `Dockerfile`
- Modify: `guacd/Dockerfile`

- [ ] Add the `guacd` service without a host port mapping.
- [ ] Set `GUACD_HOSTNAME=guacd` and `GUACD_PORT=4822` on the application.
- [ ] Mount the same data directory into both containers.
- [ ] Make the application wait for the guacd service dependency.

### Task 2: Document installation and operations

**Files:**
- Modify: `README.md`
- Create: `docs/docker-deployment.zh-CN.md`

- [ ] Explain the `/next-terminal/` behavior and two-container architecture.
- [ ] Document GHCR image deployment and source builds.
- [ ] Document data paths, verification, logs, upgrades, and removal.
- [ ] Explain which protocols require guacd.

### Task 3: Publish both images to GHCR

**Files:**
- Create: `.github/workflows/publish-images.yml`

- [ ] Configure GitHub Packages write permission.
- [ ] Build the application image for amd64 and arm64.
- [ ] Build the guacd image for amd64 and arm64.
- [ ] Publish fixed version and branch tags.

### Task 4: Validate on the target host

**Files:**
- No source changes.

- [ ] Build both images on `192.168.1.129`.
- [ ] Start both containers.
- [ ] Verify TCP connectivity from the application container to `guacd:4822`.
- [ ] Re-run HTTP and authenticated API checks.

### Task 5: Push and verify publication

**Files:**
- Git metadata only.

- [ ] Add `git@github.com:evanzxm-glitch/next-terminal.git` as origin.
- [ ] Commit the complete 1.3.9 source and modifications.
- [ ] Push `main`.
- [ ] Run the image publication workflow.
- [ ] Confirm both GHCR packages are available.
