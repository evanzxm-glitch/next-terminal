# Session-only Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove persistent login and require a new login after the browser session ends while preserving all asset access during the active session.

**Architecture:** Keep the existing `setToken()`, `getToken()`, and `getHeaders()` interfaces so REST, WebSocket, SSH, RDP, VNC, playback, and file-transfer consumers remain unchanged. Replace their storage backend with `sessionStorage`, remove legacy persistent tokens, remove the login checkbox, and force all login requests to use the backend's non-remembered token lifetime.

**Tech Stack:** React 18, Ant Design 4, Jest/react-scripts, browser Web Storage APIs, Go 1.20.

---

## File Structure

- Create `web/src/utils/utils.test.js`: verifies session-only token persistence and legacy-token cleanup.
- Create `web/src/components/Login.test.js`: verifies the checkbox is absent and submitted login data always has `remember: false`.
- Modify `web/src/utils/utils.js`: changes the shared token storage implementation without changing its public functions.
- Modify `web/src/components/Login.js`: removes the checkbox and normalizes login request data.

### Task 1: Session-only Token Storage

**Files:**
- Create: `web/src/utils/utils.test.js`
- Modify: `web/src/utils/utils.js:8-17`

- [x] **Step 1: Write the failing token-storage tests**

```javascript
import {getHeaders, getToken, setToken} from './utils';

describe('login token storage', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    it('stores the token only for the browser session', () => {
        localStorage.setItem('X-Auth-Token', 'legacy-token');

        setToken('session-token');

        expect(sessionStorage.getItem('X-Auth-Token')).toBe('session-token');
        expect(localStorage.getItem('X-Auth-Token')).toBeNull();
        expect(getToken()).toBe('session-token');
        expect(getHeaders()).toEqual({'X-Auth-Token': 'session-token'});
    });

    it('does not restore a legacy persistent token', () => {
        localStorage.setItem('X-Auth-Token', 'legacy-token');

        expect(getToken()).toBeNull();
        expect(localStorage.getItem('X-Auth-Token')).toBeNull();
    });
});
```

- [x] **Step 2: Run the focused test and verify RED**

Run:

```bash
cd web
CI=true npm test -- --runInBand --watchAll=false src/utils/utils.test.js
```

Expected: FAIL because the current implementation writes and reads `localStorage`.

- [x] **Step 3: Implement session-only storage**

Replace the token helpers with:

```javascript
const TOKEN_KEY = 'X-Auth-Token';

const removeLegacyToken = function () {
    localStorage.removeItem(TOKEN_KEY);
}

export const setToken = function (token) {
    removeLegacyToken();
    sessionStorage.setItem(TOKEN_KEY, token);
}

export const getToken = function () {
    removeLegacyToken();
    return sessionStorage.getItem(TOKEN_KEY);
}
```

Keep `getHeaders()` unchanged so asset and API callers continue using the same
interface.

- [x] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
cd web
CI=true npm test -- --runInBand --watchAll=false src/utils/utils.test.js
```

Expected: PASS, 2 tests.

- [x] **Step 5: Commit token storage**

```bash
git add web/src/utils/utils.js web/src/utils/utils.test.js
git commit -m "Use session storage for login tokens"
```

### Task 2: Remove Remember-me Login

**Files:**
- Create: `web/src/components/Login.test.js`
- Modify: `web/src/components/Login.js:1-110`

- [x] **Step 1: Write the failing login-form tests**

Mock branding and request dependencies, render `LoginForm` in a memory router,
and submit the username/password fields:

```javascript
expect(screen.queryByText('保持登录')).not.toBeInTheDocument();
expect(request.post).toHaveBeenCalledWith('/login', {
    username: 'admin',
    password: 'admin',
    remember: false
});
```

The test fixture must mock `brandingApi.getBranding()` and return a failed
login response such as `{code: 0}` so navigation and user-state setup do not
affect this assertion.

- [x] **Step 2: Run the focused test and verify RED**

Run:

```bash
cd web
CI=true npm test -- --runInBand --watchAll=false src/components/Login.test.js
```

Expected: FAIL because the checkbox is currently rendered and submitted form
data does not explicitly force `remember: false`.

- [x] **Step 3: Implement the minimal login-form change**

Remove `Checkbox` from the Ant Design import and delete the `remember` form
item. Add a small normalizer:

```javascript
const withoutRememberMe = values => ({
    ...values,
    remember: false,
});
```

Use `withoutRememberMe(params)` before both the first login request and stored
TOTP account state. The TOTP retry will therefore also send `remember: false`.

- [x] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
cd web
CI=true npm test -- --runInBand --watchAll=false src/components/Login.test.js
```

Expected: PASS.

- [x] **Step 5: Commit login form**

```bash
git add web/src/components/Login.js web/src/components/Login.test.js
git commit -m "Remove persistent login option"
```

### Task 3: Regression and Build Verification

**Files:**
- Verify: `web/src`
- Verify: `server`

- [x] **Step 1: Run all frontend tests**

```bash
cd web
CI=true npm test -- --runInBand --watchAll=false
```

Expected: all test suites pass.

- [x] **Step 2: Build the production frontend**

```bash
cd web
npm run build
```

Expected: optimized production build succeeds and reports
`/next-terminal/` as the hosting path.

- [x] **Step 3: Run Go regression tests**

```bash
packages=$(go list ./... | grep -v /server/common/term/test)
go test $packages
```

Expected: all included packages pass.

- [x] **Step 4: Verify asset token call sites remain unchanged**

```bash
git diff --name-only c725d87..HEAD
rg -n "getToken\\(\\)" web/src/components/access web/src/components/devops web/src/components/session
```

Expected: asset/session components are not modified and still use `getToken()`.

- [x] **Step 5: Perform runtime browser checks**

Build and deploy the branch image on the test host, then verify:

1. Login page has no "保持登录" option.
2. Login succeeds and assets can initiate connections.
3. Page refresh remains logged in.
4. Closing the browser session and reopening `/next-terminal/` shows login.
5. `/` remains 404 and `/next-terminal/` remains 200.

- [x] **Step 6: Commit any verification-only documentation updates**

If no files changed during verification, do not create an empty commit.

### Task 4: Cross-tab Token Propagation Fix

**Files:**
- Modify: `web/src/utils/utils.js`
- Modify: `web/src/utils/window.js`
- Modify: `web/src/components/asset/Asset.js`
- Modify: `web/src/components/worker/MyAsset.js`

- [x] **Step 1: Add `initTokenFromUrl()` to `utils.js`**

On module load, extract `X-Auth-Token` from URL query/hash parameters, store in
`sessionStorage`, then remove from URL via `history.replaceState`.

- [x] **Step 2: Update `openTinyWin()` in `window.js`**

Auto-inject the current token as a URL parameter before calling `window.open()`.

- [x] **Step 3: Update asset access links in `Asset.js` and `MyAsset.js`**

Append `&X-Auth-Token=...` to the URL when opening RDP/SSH access in a new tab.

- [x] **Step 4: Build and deploy to test server**

```bash
rsync -avz --exclude='.git' --exclude='node_modules' ./ root@192.168.1.129:/opt/next-terminal-session-fix/
ssh root@192.168.1.129 "cd /opt/next-terminal-session-fix && docker compose build && docker compose up -d"
```

- [x] **Step 5: Verify RDP access works in new tab without forced login**
