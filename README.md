# Task: Complete the Advice feature end to end (BACKEND API + FRONTEND INTEGRATION)

## Project facts — do not change these

- Java 21, Spring Boot 4 (Spring 7.x), Maven, package root `com.scb.wealthcore`
- Entry point: `StatementGenerationApp`
- **H2 in-memory**, `spring.jpa.hibernate.ddl-auto=update` in `application.properties`.
  There is NO Flyway. The entity classes ARE the schema — do not add migrations, do not
  add a `db/migration` folder, do not add a Flyway dependency.
- Layered packages: `controller` → `service` → `repository`, plus `entity`, `dto`,
  `exception`, `config`.
- React frontend runs on **http://localhost:3001**, backend on **8080**.

## ⛔ Security does not exist yet — read this carefully

Spring Security is **not** in this project yet. It is on a separate branch and will be
merged later. So:

- **Do NOT add** `spring-boot-starter-security`, a `SecurityConfig`, JWT, filters,
  `@PreAuthorize`, or any login endpoint. That work is done and will arrive separately.
- **Do NOT accept `rmId` as a request parameter, path variable, or body field.**
  That is the trap: it would work now and become an access-control hole the moment the
  app is real, because any caller could read any RM's data by changing a number.

Instead, create ONE seam:

```java
public interface CurrentRmProvider {
    String currentRmId();
}
```

with a temporary implementation, clearly marked:

```java
/**
 * TEMPORARY. Returns a fixed RM until the auth branch lands, at which point this class
 * is replaced by one reading the authenticated session — and every endpoint becomes
 * correctly scoped without touching a single controller or service.
 */
@Component
public class FixedRmProvider implements CurrentRmProvider { ... }
```

Every service takes the RM id from `CurrentRmProvider`, and **every query filters on it**
in the WHERE clause. Write it exactly as though auth already existed. When the auth branch
merges, one class is swapped and the whole feature is secured at once.

## Entity model

`backend/DummyData/*.json` already exists — `Customer.json`, `RMs.json`, `Accounts.json`,
`Products.json`, `Product_FD.json`, `Product_MF.json`, `Product_Bonds.json`,
`Product_Insurance.json`, `Product_portfolio.json`, `transaction.json`, `Branch.json`.

**Read all of them first and derive the model from their real fields.** Do not invent one.
Move them to `src/main/resources/` so they are on the classpath and load them on startup
with a seeder that is guarded by a property and **idempotent** (skip if rows exist —
otherwise every restart duplicates the data).

Keep `RelationshipManager` **minimal**: id, username, name, initials, email, branch. No
password, no MFA fields. The auth branch adds those columns, and with `ddl-auto=update`
that merge is purely additive instead of a conflict.

## The contract rule — the one that actually matters

The Advice UI is already built and working on mock data. **Every field name the API
returns must match what the frontend already reads, exactly.** One rename and the screen
breaks silently.

Before writing any DTO, open the frontend's mock data and service layer under
`frontend/src/services/` and copy the names verbatim. Where the mock omits a key rather
than sending null, do the same with `@JsonInclude(NON_NULL)`.

- Money: `BigDecimal` end to end, serialised as a JSON **number**, never a string.
- Dates: `LocalDate`, serialised as `YYYY-MM-DD`.

## What the Advice screens need

The wizard is Details → Review → Dispatch.

**Details** — customer picker (search by name or id), Product Focus (one of: *Equity
Portfolio Restructuring, Fixed Income Advisory, Wealth Preservation & Insurance,
Retirement Planning, Alternative Investments*), Primary Language, Advice Date.

**Review** — a product summary per product type with **Current Value**,
**Investments / Contributions** and **Fees Due**, plus a Total row; a generated advice
preview (Executive Summary + Recommended Actions); and a list of attached documents.

**Dispatch** — recipient, subject, an editable message body, a "notify me when the email
is opened" flag, and a summary showing products covered and the three totals.

Endpoints (adjust names to whatever the frontend already calls):

```
GET   /advices                    list, newest first
POST  /advices                    create a draft
GET   /advices/{id}               one advice with summary + preview
PUT   /advices/{id}               save as draft
GET   /advices/{id}/preview       generated preview content
POST  /advices/{id}/send          dispatch
GET   /customers/{id}/advice-summary   per-type totals for the Review step
```

**Status lifecycle: `DRAFT → READY → SENT` (plus `FAILED`).** "Save as Draft" appears on
both Review and Dispatch, so a partially-filled advice must persist and reload cleanly —
do not require every field to be present to save.

## Three details worth getting right

1. **Aggregate the product summary in the database** with a `GROUP BY` on product type,
   not by loading every product and summing in Java. It returns a handful of rows however
   large the book gets.

2. **Return a masked email for display** (`p***i@w***.com`) and keep the real address
   server-side. The Dispatch screen only ever needs to show the RM enough to recognise it;
   the API has no reason to hand the full address to the browser.

3. **Send email off the request thread** (`@Async`) so a slow or dead SMTP server cannot
   hang the dispatch response, and record the outcome against the advice. A failed send
   must leave the record in `FAILED`, not silently look like success.

   On "notify me when opened": store the flag and an `opened_at` column, but be aware open
   tracking works by a tracking pixel and most mail clients block images — treat a missing
   open as unknown, never as "not read".

## Performance and schema

`spring.jpa.open-in-view=false`, so resolve lazy collections inside a `@Transactional`
service method. Two collections cannot be `LEFT JOIN FETCH`-ed in one query — that throws
`MultipleBagFetchException`; use one query per collection over the same managed entities.

Add `@Table(indexes = @Index(...))` for any column you filter on. With no migrations, an
index that is not on the entity does not exist.

## Errors

Add a `GlobalExceptionHandler` (`@RestControllerAdvice`) if there isn't one, returning a
single shape: `{ code, message, timestamp, details? }`. Controllers never build an error
body — they throw. Never put a stack trace, SQL, or an internal class name in a response.

An advice id that belongs to another RM returns **404, not 403** — a 403 confirms the
record exists.

## CORS

The frontend is on a different port, so this is cross-origin. Add a `WebMvcConfigurer`
CORS mapping for **`http://localhost:3001`** with `allowCredentials(true)` and the
`X-XSRF-TOKEN` header allowed.

Name the origin explicitly. **`allowedOrigins("*")` is rejected by browsers when
credentials are enabled** — configuring it correctly now means nothing changes when the
auth branch adds cookies.

## Frontend integration

Do not delete the mock — it has to keep working when the backend is down.

`.env` (committed):
```
PORT=3001
REACT_APP_API_BASE_URL=
```

`.env.local` (gitignored — add it to `.gitignore` if missing):
```
REACT_APP_API_BASE_URL=http://localhost:8080/api
```

```js
const BASE_URL = process.env.REACT_APP_API_BASE_URL || '';
const USE_MOCK = !BASE_URL;
```

Three CRA rules: only `REACT_APP_`-prefixed variables are exposed; **the dev server must
be restarted** after an `.env` change; `.env.local` overrides `.env` and is not committed.

Use `credentials: 'include'` on every request now — harmless without auth, and required
the moment it lands.

**Do not add mapping or renaming layers in the frontend.** If a field looks wrong, the API
is wrong and that is a backend fix. Every screen that fetches needs a loading state and a
visible error state — real calls are slow and can fail; the mock never did.

## Tests

`@SpringBootTest` + `MockMvc`, `@ActiveProfiles("test")`. Cover: create → save draft →
reload → dispatch; the draft lifecycle; per-type totals matching the seed data; 404 for an
unknown id; money serialising as a number, not a string; and **an advice belonging to
another RM being invisible** — that test is what proves the `CurrentRmProvider` scoping is
real and not decorative.

## Done when

`mvn clean install` passes, the Advice wizard works end to end against real data with the
mock still functional when `REACT_APP_API_BASE_URL` is empty, and **no Spring Security
dependency or config has been added**. Confirm that last point explicitly.




What Went Well
Set up the H2 database and created the required JPA entities.
Implemented the initial REST APIs for the major use cases.
Started frontend-backend integration and API testing through Swagger.
What Can Be Improved
Login and MFA had some implementation and integration issues that required additional debugging.
Some entity and API contract mismatches caused integration and JPA mapping issues.
API integration and end-to-end testing could have been started earlier.
Further Actions
Stabilize the login + MFA flow and complete authentication testing.
Complete React ↔ Spring Boot integration for the major user flows.
Increase unit/integration test coverage and verify APIs through Swagger/Postman.