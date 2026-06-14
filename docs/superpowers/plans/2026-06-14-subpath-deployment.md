# Next Terminal Subpath Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Next Terminal 1.3.9 so it is served only from `/next-terminal/`.

**Architecture:** Register the complete Echo application beneath a single route
group, normalize the request path inside authorization checks, and configure the
React production build to use the same base path for assets, HTTP, and
WebSockets.

**Tech Stack:** Go 1.18+, Echo v4, React 18, Create React App 5, Axios, WebSocket

---

### Task 1: Add backend route regression coverage

**Files:**
- Create: `server/app/server_test.go`
- Modify: `server/app/server.go`

- [ ] **Step 1: Write a failing test**

Add tests that construct the Echo server and assert:

```go
func TestRoutesAreOnlyAvailableBelowBasePath(t *testing.T) {
    e := setupRoutes()

    assertStatus(t, e, http.MethodGet, "/", http.StatusNotFound)
    assertStatus(t, e, http.MethodGet, basePath+"/", http.StatusOK)
    assertStatus(t, e, http.MethodGet, "/branding", http.StatusNotFound)
}
```

- [ ] **Step 2: Run the test and verify failure**

Run: `go test ./server/app -run TestRoutesAreOnlyAvailableBelowBasePath -v`

Expected: failure because version 1.3.9 registers `/` and `/branding` at the
origin root and has no `/next-terminal/` route.

- [ ] **Step 3: Register routes below one base path**

Define:

```go
const basePath = "/next-terminal"
```

Create an Echo group using that prefix and register all UI and API routes on
the group instead of the root Echo instance.

- [ ] **Step 4: Run the test and verify it passes**

Run: `go test ./server/app -run TestRoutesAreOnlyAvailableBelowBasePath -v`

Expected: PASS.

### Task 2: Preserve authentication and permission behavior

**Files:**
- Modify: `server/app/middleware/auth.go`
- Create: `server/app/middleware/auth_test.go`

- [ ] **Step 1: Write failing path-normalization tests**

Test that `/next-terminal/login`, `/next-terminal/static/app.js`, and
`/next-terminal/sessions/abc/ssh` normalize to the original version 1.3.9
permission paths.

- [ ] **Step 2: Run the tests and verify failure**

Run: `go test ./server/app/middleware -run TestStripBasePath -v`

Expected: failure because no path-normalization helper exists.

- [ ] **Step 3: Add minimal normalization**

Add a helper that strips exactly `/next-terminal` at a path boundary and use
the normalized path for anonymous, allow-list, account, worker, and role checks.

- [ ] **Step 4: Run middleware and app tests**

Run: `go test ./server/app/middleware ./server/app`

Expected: PASS.

### Task 3: Configure the React production base path

**Files:**
- Modify: `web/package.json`
- Modify: `web/src/common/env.js`
- Modify: `web/src/components/Info.js`

- [ ] **Step 1: Set the asset base path**

Set:

```json
"homepage": "/next-terminal"
```

- [ ] **Step 2: Set production HTTP and WebSocket bases**

Use `/next-terminal` for Axios and append `/next-terminal` to the production
WebSocket origin.

- [ ] **Step 3: Remove the remaining root-only navigation**

Change the application-home navigation from `/#` to `/next-terminal/#`.

- [ ] **Step 4: Build and inspect generated assets**

Run: `npm run build` in `web`.

Expected: generated `index.html` references
`/next-terminal/static/...`.

### Task 4: Verify and deploy

**Files:**
- Generated: `server/resource/build/**`
- Generated: `next-terminal`

- [ ] **Step 1: Run the complete Go test suite**

Run: `go test ./...`

Expected: PASS.

- [ ] **Step 2: Build Linux amd64 binary**

Run:

```bash
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags '-s -w' -o next-terminal main.go
```

Expected: exit code 0 and an ELF 64-bit x86-64 binary.

- [ ] **Step 3: Deploy to the test host**

Copy the binary to a dedicated directory on `192.168.1.129`, preserve any
existing data/configuration, and start it with `server.addr=0.0.0.0:8080`.

- [ ] **Step 4: Verify HTTP behavior**

Run against the remote service:

```bash
curl -i http://192.168.1.129:8080/
curl -i http://192.168.1.129:8080/next-terminal/
```

Expected: root returns 404 and `/next-terminal/` returns 200 with the React
application.
