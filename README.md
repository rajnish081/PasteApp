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

After making the changes:

- Check the layout at approximately 375px width.
- Check approximately 768px width.
- Check desktop width such as 1366px.
- Make sure there is no unwanted horizontal page scrolling.
- Make sure every button and important control remains accessible.
- Run the project/build if possible and fix any CSS or compilation errors.

Before changing code, inspect the existing components and CSS structure and reuse the existing class names where possible instead of creating unnecessary duplicate styles.



import { SUPPORTED_LANGUAGES, useLanguage } from '../../context/LanguageContext';

// US05 — the RM must be able to change the display language at will.
// English and Simplified Chinese are mandatory.
// Rendered as a pill that cycles through the supported languages; the real
// <select> underneath keeps it keyboard- and screen-reader-accessible.




/* --- Language pill --- */
.language-pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 999px;
  background: var(--sc-blue);
  color: #fff;
  font-size: 14px;
  white-space: nowrap;
}

.language-pill select {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  /* Sits invisibly over the pill so the native picker and keyboard focus
     both work while the styled label shows through. */
}


.language-pill:focus-within {
  outline: 2px solid var(--sc-blue-dark);
  outline-offset: 2px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}


#hii
import {
  DETAIL_LEVELS,
  SCOPE_MODES,
  defaultStatementTypeFor,
  isTypeAllowed,
  periodModeFor,
  toIsoDate,
} from './statementRules';

// All wizard state in one reducer. The point is the cascade: every mutating
// action clears what depends on it, so it is impossible to reach Review
// carrying a statement type that the current selection no longer allows.

export const STEPS = {
  CUSTOMER: 0,
  SCOPE: 1,
  PERIOD: 2,
  REVIEW: 3,
  GENERATE: 4,
};

export const initialState = {
  step: STEPS.CUSTOMER,
  furthestStep: STEPS.CUSTOMER,
  customerId: '',
  scope: { mode: SCOPE_MODES.SELECTION, productIds: [] },
  statementType: null,
  detailLevel: DETAIL_LEVELS.PRODUCT_DETAILS,
  period: { preset: 'lastMonth', from: '', to: '', asOf: toIsoDate(new Date()) },
  language: 'en',
  result: null,
  message: '',
  error: '',
  generating: false,
};

function clampFurthest(state, step) {
  return { ...state, furthestStep: Math.min(state.furthestStep, step) };
}

// Re-checks the chosen type against the new selection. If it is no longer
// allowed it is cleared rather than silently kept — the RM must pick again.
function reconcileType(state, customer) {
  if (!state.statementType) return state;
  if (isTypeAllowed(state.statementType, state.scope, customer)) return state;
  return { ...state, statementType: null };
}

// Switching between a range and an as-of snapshot invalidates the other one.
function reconcilePeriod(state, previousType) {
  if (periodModeFor(state.statementType) === periodModeFor(previousType)) return state;
  return { ...state, period: { ...initialState.period, asOf: toIsoDate(new Date()) } };
}

export function statementReducer(state, action) {
  switch (action.type) {
    case 'SELECT_CUSTOMER': {
      if (action.customerId === state.customerId) return state;
      // A different customer invalidates everything downstream.
      return {
        ...initialState,
        period: { ...initialState.period },
        scope: { ...initialState.scope, productIds: [] },
        customerId: action.customerId,
        language: state.language,
        step: state.step,
        furthestStep: STEPS.CUSTOMER,
      };
    }

    case 'SET_SCOPE_MODE': {
      const scope =
        action.mode === SCOPE_MODES.PORTFOLIO
          ? { mode: SCOPE_MODES.PORTFOLIO, productIds: [] }
          : { mode: SCOPE_MODES.SELECTION, productIds: [] };
      const next = clampFurthest({ ...state, scope, statementType: null }, STEPS.SCOPE);
      return { ...next, statementType: defaultStatementTypeFor(scope, action.customer) };
    }

    case 'TOGGLE_PRODUCT': {
      const ids = state.scope.productIds;
      const productIds = ids.includes(action.productId)
        ? ids.filter((id) => id !== action.productId)
        : [...ids, action.productId];
      const scope = { ...state.scope, productIds };
      return reconcileType(clampFurthest({ ...state, scope }, STEPS.SCOPE), action.customer);
    }

    case 'TOGGLE_ACCOUNT': {
      const own = action.account.products.map((p) => p.id);
      const allPicked = own.every((id) => state.scope.productIds.includes(id));
      const productIds = allPicked
        ? state.scope.productIds.filter((id) => !own.includes(id))
        : [...new Set([...state.scope.productIds, ...own])];
      const scope = { ...state.scope, productIds };
      return reconcileType(clampFurthest({ ...state, scope }, STEPS.SCOPE), action.customer);
    }

    case 'SET_TYPE': {
      const next = clampFurthest({ ...state, statementType: action.statementType }, STEPS.SCOPE);
      return reconcilePeriod(next, state.statementType);
    }

    case 'SET_DETAIL_LEVEL':
      return clampFurthest({ ...state, detailLevel: action.detailLevel }, STEPS.SCOPE);

    case 'SET_PERIOD':
      return clampFurthest(
        { ...state, period: { ...state.period, ...action.patch } },
        STEPS.PERIOD
      );

    case 'SET_LANGUAGE':
      return clampFurthest({ ...state, language: action.language }, STEPS.PERIOD);

    case 'GO_TO_STEP':
      return {
        ...state,
        step: action.step,
        furthestStep: Math.max(state.furthestStep, action.step),
        error: '',
      };

    case 'GENERATE_START':
      return { ...state, generating: true, error: '' };

    case 'GENERATE_SUCCESS':
      return {
        ...state,
        generating: false,
        result: action.result,
        message: action.message,
        step: STEPS.GENERATE,
        furthestStep: STEPS.GENERATE,
      };

    case 'GENERATE_FAILURE':
      return { ...state, generating: false, error: action.error };

    case 'SET_MESSAGE':
      return { ...state, message: action.message };

    case 'RESET':
      // "Generate another" resets everything except the RM's language choice.
      return { ...initialState, period: { ...initialState.period }, language: state.language };

    default:
      return state;
  }
}










// Every branching rule for the statement wizard lives here and nowhere else.
// Pure functions only — no React, no i18n, no formatting. Components read these
// and never re-derive a rule for themselves.

export const SCOPE_MODES = {
  PORTFOLIO: 'portfolio',
  SELECTION: 'selection',
};

export const TYPES = {
  ACCOUNT: 'accountStatement',
  TRANSACTION: 'transactionStatement',
  PORTFOLIO: 'portfolioStatement',
  CONSOLIDATED: 'consolidatedWealthStatement',
};

export const DETAIL_LEVELS = {
  PRODUCT_DETAILS: 'productDetails',
  HOLDINGS_SUMMARY: 'holdingsSummary',
};

export const MAX_RANGE_MONTHS = 24;

// --- selection ----------------------------------------------------------
// The selection is stored as productIds ONLY. "Account is selected" means
// every product in it is selected — deriving that instead of storing a second
// array is what stops the two from drifting out of sync.

export function accountState(account, productIds) {
  const total = account.products.length;
  const picked = account.products.filter((p) => productIds.includes(p.id)).length;
  if (picked === 0) return 'none';
  return picked === total ? 'all' : 'some';
}

export function selectionSummary(scope, customer) {
  const accounts = customer?.accounts || [];

  if (!customer) {
    return {
      isEmpty: true, isPortfolio: false, accounts: [], products: [],
      fullAccounts: [], partialAccounts: [], accountCount: 0, productCount: 0, total: 0,
    };
  }

  if (scope.mode === SCOPE_MODES.PORTFOLIO) {
    const products = accounts.flatMap((a) => a.products);
    return {
      isEmpty: products.length === 0,
      isPortfolio: true,
      accounts,
      products,
      fullAccounts: accounts,
      partialAccounts: [],
      accountCount: accounts.length,
      productCount: products.length,
      total: products.reduce((sum, p) => sum + p.value, 0),
    };
  }

  const ids = scope.productIds || [];
  const touched = accounts.filter((a) => accountState(a, ids) !== 'none');
  const products = touched.flatMap((a) => a.products.filter((p) => ids.includes(p.id)));

  return {
    isEmpty: products.length === 0,
    isPortfolio: false,
    accounts: touched,
    products,
    fullAccounts: touched.filter((a) => accountState(a, ids) === 'all'),
    partialAccounts: touched.filter((a) => accountState(a, ids) === 'some'),
    accountCount: touched.length,
    productCount: products.length,
    total: products.reduce((sum, p) => sum + p.value, 0),
  };
}

// --- type derivation ----------------------------------------------------
// The rule, in one sentence: how many ACCOUNTS the selection touches decides
// which statement types make sense.
//
//   portfolio mode      -> Portfolio
//   1 account touched   -> Account, Transaction
//   2+ accounts touched -> Consolidated Wealth, Transaction
//
// A "partial" account (some products picked) is still one account touched, so
// the products-only case falls out of the same rule rather than needing its own.

export function allowedStatementTypes(scope, customer) {
  const summary = selectionSummary(scope, customer);
  const row = (type, enabled, reasonKey) => ({ type, enabled, reasonKey: enabled ? null : reasonKey });

  if (summary.isPortfolio) {
    return [
      row(TYPES.ACCOUNT, false, 'statements.reasonNotForPortfolio'),
      row(TYPES.TRANSACTION, false, 'statements.reasonNotForPortfolio'),
      row(TYPES.PORTFOLIO, true),
      row(TYPES.CONSOLIDATED, false, 'statements.reasonNotForPortfolio'),
    ];
  }

  if (summary.isEmpty) {
    return [
      row(TYPES.ACCOUNT, false, 'statements.reasonSelectSomething'),
      row(TYPES.TRANSACTION, false, 'statements.reasonSelectSomething'),
      row(TYPES.PORTFOLIO, false, 'statements.reasonPortfolioOnly'),
      row(TYPES.CONSOLIDATED, false, 'statements.reasonSelectSomething'),
    ];
  }

  const multiAccount = summary.accountCount >= 2;

  return [
    row(TYPES.ACCOUNT, !multiAccount, 'statements.reasonSingleAccountOnly'),
    row(TYPES.TRANSACTION, true),
    row(TYPES.PORTFOLIO, false, 'statements.reasonPortfolioOnly'),
    row(TYPES.CONSOLIDATED, multiAccount, 'statements.reasonNeedsTwoAccounts'),
  ];
}

export function isTypeAllowed(type, scope, customer) {
  return allowedStatementTypes(scope, customer).some((r) => r.type === type && r.enabled);
}

export function defaultStatementTypeFor(scope, customer) {
  const summary = selectionSummary(scope, customer);
  if (summary.isPortfolio) return TYPES.PORTFOLIO;
  if (summary.isEmpty) return null;
  return summary.accountCount >= 2 ? TYPES.CONSOLIDATED : TYPES.ACCOUNT;
}

// The detail-level choice only means something for an Account Statement run
// over part of an account — anywhere else there is nothing to vary.
export function showsDetailLevel(scope, customer, statementType) {
  if (statementType !== TYPES.ACCOUNT) return false;
  const summary = selectionSummary(scope, customer);
  return summary.accountCount === 1 && summary.partialAccounts.length === 1;
}

// --- period -------------------------------------------------------------

export function periodModeFor(statementType) {
  return statementType === TYPES.PORTFOLIO ? 'asOf' : 'range';
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function monthsBetween(from, to) {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

export function validatePeriod(period, statementType, today = new Date()) {
  const errors = {};
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (periodModeFor(statementType) === 'asOf') {
    const asOf = toDate(period.asOf);
    if (!asOf) errors.asOf = 'statements.errorDateRequired';
    else if (asOf > endOfToday) errors.asOf = 'statements.errorFuture';
    return { valid: Object.keys(errors).length === 0, errors };
  }

  if (period.preset !== 'custom') return { valid: true, errors };

  const from = toDate(period.from);
  const to = toDate(period.to);

  if (!from) errors.from = 'statements.errorDateRequired';
  if (!to) errors.to = 'statements.errorDateRequired';

  if (from && to) {
    if (from > to) errors.from = 'statements.errorFromAfterTo';
    else if (monthsBetween(from, to) > MAX_RANGE_MONTHS) errors.to = 'statements.errorRangeTooLong';
  }
  if (to && to > endOfToday) errors.to = 'statements.errorFuture';

  return { valid: Object.keys(errors).length === 0, errors };
}

// Turns a preset into the concrete dates it stands for, so Review can show the
// range the RM is actually about to generate rather than just "Current Year".
export function resolvePeriodRange(period, statementType, today = new Date()) {
  if (periodModeFor(statementType) === 'asOf') {
    return { asOf: period.asOf || toIsoDate(today) };
  }
  if (period.preset === 'custom') return { from: period.from, to: period.to };

  const to = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let from;

  if (period.preset === 'currentYear') {
    from = new Date(today.getFullYear(), 0, 1);
  } else {
    const months = { lastMonth: 1, threeMonths: 3, sixMonths: 6 }[period.preset] ?? 1;
    from = monthsBefore(to, months);
  }

  return { from: toIsoDate(from), to: toIsoDate(to) };
}

// Steps back whole months, clamping to the last valid day of the target month.
// Without the clamp, 6 months before 29 Aug is 29 Feb — which in a non-leap
// year silently rolls forward to 1 Mar and quietly shortens the period.
function monthsBefore(date, months) {
  const target = new Date(date.getFullYear(), date.getMonth() - months, 1);
  const lastDayOfMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDayOfMonth));
  return target;
}

export function toIsoDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// --- transactions -------------------------------------------------------
// Which activity belongs in this statement. Account-level selections take the
// whole ledger for that account; product-level selections take only the rows
// that reference a selected product.

export function transactionsFor(scope, customer, range) {
  if (!customer) return [];
  const summary = selectionSummary(scope, customer);
  const accountNumbers = summary.accounts.map((a) => a.accountNumber);
  const productIds = summary.products.map((p) => p.id);
  const wholeAccounts = summary.fullAccounts.map((a) => a.accountNumber);

  return (customer.transactions || [])
    .filter((tx) => {
      if (!accountNumbers.includes(tx.accountNumber)) return false;
      if (wholeAccounts.includes(tx.accountNumber)) return true;
      return tx.productId && productIds.includes(tx.productId);
    })
    .filter((tx) => {
      if (!range?.from || !range?.to) return true;
      return tx.date >= range.from && tx.date <= range.to;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}








import {
  DETAIL_LEVELS,
  MAX_RANGE_MONTHS,
  SCOPE_MODES,
  TYPES,
  accountState,
  allowedStatementTypes,
  defaultStatementTypeFor,
  periodModeFor,
  resolvePeriodRange,
  selectionSummary,
  showsDetailLevel,
  transactionsFor,
  validatePeriod,
} from './statementRules';

// Two accounts: A has two products, B has one.
const customer = {
  id: 'CUST9001',
  accounts: [
    {
      accountNumber: 'ACC-A',
      nameKey: 'accounts.deposits',
      balance: 300,
      products: [
        { id: 'PA1', name: 'FD One', type: 'FD', value: 100, accountNumber: 'ACC-A' },
        { id: 'PA2', name: 'Bond Two', type: 'Bond', value: 200, accountNumber: 'ACC-A' },
      ],
    },
    {
      accountNumber: 'ACC-B',
      nameKey: 'accounts.investment',
      balance: 50,
      products: [{ id: 'PB1', name: 'Fund Three', type: 'Mutual Fund', value: 50, accountNumber: 'ACC-B' }],
    },
  ],
  transactions: [
    { id: 'T1', date: '2026-08-10', description: 'FD One interest', amount: 5, productId: 'PA1', accountNumber: 'ACC-A' },
    { id: 'T2', date: '2026-08-11', description: 'Bond Two buy', amount: -20, productId: 'PA2', accountNumber: 'ACC-A' },
    { id: 'T3', date: '2026-08-12', description: 'Fund Three buy', amount: -10, productId: 'PB1', accountNumber: 'ACC-B' },
  ],
};

const selection = (...productIds) => ({ mode: SCOPE_MODES.SELECTION, productIds });
const portfolio = { mode: SCOPE_MODES.PORTFOLIO, productIds: [] };

const enabledTypes = (scope) =>
  allowedStatementTypes(scope, customer)
    .filter((r) => r.enabled)
    .map((r) => r.type);

describe('accountState', () => {
  test('reports none / some / all', () => {
    expect(accountState(customer.accounts[0], [])).toBe('none');
    expect(accountState(customer.accounts[0], ['PA1'])).toBe('some');
    expect(accountState(customer.accounts[0], ['PA1', 'PA2'])).toBe('all');
  });
});

describe('selectionSummary', () => {
  test('counts a partial account as one account touched', () => {
    const s = selectionSummary(selection('PA1'), customer);
    expect(s.accountCount).toBe(1);
    expect(s.productCount).toBe(1);
    expect(s.partialAccounts).toHaveLength(1);
    expect(s.fullAccounts).toHaveLength(0);
    expect(s.total).toBe(100);
  });

  test('a fully selected account is a full account', () => {
    const s = selectionSummary(selection('PA1', 'PA2'), customer);
    expect(s.fullAccounts).toHaveLength(1);
    expect(s.partialAccounts).toHaveLength(0);
  });

  test('portfolio mode takes everything', () => {
    const s = selectionSummary(portfolio, customer);
    expect(s.isPortfolio).toBe(true);
    expect(s.accountCount).toBe(2);
    expect(s.productCount).toBe(3);
    expect(s.total).toBe(350);
  });

  test('empty selection is empty', () => {
    expect(selectionSummary(selection(), customer).isEmpty).toBe(true);
  });

  test('no customer is handled', () => {
    expect(selectionSummary(selection('PA1'), null).isEmpty).toBe(true);
  });
});

// The derivation matrix — one case per row.
describe('allowedStatementTypes', () => {
  test('entire portfolio -> Portfolio only', () => {
    expect(enabledTypes(portfolio)).toEqual([TYPES.PORTFOLIO]);
  });

  test('one account fully selected -> Account + Transaction', () => {
    expect(enabledTypes(selection('PA1', 'PA2'))).toEqual([TYPES.ACCOUNT, TYPES.TRANSACTION]);
  });

  test('products only within one account -> Account + Transaction', () => {
    expect(enabledTypes(selection('PA1'))).toEqual([TYPES.ACCOUNT, TYPES.TRANSACTION]);
  });

  test('two accounts -> Consolidated + Transaction, and NOT Account', () => {
    const types = enabledTypes(selection('PA1', 'PA2', 'PB1'));
    expect(types).toEqual([TYPES.TRANSACTION, TYPES.CONSOLIDATED]);
    expect(types).not.toContain(TYPES.ACCOUNT);
  });

  test('mixed — one full account plus a loose product elsewhere — is still two accounts', () => {
    expect(enabledTypes(selection('PA1', 'PA2', 'PB1'))).toContain(TYPES.CONSOLIDATED);
  });

  test('nothing selected -> nothing enabled', () => {
    expect(enabledTypes(selection())).toEqual([]);
  });

  test('disabled options carry a reason', () => {
    const consolidated = allowedStatementTypes(selection('PA1'), customer).find(
      (r) => r.type === TYPES.CONSOLIDATED
    );
    expect(consolidated.enabled).toBe(false);
    expect(consolidated.reasonKey).toBe('statements.reasonNeedsTwoAccounts');
  });
});

describe('defaultStatementTypeFor', () => {
  test('picks a sensible default per shape', () => {
    expect(defaultStatementTypeFor(portfolio, customer)).toBe(TYPES.PORTFOLIO);
    expect(defaultStatementTypeFor(selection('PA1'), customer)).toBe(TYPES.ACCOUNT);
    expect(defaultStatementTypeFor(selection('PA1', 'PB1'), customer)).toBe(TYPES.CONSOLIDATED);
    expect(defaultStatementTypeFor(selection(), customer)).toBeNull();
  });

  test('every default is itself an allowed type', () => {
    [portfolio, selection('PA1'), selection('PA1', 'PA2'), selection('PA1', 'PB1')].forEach((scope) => {
      expect(enabledTypes(scope)).toContain(defaultStatementTypeFor(scope, customer));
    });
  });
});

describe('showsDetailLevel', () => {
  test('only for an Account Statement over part of one account', () => {
    expect(showsDetailLevel(selection('PA1'), customer, TYPES.ACCOUNT)).toBe(true);
    expect(showsDetailLevel(selection('PA1', 'PA2'), customer, TYPES.ACCOUNT)).toBe(false);
    expect(showsDetailLevel(selection('PA1'), customer, TYPES.TRANSACTION)).toBe(false);
    expect(showsDetailLevel(portfolio, customer, TYPES.PORTFOLIO)).toBe(false);
  });
});

describe('periodModeFor', () => {
  test('a portfolio statement is a snapshot, everything else is a range', () => {
    expect(periodModeFor(TYPES.PORTFOLIO)).toBe('asOf');
    expect(periodModeFor(TYPES.ACCOUNT)).toBe('range');
    expect(periodModeFor(TYPES.TRANSACTION)).toBe('range');
    expect(periodModeFor(TYPES.CONSOLIDATED)).toBe('range');
  });
});

describe('validatePeriod', () => {
  const today = new Date(2026, 7, 29); // 29 Aug 2026
  const range = (from, to) => ({ preset: 'custom', from, to });

  test('presets are always valid', () => {
    expect(validatePeriod({ preset: 'lastMonth' }, TYPES.ACCOUNT, today).valid).toBe(true);
    expect(validatePeriod({ preset: 'currentYear' }, TYPES.ACCOUNT, today).valid).toBe(true);
  });

  test('custom range needs both dates', () => {
    expect(validatePeriod(range('', ''), TYPES.ACCOUNT, today).errors.from).toBe(
      'statements.errorDateRequired'
    );
  });

  test('rejects From after To', () => {
    expect(validatePeriod(range('2026-06-01', '2026-05-01'), TYPES.ACCOUNT, today).errors.from).toBe(
      'statements.errorFromAfterTo'
    );
  });

  test('rejects a future To', () => {
    expect(validatePeriod(range('2026-01-01', '2027-01-01'), TYPES.ACCOUNT, today).errors.to).toBe(
      'statements.errorFuture'
    );
  });

  test(`rejects a range longer than ${MAX_RANGE_MONTHS} months`, () => {
    expect(validatePeriod(range('2023-01-01', '2026-01-01'), TYPES.ACCOUNT, today).errors.to).toBe(
      'statements.errorRangeTooLong'
    );
  });

  test('accepts a valid range', () => {
    expect(validatePeriod(range('2026-01-01', '2026-06-01'), TYPES.ACCOUNT, today).valid).toBe(true);
  });

  test('portfolio validates asOf, not the range', () => {
    expect(validatePeriod({ asOf: '' }, TYPES.PORTFOLIO, today).errors.asOf).toBe(
      'statements.errorDateRequired'
    );
    expect(validatePeriod({ asOf: '2027-01-01' }, TYPES.PORTFOLIO, today).errors.asOf).toBe(
      'statements.errorFuture'
    );
    expect(validatePeriod({ asOf: '2026-08-01' }, TYPES.PORTFOLIO, today).valid).toBe(true);
  });
});

describe('resolvePeriodRange', () => {
  const today = new Date(2026, 7, 29);

  test('currentYear runs from 1 January', () => {
    expect(resolvePeriodRange({ preset: 'currentYear' }, TYPES.ACCOUNT, today)).toEqual({
      from: '2026-01-01',
      to: '2026-08-29',
    });
  });

  test('sixMonths counts back six months', () => {
    expect(resolvePeriodRange({ preset: 'sixMonths' }, TYPES.ACCOUNT, today).from).toBe('2026-02-28');
  });

  test('custom passes the dates through', () => {
    expect(
      resolvePeriodRange({ preset: 'custom', from: '2026-03-01', to: '2026-04-01' }, TYPES.ACCOUNT, today)
    ).toEqual({ from: '2026-03-01', to: '2026-04-01' });
  });

  test('portfolio returns an asOf date', () => {
    expect(resolvePeriodRange({ asOf: '2026-08-01' }, TYPES.PORTFOLIO, today)).toEqual({
      asOf: '2026-08-01',
    });
  });
});

describe('transactionsFor', () => {
  const wide = { from: '2020-01-01', to: '2030-01-01' };

  test('a whole account takes its entire ledger', () => {
    const ids = transactionsFor(selection('PA1', 'PA2'), customer, wide).map((tx) => tx.id);
    expect(ids.sort()).toEqual(['T1', 'T2']);
  });

  test('a product-level selection takes only that product activity', () => {
    expect(transactionsFor(selection('PA1'), customer, wide).map((tx) => tx.id)).toEqual(['T1']);
  });

  test('activity outside the range is excluded', () => {
    expect(
      transactionsFor(selection('PA1'), customer, { from: '2026-08-11', to: '2026-08-12' })
    ).toHaveLength(0);
  });

  test('portfolio mode takes every account', () => {
    expect(transactionsFor(portfolio, customer, wide)).toHaveLength(3);
  });

  test('newest first', () => {
    const dates = transactionsFor(portfolio, customer, wide).map((tx) => tx.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });
});

describe('detail levels', () => {
  test('are the two the brief asks for', () => {
    expect(Object.values(DETAIL_LEVELS)).toEqual(['productDetails', 'holdingsSummary']);
  });
});




