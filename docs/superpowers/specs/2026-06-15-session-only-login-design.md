# Session-only Login Design

## Goal

Remove the "remember me" option and require users to log in again after the
browser session ends, without changing asset access behavior during the active
browser session.

## Current Behavior

The login form sends an optional `remember` field, while the frontend always
stores `X-Auth-Token` in `localStorage`. As a result, the browser restores the
token after it is closed and reopened.

Asset SSH, RDP, VNC, Telnet, monitoring, playback, file transfer, and command
execution features all obtain the current login token through the shared
`getToken()` helper.

## Design

1. Remove the "remember me" checkbox from the login form.
2. Always send `remember: false` in login and TOTP requests.
3. Store `X-Auth-Token` in `sessionStorage`.
4. Remove any legacy `X-Auth-Token` value from `localStorage` whenever token
   state is read or written. This forces users upgrading from the old version
   to log in again and prevents stale persistent credentials from being reused.
5. Keep the `setToken()`, `getToken()`, and `getHeaders()` interfaces unchanged.
   Existing asset access components will continue reading the active token
   through the same API.

## Cross-tab Token Propagation

After switching to `sessionStorage`, new browser tabs opened via
`target="_blank"` or `window.open()` cannot access the parent tab's token.
This caused a regression where RDP access, SSH access, session monitoring, and
session playback all triggered a forced login redirect.

### Fix

1. **`initTokenFromUrl()`** (in `web/src/utils/utils.js`): On module load,
   extract `X-Auth-Token` from either the query string or the hash parameters,
   store it in `sessionStorage`, then remove it from the URL using
   `history.replaceState`. This runs before any React component mounts.

2. **URL token injection in navigation links**: Asset access links in
   `Asset.js` and `MyAsset.js` now append `&X-Auth-Token=...` to the URL when
   opening RDP/SSH access in a new tab.

3. **`openTinyWin()` auto-injection** (in `web/src/utils/window.js`): The
   `openTinyWin` helper used by session monitoring and playback automatically
   appends the current token to the URL before calling `window.open()`.

### Affected entry points

| Feature | File | Mechanism |
|---|---|---|
| RDP/VNC/Telnet access | `Asset.js`, `MyAsset.js` | `<a target="_blank">` with token param |
| SSH access | `Asset.js`, `MyAsset.js` | `<a target="_blank">` with token param |
| Online session monitor | `OnlineSession.js` | `openTinyWin()` auto-injection |
| Offline session playback | `OfflineSession.js` | `openTinyWin()` auto-injection |

## Resulting Behavior

- Refreshing the page retains the login and active asset access.
- Opening another page in the same browser tab retains the login.
- Closing the browser session removes the token.
- Opening the application in a new browser session requires login.
- Login tokens use the backend's non-remembered expiration (2 hours).
- Opening RDP/SSH access, monitoring, or playback in a new tab works
  without requiring a separate login.

## Testing

Frontend tests will verify:

- `setToken()` stores the token in `sessionStorage`, not `localStorage`.
- Legacy persistent tokens are removed.
- `getToken()` returns only the session token.
- Login submission always includes `remember: false`.
- The login page no longer renders the "remember me" checkbox.

The production frontend build and existing Go test suite will be run after the
change. Runtime verification will cover login, page refresh, asset-token
availability, and the existing `/next-terminal/` routing contract.
