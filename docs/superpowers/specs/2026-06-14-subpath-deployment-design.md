# Next Terminal Subpath Deployment Design

## Goal

Build Next Terminal 1.3.9 so its HTTP UI, API, static assets, and WebSocket
endpoints are available only below `/next-terminal/`. Requests to `/` must
return HTTP 404.

## Architecture

The Echo application will register all existing routes under one
`/next-terminal` route group. Route definitions remain relative to that group,
so the application's business endpoints and handlers do not change.

The authentication middleware will remove the deployment prefix before applying
the existing anonymous-route, allow-list, and role-permission checks. This keeps
the permissions stored by version 1.3.9 compatible with the prefixed HTTP
routes.

The React production environment will use `/next-terminal` as the Axios base
URL and append it to the WebSocket origin. Create React App will build static
asset URLs below `/next-terminal/`.

## Behavior

- `GET /` returns HTTP 404.
- `GET /next-terminal/` serves the React application.
- Static assets are served below `/next-terminal/static/`.
- REST requests use `/next-terminal/<endpoint>`.
- WebSocket connections use `/next-terminal/sessions/<id>/...`.
- Existing internal permission paths, such as `/sessions`, remain unchanged.

## Testing

Backend route tests will use Echo's test recorder with a temporary embedded-file
replacement to verify:

- the root path is not registered;
- the prefixed application root is registered;
- an unprefixed API path is not registered;
- a prefixed anonymous API path reaches its handler.

The final binary will be built for Linux amd64, deployed to
`192.168.1.129`, and tested with HTTP requests against port 8080.
