# Dual-Container Release Design

## Goal

Publish the modified Next Terminal 1.3.9 source, deployment documentation, and
reproducible Next Terminal and guacd container images from
`evanzxm-glitch/next-terminal`.

## Runtime Architecture

Docker Compose runs two processes in two containers:

- `next-terminal` serves the UI, REST API, and WebSocket endpoints on host port
  8080 below `/next-terminal/`.
- `guacd` provides Guacamole protocol handling on container-network port 4822.

The guacd port is not published on the host. Both services mount the same data
directory so recordings and drive files use identical absolute paths.

## Image Publishing

GitHub Actions builds and publishes:

- `ghcr.io/evanzxm-glitch/next-terminal:1.3.9-subpath`
- `ghcr.io/evanzxm-glitch/next-terminal-guacd:1.4.0`

The application image is built from source in a multi-stage Dockerfile. The
guacd image extends the Guacamole 1.4.0-compatible upstream image and adds the
fonts already included by Next Terminal 1.3.9.

## Documentation

The root README describes the fork and links to a Chinese Docker deployment
guide. The deployment guide covers image-based installation, source builds,
configuration, persistent data, verification, lifecycle commands, and the
protocols that require guacd.

## Verification

- Build both images successfully.
- Start both containers on `192.168.1.129`.
- Confirm the application container resolves and connects to `guacd:4822`.
- Confirm `/` and unprefixed API paths return 404.
- Confirm `/next-terminal/`, static resources, login, and authenticated API
  requests work.
- Push the source and run the GHCR publishing workflow successfully.
