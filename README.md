Prompt 1 — Backend APIs

# Task: Complete the REST API layer (BACKEND ONLY)

## Project facts — do not change any of these

- Java 21, Spring Boot 4 (Spring 7.x), Maven, package root `com.scb.wealthcore`
- Entry point: `StatementGenerationApp`
- **H2 in-memory**, `spring.jpa.hibernate.ddl-auto=update` in `application.properties`.
  There is NO Flyway. The entity classes ARE the schema — do not add migrations, do not
  add a `db/migration` folder, do not add a Flyway dependency.
- Layered packages: `controller` → `service` → `repository`, plus `entity`, `dto`,
  `exception`, `config`. Keep to this. Do not create feature packages.

## ⛔ Do not break what already works

The auth slice is finished and working: `SecurityConfig`, `AuthService`, `MfaService`,
`CaptchaService`, `LoginThrottleService`, `AuthController`, `RmController`,
`DemoDataSeeder`, `AuthProperties`, `DemoProperties`, `GlobalExceptionHandler`,
`ApiException`, `AuthExceptions`, and the `RelationshipManager` / `LoginAttempt` entities.

**Read these before writing anything and follow their conventions. Do not rewrite them.**
If you think one needs changing, say so and stop instead of editing it.

## Data source

`backend/DummyData/*.json` already exists: `Branch.json`, `RMs.json`, `Customer.json`,
`Accounts.json`, `Products.json`, `Product_FD.json`, `Product_MF.json`,
`Product_Bonds.json`, `Product_Insurance.json`, `Product_portfolio.json`,
`transaction.json`.

**Read every one of these files first and derive the entity model from their actual
fields.** Do not invent a model. Do not rename their fields.

Move them to `src/main/resources/` so they are on the classpath, and load them on startup
in a seeder that follows the existing `DemoDataSeeder` pattern:
- guarded by a property so it can be switched off
- idempotent — skip if rows already exist, or a restart duplicates everything
- reuse the existing `RelationshipManager` the auth seeder creates; do not create a second

## THE contract rule — this is the one that matters

The React frontend is already built and working against mock data. **Every JSON field name
the API returns must match what the frontend already reads, exactly.** One rename and a
screen breaks silently.

Before writing any DTO, open the frontend's mock data and API layer (look under
`frontend/src/services/`) and copy the field names verbatim — including casing like
`portfolioValue`, `nextDueDate`, `nameZh`, `dueCategory`. Where the mock omits a key
rather than sending null, do the same with `@JsonInclude(NON_NULL)`.

Money: `BigDecimal` end to end, serialised as a JSON **number**, never a string.
Dates: `LocalDate`, serialised as `YYYY-MM-DD`.

## Endpoints to build

Match the frontend's existing calls. At minimum:

```
GET  /customers                 every customer for the signed-in RM
GET  /customers/{id}            one customer with nested accounts/products/transactions
GET  /metrics/products          dashboard tiles: type, count, value — computed with a
                                GROUP BY, not hard-coded
POST /statements                queue a statement, return 202 + a document id
GET  /statements/{id}           status
POST /advices                   queue an advice document
GET  /advices/{id}              status
POST /documents/email           dispatch a generated document to the customer
```

For the Advice flow the UI already sends: customer id, product focus (one of *Equity
Portfolio Restructuring, Fixed Income Advisory, Wealth Preservation & Insurance,
Retirement Planning, Alternative Investments*), primary language, advice date, an optional
message, and a "notify when opened" flag. Accept all of them.

## Security — every endpoint

The RM comes from the authenticated session (`AuthService.currentRmId(authentication)`),
**never** from a request parameter. Every query filters on it, in the WHERE clause. An RM
must never be able to read another RM's customers by guessing an id — add a test with two
RMs proving it.

A customer id that belongs to someone else returns **404, not 403**. A 403 confirms the
record exists, which leaks the shape of another RM's book.

## Performance

`spring.jpa.open-in-view=false`, so resolve lazy collections inside a `@Transactional`
service method. Two collections cannot be `LEFT JOIN FETCH`-ed in one query — that throws
`MultipleBagFetchException`. Use one query per collection over the same managed entities.

Add `@Table(indexes = @Index(...))` for any column you filter on. There are no migrations,
so an index that is not on the entity does not exist.

## Errors

Never build an error body in a controller. Throw `ApiException` (or a subclass) and let
the existing `GlobalExceptionHandler` shape it. Never put a stack trace, SQL, or an
internal class name in a response.

## CORS — needed because the frontend is on a different port

The React app runs on **http://localhost:3001**. Add a CORS config allowing that exact
origin with `allowCredentials(true)`.

**`allowedOrigins("*")` will NOT work with credentials** — the browser rejects a wildcard
origin on a credentialed request, and the session cookie never arrives. Name the origin
explicitly. Allow the `X-XSRF-TOKEN` header, or every POST fails CSRF.

## Tests

`src/test/java/com/scb/wealthcore/`, `@SpringBootTest` + `MockMvc`, `@ActiveProfiles("test")`,
`@WithMockUser(username = "RM001")`. Cover: the happy path per endpoint, 401 without a
session, the two-RM isolation check, 404 for an unknown id, and that money serialises as a
number.

## Done when

`mvn clean install` passes, the app starts, every endpoint returns data the existing
frontend renders unchanged, and no file listed under "Do not break" was modified.
Confirm that last point explicitly.




Prompt 2 — Frontend wiring

# Task: Point the React app at the real backend (FRONTEND ONLY)

## ⛔ Do not touch `backend/` — no .java, no .properties, no pom.xml.

If the API misbehaves, report it; do not fix it here.

## Goal

The app currently runs on mock data. Add a switch so it can talk to the Spring backend on
`http://localhost:8080`, **without deleting the mock** — the mock has to keep working so
the UI still runs when the backend is down.

## Environment files

Create `.env` in the frontend root (committed, safe defaults):

```
PORT=3001
REACT_APP_API_BASE_URL=
```

Create `.env.local` (gitignored — add it to `.gitignore` if missing):

```
REACT_APP_API_BASE_URL=http://localhost:8080/api
```

Three Create React App rules to respect:
1. Only variables starting with **`REACT_APP_`** are exposed. `API_URL=` is silently ignored.
2. **The dev server must be restarted** after any `.env` change — it does not hot-reload.
3. `.env.local` overrides `.env` and is not committed. Local URLs go there.

Empty `REACT_APP_API_BASE_URL` = mock mode. Set = real backend. That way a fresh clone
works with no backend, and switching is one line with no code change.

## API layer

In the existing service layer (`frontend/src/services/`), keep the current mock and add
the real path behind that switch:

```js
const BASE_URL = process.env.REACT_APP_API_BASE_URL || '';
const USE_MOCK = !BASE_URL;
```

Every real request needs:
- `credentials: 'include'` — without it the session cookie is neither sent nor stored,
  and every call is a 401
- the CSRF token read from the `XSRF-TOKEN` cookie, sent back as an `X-XSRF-TOKEN` header
  — without it every POST is a 403

Throw a typed error carrying the server's `{ code, message, details }` so screens can
branch on `code`, never on message text.

## Do not reshape the data

The backend returns the same field names the mock uses. **Do not add mapping or renaming
layers** — if a field looks wrong, the API is wrong and that is a backend fix.

Keep any client-side derivation that already exists (grouping products under accounts, for
example) and apply it to real responses too, so both paths produce identical shapes.

## Loading and error states

Real calls are slow and can fail; the mock never did. Every screen that fetches needs a
loading state and a visible error state. A silent empty table is the failure mode to avoid.

## Verify

1. With `REACT_APP_API_BASE_URL` empty, `npm start` — the app runs entirely on mock data.
2. Set it in `.env.local`, restart, start the backend, and confirm login → dashboard →
   customer list → statements → advice all work against real data.
3. Stop the backend — the app shows errors, not a blank screen.
4. `npm test` and `npm run build` both pass.
The one thing most likely to bite you: your frontend is on 3001 and the backend on 8080, so this is cross-origin. allowedOrigins("*") with allowCredentials(true) is rejected by the browser — the cookie silently never arrives and everything 401s. The origin has to be named explicitly.

If you'd rather sidestep CORS entirely, the alternative is "proxy": "http://localhost:8080" in package.json and leave REACT_APP_API_BASE_URL empty — one origin, no CORS config at all. But you asked for .env, so that's what the prompt above builds.



