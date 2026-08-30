Here's a copy-paste prompt for Copilot. It's written so the backend constraint is impossible to miss — it appears first, and again at the end.


# Task: Build a two-step login page (frontend ONLY)

## ⛔ HARD CONSTRAINT — READ FIRST

Do NOT create, edit, delete, or refactor ANY file under `backend/`.
That includes: all `.java` files, `pom.xml`, `application.yml`, `application-test.yml`,
`db/migration/*.sql`, and `demo-data.json`.

The backend currently has compile errors and unresolved dependencies. That is known and
is NOT your problem to fix. If something looks broken there, IGNORE IT and say so in your
summary instead of touching it.

Work only inside `frontend/src/`.

## Stack — do not change

- React 19, react-router-dom v6, Create React App (react-scripts 5)
- **Add NO new npm dependencies.** No formik, no yup, no axios, no MUI, no react-hook-form.
  Use `fetch`, `useState`, and plain CSS only.
- Reuse the existing components, do not build new form primitives:
  - `src/components/common/Input.jsx` — props `{ id, label, error, ...rest }`
  - `src/components/common/Button.jsx` — props `{ variant, type, disabled, ...rest }`
- All user-facing text goes through i18n: `const { t } = useLanguage()` from
  `src/context/LanguageContext`. Add every new key to BOTH `src/locales/en.json` AND
  `src/locales/zh-CN.json` — the two files must have identical key sets or the app breaks.
- Styles go in the existing `src/features/auth/auth.css`.

## What to build

Sign-in is TWO steps on one page. The page swaps forms based on context state; it does not
navigate between routes.

**Step 1 — credentials** (`LoginForm.jsx`)
- User ID + Password fields.
- A CAPTCHA field that is **hidden by default** and appears ONLY after the server responds
  with error code `CAPTCHA_REQUIRED` (which happens after ~3 failed attempts). It must NOT
  show on a first login attempt.
- On failure, clear the password field but keep the user ID.

**Step 2 — one-time code** (`MfaForm.jsx`)
- Shown when step 1 returns `mfaRequired: true`.
- A 6-digit numeric input. Strip non-digits on change. Use
  `autoComplete="one-time-code"` and `inputMode="numeric"` so browsers/iOS can autofill it.
- Show the masked destination email returned by the server.
- "Send a new code" button, disabled during a countdown (seconds from
  `resendCooldownSeconds`), showing the remaining seconds while disabled.
- "Use a different account" button that returns to step 1.
- Submit disabled until 6 digits are entered.

**`CaptchaField.jsx`** — renders the challenge image from a data-URI string, an answer
input (uppercase, letter-spaced), and a refresh button.

**`LoginPage.jsx`** — renders `<LoginForm/>` or `<MfaForm/>` depending on whether a code is
pending. Change the card heading/subtitle between the two states.

## Critical security rule

Session state must come from the SERVER, never from localStorage.

In `AuthContext`, on mount, call `GET /api/rm/me` to restore the session. Do NOT read a
user object out of localStorage and trust it — that would let anyone forge a login by
typing into devtools. `logout()` clears local state even if the network call fails.

Reaching step 2 does NOT mean authenticated. Only a successful code verification sets the
user.

## API contract

Base path `/api`. Every request: `credentials: 'include'`, and send the CSRF token read
from the `XSRF-TOKEN` cookie as an `X-XSRF-TOKEN` header.

```
GET  /api/auth/captcha     -> 200 { imageDataUri, expiresInSeconds }
POST /api/auth/login       -> body { username, password, captchaAnswer? }
                              200 { mfaRequired: true, maskedEmail, resendCooldownSeconds }
POST /api/auth/mfa/verify  -> body { code }
                              200 { id, name, initials, email, branch }
POST /api/auth/mfa/resend  -> 200 { maskedEmail }
POST /api/auth/logout      -> 204
GET  /api/rm/me            -> 200 profile, or 401 when there is no session
```

Errors come back as `{ code, message, details? }`. Handle these codes:

| code | status | UI behaviour |
|---|---|---|
| `INVALID_CREDENTIALS` | 401 | show `message` under the password field |
| `CAPTCHA_REQUIRED` | 403 | show CAPTCHA using `details.imageDataUri`, clear the answer |
| `ACCOUNT_LOCKED` | 423 | show a locked banner using `details.retryAfterSeconds` |
| `MFA_CODE_INVALID` | 401 | show error, clear the code, refocus |
| `MFA_NOT_PENDING` / `MFA_ATTEMPTS_EXHAUSTED` | 401 | show error AND return to step 1 |
| `RESEND_TOO_SOON` | 429 | restart the countdown from `details.retryAfterSeconds` |

Throw a custom `AuthError` carrying `{ code, message, details, status }` so the forms
branch on `code`, never on message text.

## Must keep working without a backend

The backend may not be running. Keep a mock implementation behind a switch
(`const USE_MOCK = !process.env.REACT_APP_API_BASE_URL`), matching the existing pattern in
`src/services/api.js`.

Mock rules: password `Avengers@2026`, OTP `123456`, any non-empty username; 3 failures →
`CAPTCHA_REQUIRED`; 5 failures → `ACCOUNT_LOCKED`. Draw the mock CAPTCHA answer plainly on
an inline SVG so it is readable during development. Export a `resetMockAuthState()`
function so tests can clear the failure counter between cases.

## Files to create or modify — this is the complete list

```
src/features/auth/authService.js     (rewrite)
src/features/auth/LoginForm.jsx      (rewrite)
src/features/auth/LoginPage.jsx      (modify)
src/features/auth/MfaForm.jsx        (new)
src/features/auth/CaptchaField.jsx   (new)
src/features/auth/auth.css           (add styles)
src/context/AuthContext.jsx          (add pendingMfa, verifyMfa, resendMfa, cancelMfa)
src/locales/en.json                  (add login.* keys)
src/locales/zh-CN.json               (add the SAME keys)
package.json                         (add "proxy": "http://localhost:8080")
```

## Done when

- `npm test` passes and `npm run build` compiles with no warnings.
- The app runs and logs in with no backend, using the mock credentials above.
- `en.json` and `zh-CN.json` have identical key sets.
- Zero files under `backend/` have been modified. Confirm this explicitly in your summary.
Two things to be aware of when you run it:

Your existing tests will break. Any helper that logs in by typing a password and clicking "Sign in" now stops at the MFA screen. The helper needs the second step added — otherwise every test that starts from a logged-in state fails, and it'll look like the login is broken when it isn't.

Copilot will probably want to "fix" the backend. It sees compile errors and tries to help. If it starts editing .java files, stop it and re-paste the constraint block — that's the main thing this prompt is guarding against.