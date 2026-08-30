Update the existing React dashboard CSS to make the application fully responsive, especially for an iPhone SE viewport (~375px wide).

IMPORTANT:

- Do NOT redesign the entire dashboard.
- Do NOT change the existing Standard Chartered branding/colors.
- Do NOT change any existing functionality, routes, components, data, or API logic.
- Preserve the current desktop layout as much as possible.
- Only modify the CSS/layout necessary for responsive behavior.
- Do NOT use "transform: scale()" or "zoom" as a workaround.

1. Mobile layout

For screens below approximately 768px:

- Hide the desktop sidebar or replace it with a compact mobile menu/hamburger if one already exists.
- The main content should occupy 100% of the viewport width.
- Remove fixed widths that cause horizontal overflow.
- Use "width: 100%", "max-width: 100%", and responsive padding where appropriate.
- Make sure there is no horizontal scrolling on the overall page.

2. Header

Make the header responsive for approximately 375px width.

Desktop:

- Keep the existing logo, search, language selector, and user profile.

Mobile:

- Keep the logo visible.
- Keep the user/profile control visible.
- Move the search bar to a second row and make it full width.
- If necessary, hide or simplify the language selector on very small screens.
- Prevent the search bar, logo, and user profile from overlapping or being cut off.
- Maintain proper spacing and alignment.
- Do not make the header excessively tall.

3. Dashboard banner

For mobile:

- Make the banner width 100%.
- Stack the title/text and action buttons vertically if necessary.
- Keep "Export Report" and "+ New Customer" buttons accessible without overflowing.
- Preserve the existing blue-to-green branding.

4. Product cards

The current desktop layout has multiple cards in one row.

For mobile:

- Change the product grid to one column.
- Each card should use the full available width.
- Maintain consistent spacing between cards.
- Do not allow card content or icons to overflow.

For tablet-sized screens, use an appropriate 2-column layout where possible.

5. Priority Customers table

The table currently contains columns such as:

- Name
- Priority
- Due Date
- Category
- Reason

Do NOT squeeze all columns into the iPhone SE width.

Instead:

- Put the table inside a horizontally scrollable container on mobile.
- Keep the table readable.
- Prevent the entire page from getting horizontal overflow.
- Only the table itself should scroll horizontally.

Example approach:
.priority-table-wrapper {
width: 100%;
overflow-x: auto;
}

The table can have a reasonable minimum width so all columns remain readable.

6. General mobile CSS

Add appropriate media queries, preferably around:

@media (max-width: 768px)

and, if required:

@media (max-width: 480px)

Pay special attention to the iPhone SE width of approximately 375px.

Check and remove:

- Fixed desktop widths
- Fixed margins that push content outside the viewport
- Fixed grid columns
- Absolute positioning that causes overflow
- Excessive padding
- Elements with widths larger than the viewport

7. Desktop preservation

At widths above 768px:

- Keep the current desktop sidebar.
- Keep the current desktop header arrangement.
- Keep the existing product-card grid.
- Do not unnecessarily change the current desktop appearance.

8. Final validation





# Statement Generation — Frontend Flow Redesign Spec ## Context The Generate Statement wizard in the team project (the app in the screenshots — **not** the local avengers repo, which is a different, older build) has 5 steps: Customer → Product → Type & Period → Review → Generate. The flow is incoherent today: 1. **Step 2 is mislabelled and under-powered.** The hint says "Select the products or accounts to include" but only products are listed. Account Number is a read-only *column*, not a selectable level — so the user can never actually "select an account", even though the whole downstream branching depends on that distinction. 2. **Statement Type is disconnected from the selection.** Step 3 offers all four types unconditionally. You can select a single Bond and pick "Consolidated Wealth Statement", or carefully select two products and pick "Portfolio Statement" — which silently throws that selection away. Nothing validates the combination. 3. **The order is backwards.** The user must fix scope (step 2) before knowing what kind of document they're producing (step 3). Scope only has meaning *relative to* a statement type. 4. **Period is type-blind.** A Portfolio Statement is a point-in-time snapshot; a date *range* is meaningless for it. Custom range has no validation (no From ≤ To, no future-date guard). 5. **Review is noisy.** A "Show 50" page-size selector and pagination controls sit above a 1-row table. **Intended outcome:** the selection drives the statement type, invalid combinations become unreachable rather than merely wrong, and each step only asks what it can meaningfully ask. ### Decisions locked in - **Data model:** an account holds many products. Customer → Account[] → Product[]. The screenshot's flat table is product rows displaying their parent account number. - **Type derivation:** adaptive — what you select determines which statement types are offered. - **Product-level options:** Product-specific details, and Holdings Summary. - **Deliverable:** this spec. Implementation happens in the team repo. ### Assumed data shape The spec assumes this shape. Adjust field names to match the real repo; the structure is what matters.
js
Customer {
  customerId, customerName, type, portfolioValue, riskProfile,
  accounts: [
    Account {
      accountNumber, accountName, accountType,   // 'Savings' | 'Current' | 'Investment' | ...
      currency, balance,
      transactions: [ { id, date, description, amount, productId? } ],
      products: [ Product { productId, productName, productType, amount } ]
    }
  ]
}
--- ## The redesigned flow Stepper labels stay as they are (Customer · Product · Type & Period · Review · Generate) so the finalised visual design is untouched. What changes is **which decision lives in which step**: Statement Type moves from step 3 up into step 2, where the selection that constrains it is made. ### Step 1 — Customer Keep the screenshot's UI: search box, table (Select radio · Customer ID · Customer Name · Type · Portfolio Value · Risk Profile), "Showing X to Y of Z customers", page-size selector, pager. Additions: - **Selected-customer preview panel** below the table, appearing on selection. This delivers your "shows customer products → shows customer account" without adding a step:
Priya Nair (CUST1002) · Regular · Conservative
  2 accounts · 3 products · ₹15,12,000
    50123456002   Savings      ₹5,62,000    2 products
    901234560002  Investment   ₹14,50,000   1 product
Read-only here. Selection happens in step 2. - **Gate:** Continue disabled until a customer is selected. - **Cascade:** changing the customer clears *all* downstream state (scope, type, detail level, period, and the furthest-reached step). This is the single most common source of a corrupt wizard. ### Step 2 — Scope & Statement Type This step now carries both halves of your STEP 2 text. Two panels, the second revealed by the first. **Panel A — Include**
java
( ) Entire portfolio        — every account and product for this customer
(•) Selected accounts and products
Choosing "Entire portfolio" collapses the table and forces type = Portfolio Statement. Choosing "Selected…" reveals a **grouped, two-level table**:
css
Select   Account / Product              Account Number    Amount
 [✓]     ▾ Savings                      50123456002       ₹5,62,000
   [✓]       Bond                       50123456002         ₹62,000
   [ ]       SC Fixed Deposit           50123456002       ₹5,00,000
 [ ]     ▾ Investment                   901234560002      ₹14,50,000
   [ ]       Portfolio Management       901234560002      ₹14,50,000
- Account row checkbox is **tri-state**: checked (all products), indeterminate (some), unchecked. - Checking an account checks all its products; unchecking clears them. - Account rows are collapsible; keep them expanded by default. - Pagination applies to *account groups*, not product rows, so a group is never split across pages. **Panel B — Statement Type** — renders as soon as the selection is non-empty. Only valid types are enabled; invalid ones stay visible but disabled with a one-line reason, so the rule is learnable rather than mysterious. | SelectionEnabled typesDefault | | | | ------------------------------------------------- | ---------------------------------------------------- | ----------------------------- | | Entire portfolio | Portfolio Statement | Portfolio Statement | | Exactly 1 account, fully selected | Account Statement, Transaction Statement | Account Statement | | 2+ accounts, fully selected | Consolidated Wealth Statement, Transaction Statement | Consolidated Wealth Statement | | Products only (partial account) | Account Statement, Transaction Statement | Account Statement | | Mixed (1 full account + loose products elsewhere) | Consolidated Wealth Statement | Consolidated Wealth Statement | Disabled-reason copy: - Portfolio Statement → "Select 'Entire portfolio' to generate a portfolio statement." - Consolidated Wealth Statement → "Requires two or more accounts." - Account Statement → "Not available for a whole-portfolio scope." **Panel C — Detail level** — shown only when the selection is **product-level** (partial account) and type is Account Statement. This is your "product specific details / what else":
css
(•) Product-specific details   — one section per selected product, with its own holdings and activity
( ) Holdings summary           — a single combined table of the selected products with a grand total
**Gate:** Continue requires a non-empty selection **and** a chosen (valid) statement type. **Cascade:** any change to the selection re-runs the derivation. If the currently chosen type is no longer in the enabled set, clear it and require a fresh pick — do not silently keep an invalid type. ### Step 3 — Period & Language Statement Type is **gone from this step**. What remains is type-aware. **Statement Period** - Types Account | Transaction | Consolidated Wealth → the screenshot's radio group: Last Month · 3 Months · 6 Months · Current Year · Custom range (From / To). - Type Portfolio Statement → replace the group with a single **"As of date"** field (default: today). A snapshot has no range. **Custom range validation** (currently absent): - Both dates required. - From ≤ To. - To ≤ today. - Range ≤ 24 months. Show the error inline under the offending field and keep Continue disabled while invalid. **Output Language** — unchanged: English / Simplified Chinese radio cards. **Gate:** valid period (or a valid as-of date). ### Step 4 — Review Read-only, and it must reflect the *actual* branch taken:
sql
Customer            Priya Nair (CUST1002)
Scope               2 products across 1 account
Statement Type      Account Statement — Product-specific details
Statement Period    Current Year (01-Jan-2026 – 29-Aug-2026)
Output Language     English
- Each row gets an **Edit** link jumping to its owning step (faster than the stepper, and it makes the back-jump path explicit). - **Included items** table grouped by account, with an account subtotal and a grand **Total** row. - **Remove pagination when rows ≤ page size.** The "Show 50" control over a 1-row table is noise. ### Step 5 — Generate Generating → document preview → Download · Email · Generate another. "Generate another" must reset the *whole* wizard including type and period, not just customer and products. --- ## Cross-cutting changes These are what actually stop the flow degenerating into a mess again. **1. One step config, not parallel arrays.** Replace index-parallel STEP_KEYS / SUBTITLE_KEYS plus hard-coded step === 3 comparisons with a single array:
js
const STEPS = [
  { id: 'customer',  labelKey, subtitleKey, isValid: (s) => Boolean(s.customerId) },
  { id: 'scope',     labelKey, subtitleKey, isValid: (s) => hasSelection(s) && isTypeValid(s) },
  { id: 'period',    labelKey, subtitleKey, isValid: (s) => isPeriodValid(s) },
  { id: 'review',    labelKey, subtitleKey, isValid: () => true },
  { id: 'generate',  labelKey, subtitleKey, isValid: () => true },
];
Navigation becomes STEPS[step].isValid(state). Adding or reordering a step stops being a three-place edit. **2. Reducer, not scattered&#xA0;****useState****.** The cascade rules are the core of this redesign and they are cross-field, so put wizard state in a useReducer:
js
{ step, furthestStep, customerId,
  scope: { mode: 'portfolio' | 'selection', accountNumbers: [], productIds: [] },
  statementType: null,
  detailLevel: 'productDetails' | 'holdingsSummary',
  period: { preset, from, to, asOf },
  language: 'en' }
Actions: SELECT_CUSTOMER, SET_SCOPE_MODE, TOGGLE_ACCOUNT, TOGGLE_PRODUCT, SET_TYPE, SET_DETAIL_LEVEL, SET_PERIOD, SET_LANGUAGE, GO_TO_STEP, RESET. Each mutating action clears everything downstream of it. Centralising this in the reducer is what prevents the stale-state bugs the current flow has. **3. Pure derivation module** — statementRules.js, framework-free and unit-testable:
js
allowedStatementTypes(scope, customer) -> [{ type, enabled, reason }]
defaultStatementTypeFor(scope, customer) -> type
periodModeFor(statementType) -> 'range' | 'asOf'
validatePeriod(period, statementType) -> { valid, errors }
selectionSummary(scope, customer) -> { accountCount, productCount, total }
Every branching rule in this spec lives here and nowhere else. The step components read it; they never re-implement it. **4. Furthest-step clamp.** Track furthestStep. The stepper allows back-jumps to any completed step, but after an edit invalidates a later step, clamp furthestStep back so the user cannot skip forward over a now-invalid step. **5. One&#xA0;****<PaginatedTable>****.** Steps 1, 2 and 4 currently each carry their own copy of page-size + "Showing X to Y of Z" + pager. Extract one component that also **auto-hides its controls when&#xA0;****rows.length <= pageSize**. This alone removes the odd "Show 50 / Showing 1 to 1 of 1" on Review. **6. Cancel needs a confirm.** The footer's Cancel currently discards silently. Confirm before discarding when any selection has been made. **7. Empty and error states.** Customer with no accounts; account with no products; search with no matches; generation failure. Each needs its own message — today they render as blank tables. **8. Deep-link entry.** Entering the wizard from a customer row should pre-fill step 1 and open on step 2, rather than making the RM re-find the customer they just had open. --- ## Suggested file layout
typescript
features/statements/
  StatementPage.jsx          parent: reducer, stepper, footer nav only — no step markup
  statementRules.js          pure derivation + validation (item 3)
  steps/
    StepCustomer.jsx         table + search + selected-customer preview panel
    StepScope.jsx            Panel A/B/C — grouped table, type picker, detail level
    StepPeriod.jsx           type-aware period + language
    StepReview.jsx           summary + edit links + grouped items table
    StepGenerate.jsx         progress, preview, download/email
components/ui/
  PaginatedTable.jsx         shared, auto-hiding controls (item 5)
  GroupedSelectTable.jsx     two-level tri-state checkbox table (step 2)
StatementPage.jsx should end up a thin shell: state + which step renders + footer. All step markup moves out. --- ## Verification 1. **Rules first.** Unit-test statementRules.js against the derivation table above — every row, plus mixed selection, empty selection, single-account-with-one-product, and portfolio mode. 2. **Cascade tests.** Complete the wizard to step 4, jump back to step 1, change the customer → assert scope, type, period and furthestStep all reset. Repeat for a step-2 selection change that invalidates the chosen type (select 2 accounts → pick Consolidated Wealth → go back and deselect one account → assert type is cleared, not silently kept). 3. **Period tests.** Portfolio Statement renders "As of date" and no range. Custom range rejects From > To, a future To, and a range over 24 months, with Continue disabled. 4. **Path walkthroughs** in the running app — one per branch: - single account → Account Statement - single account → Transaction Statement - two accounts → Consolidated Wealth Statement - two products in one account → Account Statement / Product-specific details - same selection → Holdings summary - entire portfolio → Portfolio Statement Confirm each Review page states the right type and scope, and each generated document matches. 5. **Regression:** existing wizard tests will break on the moved Statement Type control and the new step-2 markup — update selectors as part of the change, don't skip them. --- ## Open question Transaction Statement is offered for product-level selections on the assumption that the account's ledger can be filtered to those products (i.e. transactions carry a productId). If the real transaction records have no product link, drop Transaction Statement from the "Products only" row of the derivation table — it can then only be offered at account level. can u tell both the ideas are same or if there is difference which one is better?





| Field | Type | Constraints | Meaning |
|---|---|---|---|
| `id` | BIGINT | Primary Key, Not Null, Auto-generated | Unique ID of the Relationship Manager |
| `username` | VARCHAR | Not Null, Unique | Login username of the RM |
| `password_hash` | VARCHAR | Not Null | BCrypt-hashed login password; the actual password is never stored |
| `name` | VARCHAR | Not Null | Full name of the Relationship Manager |
| `initials` | VARCHAR | Not Null | Short initials used for display, e.g. `RK` |
| `email` | VARCHAR | Not Null | RM's email address used for MFA OTP |
| `branch` | VARCHAR | Not Null | Branch associated with the RM |
| `mfa_enabled` | BOOLEAN | Not Null, Default `true` | Determines whether email OTP MFA is required |
| `created_at` | TIMESTAMP WITH TIME ZONE | Not Null | Date and time when the RM record was created |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Not Null | Date and time when the RM record was last updated |





package com.sc.wealthcore.service;

import com.sc.wealthcore.dto.CaptchaResponse;
import com.sc.wealthcore.dto.LoginRequest;
import com.sc.wealthcore.dto.LoginResponse;
import com.sc.wealthcore.dto.MfaVerifyRequest;
import com.sc.wealthcore.dto.RmProfile;
import com.sc.wealthcore.entity.LoginAttempt.Outcome;
import com.sc.wealthcore.entity.RelationshipManager;
import com.sc.wealthcore.exception.AuthExceptions;
import com.sc.wealthcore.repository.RelationshipManagerRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Optional;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Owner: Rajnish — US03. Orchestrates sign-in: throttle, CAPTCHA, password, second factor.
 *
 * <p>The ordering is the security design. A caller is only authenticated at the very last
 * step, in {@link #verifyMfa}: passing the password establishes nothing but a pending
 * challenge on the session, so an interrupted sign-in grants no access at all.
 */
@Service
public class AuthService {

    private final RelationshipManagerRepository relationshipManagers;
    private final PasswordEncoder passwordEncoder;
    private final LoginThrottleService throttle;
    private final CaptchaService captcha;
    private final MfaService mfa;

    /**
     * A real hash of a random value nobody knows, compared against when the username does
     * not exist. Without it, "no such user" returns immediately while "wrong password"
     * spends ~100ms hashing — a difference that is trivially measurable over a network and
     * turns this endpoint into a user-enumeration oracle.
     *
     * <p>Generated here from the injected encoder rather than pasted in as a literal, so
     * it is guaranteed to be a well-formed hash at the configured cost. A malformed
     * literal would make {@code matches} bail out early and silently undo the defence.
     */
    private final String dummyHash;

    public AuthService(RelationshipManagerRepository relationshipManagers,
                       PasswordEncoder passwordEncoder,
                       LoginThrottleService throttle,
                       CaptchaService captcha,
                       MfaService mfa) {
        this.relationshipManagers = relationshipManagers;
        this.passwordEncoder = passwordEncoder;
        this.throttle = throttle;
        this.captcha = captcha;
        this.mfa = mfa;
        this.dummyHash = passwordEncoder.encode(java.util.UUID.randomUUID().toString());
    }

    /** Step one: credentials (plus a CAPTCHA once the caller has been failing). */
    @Transactional
    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest, HttpSession session) {
        String username = request.username().trim();
        String ip = throttle.clientIp(httpRequest);

        LoginThrottleService.Status status = throttle.statusFor(username, ip);

        // Locked wins over everything. Note the correct password will not get past this
        // either — that is the point of a lockout.
        if (status.locked()) {
            throttle.record(username, ip, Outcome.LOCKED);
            throw new AuthExceptions.AccountLocked(throttle.lockRetryAfterSeconds(),
                    "Locked out: " + username + " from " + ip);
        }

        // The CAPTCHA gate sits in front of the password check, so a bot cannot use this
        // endpoint as a password oracle even at one guess per challenge.
        if (status.captchaRequired()) {
            boolean solved = captcha.verifyAndConsume(session, request.captchaAnswer());
            if (!solved) {
                throttle.record(username, ip, Outcome.CAPTCHA_FAILED);
                CaptchaResponse fresh = captcha.issue(session);
                throw new AuthExceptions.CaptchaRequired(
                        fresh.imageDataUri(),
                        fresh.expiresInSeconds(),
                        request.captchaAnswer() == null
                                ? "Please complete the security check."
                                : "That security check was not correct. Try the new image.",
                        "CAPTCHA gate for " + username + " from " + ip);
            }
        }

        Optional<RelationshipManager> found =
                relationshipManagers.findByUsernameIgnoreCase(username);

        // Always hash something, whether or not the user exists — see dummyHash.
        String hashToCheck = found.map(RelationshipManager::getPasswordHash).orElse(dummyHash);
        boolean passwordOk = passwordEncoder.matches(request.password(), hashToCheck);

        if (found.isEmpty() || !passwordOk) {
            throttle.record(username, ip, Outcome.BAD_CREDENTIALS);
            // One exception type, one message, for both causes. The log distinguishes
            // them; the response does not.
            throw new AuthExceptions.InvalidCredentials(found.isEmpty()
                    ? "No such user: " + username + " from " + ip
                    : "Wrong password for " + username + " from " + ip);
        }

        RelationshipManager rm = found.get();

        // MFA off for this RM: sign in here. Still a fresh session, so a pre-auth session
        // id cannot be replayed.
        if (!rm.isMfaEnabled()) {
            throttle.record(username, ip, Outcome.SUCCESS);
            authenticate(rm, httpRequest);
            return LoginResponse.signedIn(RmProfile.from(rm));
        }

        // Password was right, but nothing is granted yet.
        mfa.startChallenge(session, rm);
        return LoginResponse.mfaChallenge(MfaService.maskEmail(rm.getEmail()), mfa.resendCooldownSeconds());
    }

    /** Step two: the emailed code. Only here does the caller actually become authenticated. */
    @Transactional
    public RmProfile verifyMfa(MfaVerifyRequest request, HttpServletRequest httpRequest, HttpSession session) {
        String ip = throttle.clientIp(httpRequest);
        String rmId = mfa.pendingRmId(session);

        MfaService.Result result = mfa.verify(session, request.code());

        if (result != MfaService.Result.OK) {
            // Recorded against the throttle counters, so guessing codes trips the same
            // lockout that guessing passwords does.
            throttle.record(rmId == null ? "" : rmId, ip, Outcome.MFA_FAILED);
            throw switch (result) {
                case NO_CHALLENGE -> new AuthExceptions.MfaNotPending("No pending code from " + ip);
                case EXPIRED -> new AuthExceptions.MfaCodeExpired("Expired code for " + rmId);
                case TOO_MANY_ATTEMPTS -> new AuthExceptions.MfaAttemptsExhausted("Attempts used up for " + rmId);
                default -> new AuthExceptions.MfaCodeInvalid("Wrong code for " + rmId);
            };
        }

        RelationshipManager rm = relationshipManagers.findById(rmId)
                // The RM was deleted between password and code. Treat as a failed sign-in.
                .orElseThrow(() -> new AuthExceptions.MfaNotPending("Pending RM vanished: " + rmId));

        throttle.record(rm.getUsername(), ip, Outcome.SUCCESS);
        authenticate(rm, httpRequest);
        return RmProfile.from(rm);
    }

    /** Sends a replacement code, subject to the cooldown. */
    @Transactional(readOnly = true)
    public String resendMfa(HttpSession session) {
        String rmId = mfa.pendingRmId(session);
        if (rmId == null) {
            throw new AuthExceptions.MfaNotPending("Resend with no pending challenge");
        }

        long wait = mfa.resendWaitSeconds(session);
        if (wait > 0) {
            throw new AuthExceptions.ResendTooSoon(wait, "Resend too soon for " + rmId);
        }

        RelationshipManager rm = relationshipManagers.findById(rmId)
                .orElseThrow(() -> new AuthExceptions.MfaNotPending("Pending RM vanished: " + rmId));

        // Issues a brand new code and invalidates the previous one.
        mfa.startChallenge(session, rm);
        return MfaService.maskEmail(rm.getEmail());
    }

    public void logout(HttpSession session) {
        mfa.clear(session);
        SecurityContextHolder.clearContext();
        // Kills the server-side session outright, so the cookie the browser keeps is inert.
        session.invalidate();
    }

    @Transactional(readOnly = true)
    public RmProfile currentRm(Authentication authentication) {
        return RmProfile.from(requireRm(authentication));
    }

    /**
     * The signed-in RM's id, for the endpoints that scope their queries by it.
     *
     * <p>The session carries a username, not an id, so this resolves one to the other.
     * Every data endpoint goes through here rather than trusting an id from the request —
     * an RM id taken from a path or a body would let anyone read another RM's book.
     */
    @Transactional(readOnly = true)
    public String currentRmId(Authentication authentication) {
        return requireRm(authentication).getId();
    }

    private RelationshipManager requireRm(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AuthExceptions.InvalidCredentials("No authentication on the request");
        }
        return relationshipManagers.findByUsernameIgnoreCase(authentication.getName())
                .orElseThrow(() -> new AuthExceptions.InvalidCredentials(
                        "Session references a missing RM: " + authentication.getName()));
    }

    /**
     * Establishes the authenticated session.
     *
     * <p>{@code changeSessionId()} is the session-fixation defence: whatever session id
     * carried the pre-auth challenge is discarded and a new one issued, so an id an
     * attacker planted or observed beforehand is worthless.
     *
     * <p>The context is saved explicitly because this authentication does not run through
     * a Spring Security filter — without the save it would live only for this request and
     * the very next call would be a 401.
     */
    private void authenticate(RelationshipManager rm, HttpServletRequest httpRequest) {
        httpRequest.changeSessionId();

        User principal = new User(rm.getUsername(), rm.getPasswordHash(), List.of());
        Authentication authentication =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        httpRequest.getSession().setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);
    }
}

