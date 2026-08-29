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





#HIII


import { useMemo, useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import PaginationBar from '../../../components/ui/PaginationBar';
import usePagination from '../../../components/ui/usePagination';
import { formatAmount } from '../../../utils/formatCurrency';

// Step 1 — pick the customer, then show what they hold so the RM can confirm
// they have the right person before committing to a scope.
export default function StepCustomer({ customers, customerId, customer, onSelect }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return customers.filter(
      (c) => !term || c.name.toLowerCase().includes(term) || c.id.toLowerCase().includes(term)
    );
  }, [customers, query]);

  const pagination = usePagination(visible.length, 4);
  const rows = pagination.slice(visible);

  const productCount = customer ? customer.accounts.reduce((n, a) => n + a.products.length, 0) : 0;

  return (
    <>
      <h3 className="wizard__title">{t('statements.selectCustomer')}</h3>

      <input
        type="search"
        className="wizard__search"
        placeholder={t('statements.searchPlaceholder')}
        aria-label={t('statements.searchPlaceholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="ui-table__wrapper ui-table__wrapper--flush">
        <table className="ui-table">
          <thead>
            <tr>
              <th>{t('statements.select')}</th>
              <th>{t('customers.customerId')}</th>
              <th>{t('customers.customerName')}</th>
              <th>{t('statements.type')}</th>
              <th style={{ textAlign: 'right' }}>{t('customers.portfolioValue')}</th>
              <th>{t('customers.riskProfile')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="ui-table__row--clickable" onClick={() => onSelect(row.id)}>
                <td>
                  <input
                    type="radio"
                    name="customerId"
                    value={row.id}
                    checked={customerId === row.id}
                    onChange={() => onSelect(row.id)}
                    aria-label={row.name}
                  />
                </td>
                <td>{row.id}</td>
                <td>{row.name}</td>
                <td>{row.tier}</td>
                <td style={{ textAlign: 'right' }}>{formatAmount(row.portfolioValue)}</td>
                <td>{row.risk}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && <p className="ui-table__empty">{t('common.noResults')}</p>}
      </div>

      <PaginationBar pagination={pagination} noun={t('statements.customersLower')} />

      {customer && (
        <section className="customer-preview">
          <header>
            <strong>
              {customer.name} ({customer.id})
            </strong>
            <span>
              {customer.accounts.length} {t('statements.accountsLower')} · {productCount}{' '}
              {t('statements.productsLower')} · {formatAmount(customer.portfolioValue)}
            </span>
          </header>

          {customer.accounts.length ? (
            <ul>
              {customer.accounts.map((account) => (
                <li key={account.accountNumber}>
                  <code>{account.accountNumber}</code>
                  <span>{t(account.nameKey)}</span>
                  <span className="customer-preview__value">{formatAmount(account.balance)}</span>
                  <small>
                    {account.products.length} {t('statements.productsLower')}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ui-table__empty">{t('statements.emptyAccounts')}</p>
          )}
        </section>
      )}
    </>
  );
}




import { useLanguage } from '../../../context/LanguageContext';
import Loader from '../../../components/common/Loader';
import StatementPreview from '../StatementPreview';

// Step 5 — the generated document.
export default function StepGenerate({ state, customer, summary, transactions, range }) {
  const { t } = useLanguage();

  if (state.generating) return <Loader label={t('statements.generating')} />;

  return (
    <>
      {state.message && <p className="wizard__success">{state.message}</p>}
      <StatementPreview
        customer={customer}
        products={summary.products}
        transactions={transactions}
        statement={state.result}
        statementType={state.statementType}
        detailLevel={state.detailLevel}
        range={range}
        language={state.language}
      />
    </>
  );
}



import { useLanguage } from '../../../context/LanguageContext';
import Input from '../../../components/common/Input';
import { statementLanguages, statementPeriods } from '../../../services/mockData';
import { periodModeFor, validatePeriod } from '../statementRules';

// Step 3 — period and language. Statement type has moved to step 2, and what
// is left is type-aware: a Portfolio Statement is a point-in-time snapshot, so
// it asks for a single date rather than a range.
export default function StepPeriod({ statementType, period, language, dispatch }) {
  const { t } = useLanguage();

  const mode = periodModeFor(statementType);
  const { errors } = validatePeriod(period, statementType);

  return (
    <div className="wizard__columns">
        <fieldset className="panel">
          <legend>{t('statements.period')}</legend>

          {mode === 'asOf' ? (
            <>
              <p className="panel__note">{t('statements.asOfHint')}</p>
              <Input
                id="asOf"
                type="date"
                label={t('statements.asOfDate')}
                value={period.asOf}
                error={errors.asOf ? t(errors.asOf) : ''}
                onChange={(e) => dispatch({ type: 'SET_PERIOD', patch: { asOf: e.target.value } })}
              />
            </>
          ) : (
            <>
              {statementPeriods.map((preset) => (
                <label key={preset.id} className="option option--inline">
                  <input
                    type="radio"
                    name="period"
                    value={preset.id}
                    checked={period.preset === preset.id}
                    onChange={() =>
                      dispatch({ type: 'SET_PERIOD', patch: { preset: preset.id } })
                    }
                  />
                  <span className="option__body">{t(preset.labelKey)}</span>
                </label>
              ))}

              {period.preset === 'custom' && (
                <div className="wizard__grid wizard__grid--dates">
                  <Input
                    id="from"
                    type="date"
                    label={t('statements.from')}
                    value={period.from}
                    error={errors.from ? t(errors.from) : ''}
                    onChange={(e) =>
                      dispatch({ type: 'SET_PERIOD', patch: { from: e.target.value } })
                    }
                  />
                  <Input
                    id="to"
                    type="date"
                    label={t('statements.to')}
                    value={period.to}
                    error={errors.to ? t(errors.to) : ''}
                    onChange={(e) => dispatch({ type: 'SET_PERIOD', patch: { to: e.target.value } })}
                  />
                </div>
              )}
            </>
          )}
        </fieldset>

        <fieldset className="panel">
          <legend>{t('statements.outputLanguage')}</legend>

          <div className="lang-cards">
            {statementLanguages.map((option) => (
              <label
                key={option.code}
                className={`lang-card ${language === option.code ? 'lang-card--on' : ''}`.trim()}
              >
                <input
                  type="radio"
                  name="language"
                  value={option.code}
                  checked={language === option.code}
                  onChange={() => dispatch({ type: 'SET_LANGUAGE', language: option.code })}
                />
                <span>{t(option.labelKey)}</span>
              </label>
            ))}
          </div>
      </fieldset>
    </div>
  );
}




import { useLanguage } from '../../../context/LanguageContext';
import PaginationBar from '../../../components/ui/PaginationBar';
import usePagination from '../../../components/ui/usePagination';
import { statementLanguages, statementPeriods, statementTypes } from '../../../services/mockData';
import { formatAmount, formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import {
  SCOPE_MODES,
  periodModeFor,
  resolvePeriodRange,
  selectionSummary,
  showsDetailLevel,
} from '../statementRules';
import { STEPS } from '../statementReducer';

// Step 4 — read-only, and it must reflect the branch actually taken, including
// the detail level. Every row carries an Edit link back to its owning step.
export default function StepReview({ state, customer, dispatch }) {
  const { t, language: uiLanguage } = useLanguage();

  const summary = selectionSummary(state.scope, customer);
  const range = resolvePeriodRange(state.period, state.statementType);
  const pagination = usePagination(summary.products.length, 25);
  const rows = pagination.slice(summary.products);

  const typeLabel = t(statementTypes.find((s) => s.id === state.statementType)?.labelKey || '');
  const detailLabel = showsDetailLevel(state.scope, customer, state.statementType)
    ? ` — ${t(`statements.detail_${state.detailLevel}`)}`
    : '';

  const preset = statementPeriods.find((p) => p.id === state.period.preset);
  const periodLabel =
    periodModeFor(state.statementType) === 'asOf'
      ? `${t('statements.asOfDate')}: ${formatDate(range.asOf, uiLanguage)}`
      : `${t(preset?.labelKey || '')} (${formatDate(range.from, uiLanguage)} – ${formatDate(range.to, uiLanguage)})`;

  const scopeLabel =
    state.scope.mode === SCOPE_MODES.PORTFOLIO
      ? t('statements.entirePortfolio')
      : t('statements.scopeSummary')
          .replace('{products}', summary.productCount)
          .replace('{accounts}', summary.accountCount);

  const rowsFor = [
    { key: 'customer', label: t('customers.customerName'), value: `${customer?.name} (${customer?.id})`, step: STEPS.CUSTOMER },
    { key: 'scope', label: t('statements.scopeTitle'), value: scopeLabel, step: STEPS.SCOPE },
    { key: 'type', label: t('statements.statementType'), value: `${typeLabel}${detailLabel}`, step: STEPS.SCOPE },
    { key: 'period', label: t('statements.period'), value: periodLabel, step: STEPS.PERIOD },
    {
      key: 'language',
      label: t('statements.outputLanguage'),
      value: t(statementLanguages.find((l) => l.code === state.language)?.labelKey || ''),
      step: STEPS.PERIOD,
    },
  ];

  return (
    <>
      <h3 className="wizard__title">{t('statements.reviewTitle')}</h3>

      <dl className="review-list">
        {rowsFor.map((row) => (
          <div key={row.key}>
            <dt>{row.label}</dt>
            <dd>
              {row.value}
              <button
                type="button"
                className="review-list__edit"
                onClick={() => dispatch({ type: 'GO_TO_STEP', step: row.step })}
              >
                {t('common.edit')}
              </button>
            </dd>
          </div>
        ))}
      </dl>

      <h4 className="wizard__subtitle">{t('statements.includedItems')}</h4>

      <div className="ui-table__wrapper ui-table__wrapper--flush">
        <table className="ui-table">
          <thead>
            <tr>
              <th>{t('statements.accountProduct')}</th>
              <th>{t('statements.accountNumber')}</th>
              <th style={{ textAlign: 'right' }}>{t('statements.amount')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td className="grouped-table__num">{product.accountNumber}</td>
                <td style={{ textAlign: 'right' }}>{formatAmount(product.value)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>{t('statements.total')}</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(summary.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <PaginationBar pagination={pagination} noun={t('statements.itemsLower')} />
    </>
  );
}




import { useLanguage } from '../../../context/LanguageContext';
import GroupedSelectTable from '../../../components/ui/GroupedSelectTable';
import { statementTypes } from '../../../services/mockData';
import {
  DETAIL_LEVELS,
  SCOPE_MODES,
  accountState,
  allowedStatementTypes,
  selectionSummary,
  showsDetailLevel,
} from '../statementRules';

// Step 2 — scope AND statement type, decided together.
//
// This is the pivot of the redesign: the type used to live in step 3, with no
// relationship to the selection. Here the selection drives which types are
// offered, so an impossible combination is unreachable rather than merely wrong.
export default function StepScope({ customer, scope, statementType, detailLevel, dispatch }) {
  const { t } = useLanguage();

  const summary = selectionSummary(scope, customer);
  const options = allowedStatementTypes(scope, customer);
  const isPortfolio = scope.mode === SCOPE_MODES.PORTFOLIO;
  const showDetail = showsDetailLevel(scope, customer, statementType);

  const labelFor = (typeId) => t(statementTypes.find((s) => s.id === typeId).labelKey);

  return (
    <>
      <h3 className="wizard__title">{t('statements.scopeTitle')}</h3>
      <p className="wizard__hint">{t('statements.scopeHint')}</p>

      {/* Panel A — what to include */}
      <fieldset className="panel">
        <legend>{t('statements.include')}</legend>

        <label className="option option--inline">
          <input
            type="radio"
            name="scopeMode"
            checked={isPortfolio}
            onChange={() =>
              dispatch({ type: 'SET_SCOPE_MODE', mode: SCOPE_MODES.PORTFOLIO, customer })
            }
          />
          <span className="option__body">
            {t('statements.entirePortfolio')}
            <small>{t('statements.entirePortfolioHint')}</small>
          </span>
        </label>

        <label className="option option--inline">
          <input
            type="radio"
            name="scopeMode"
            checked={!isPortfolio}
            onChange={() =>
              dispatch({ type: 'SET_SCOPE_MODE', mode: SCOPE_MODES.SELECTION, customer })
            }
          />
          <span className="option__body">
            {t('statements.selectedAccounts')}
            <small>{t('statements.selectedAccountsHint')}</small>
          </span>
        </label>
      </fieldset>

      {!isPortfolio && (
        <GroupedSelectTable
          accounts={customer?.accounts || []}
          productIds={scope.productIds}
          accountStateOf={(account) => accountState(account, scope.productIds)}
          onToggleAccount={(account) => dispatch({ type: 'TOGGLE_ACCOUNT', account, customer })}
          onToggleProduct={(product) =>
            dispatch({ type: 'TOGGLE_PRODUCT', productId: product.id, customer })
          }
          emptyMessage={t('statements.emptyAccounts')}
        />
      )}

      {/* Panel B — the types this selection permits */}
      {(isPortfolio || !summary.isEmpty) && (
        <fieldset className="panel">
          <legend>{t('statements.statementType')}</legend>
          <p className="panel__note">
            {t('statements.scopeSummary')
              .replace('{products}', summary.productCount)
              .replace('{accounts}', summary.accountCount)}
          </p>

          {options.map(({ type, enabled, reasonKey }) => (
            <label key={type} className={`option ${enabled ? '' : 'option--disabled'}`.trim()}>
              <input
                type="radio"
                name="statementType"
                value={type}
                checked={statementType === type}
                disabled={!enabled}
                onChange={() => dispatch({ type: 'SET_TYPE', statementType: type })}
              />
              <span className="option__body">
                {labelFor(type)}
                <small>{enabled ? t(`statements.hint_${type}`) : t(reasonKey)}</small>
              </span>
            </label>
          ))}
        </fieldset>
      )}

      {/* Panel C — only meaningful for part of a single account */}
      {showDetail && (
        <fieldset className="panel">
          <legend>{t('statements.detailLevel')}</legend>

          {[DETAIL_LEVELS.PRODUCT_DETAILS, DETAIL_LEVELS.HOLDINGS_SUMMARY].map((level) => (
            <label key={level} className="option">
              <input
                type="radio"
                name="detailLevel"
                value={level}
                checked={detailLevel === level}
                onChange={() => dispatch({ type: 'SET_DETAIL_LEVEL', detailLevel: level })}
              />
              <span className="option__body">
                {t(`statements.detail_${level}`)}
                <small>{t(`statements.detailHint_${level}`)}</small>
              </span>
            </label>
          ))}
        </fieldset>
      )}
    </>
  );
}



import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import PageHero from '../../components/ui/PageHero';
import Stepper from '../../components/ui/Stepper';
import StepCustomer from './steps/StepCustomer';
import StepScope from './steps/StepScope';
import StepPeriod from './steps/StepPeriod';
import StepReview from './steps/StepReview';
import StepGenerate from './steps/StepGenerate';
import { STEPS, initialState, statementReducer } from './statementReducer';
import {
  resolvePeriodRange,
  selectionSummary,
  transactionsFor,
  validatePeriod,
} from './statementRules';
import './statement.css';

// Owner: Sumit — US02 + US04.
// Five steps: Customer → Scope & Type → Period & Language → Review → Generate.
//
// This file is deliberately thin: state lives in statementReducer, every
// branching rule lives in statementRules, and each step renders itself. Adding
// or reordering a step is a change to STEP_CONFIG alone.
const STEP_CONFIG = [
  { id: 'customer', labelKey: 'statements.stepCustomer', subtitleKey: 'statements.subtitle' },
  { id: 'scope', labelKey: 'statements.stepProduct', subtitleKey: 'statements.scopeHint' },
  { id: 'period', labelKey: 'statements.stepTypePeriod', subtitleKey: 'statements.periodHint' },
  { id: 'review', labelKey: 'statements.stepReview', subtitleKey: 'statements.reviewHint' },
  { id: 'generate', labelKey: 'statements.stepGenerate', subtitleKey: 'statements.readySubtitle' },
];

export default function StatementPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [state, dispatch] = useReducer(statementReducer, initialState);

  useEffect(() => {
    let cancelled = false;
    api
      .getCustomers()
      .then((data) => {
        if (cancelled) return;
        setCustomers(data);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const customer = useMemo(
    () => customers.find((c) => c.id === state.customerId) || null,
    [customers, state.customerId]
  );

  // Deep link — arriving from a customer row pre-fills step 1 and opens step 2
  // rather than making the RM find the customer they just had open. Applied
  // once only, so "Generate another" starts genuinely blank.
  const deepLinkId = location.state?.customerId;
  const deepLinkApplied = useRef(false);
  useEffect(() => {
    if (!deepLinkId || !customers.length || deepLinkApplied.current) return;
    deepLinkApplied.current = true;
    dispatch({ type: 'SELECT_CUSTOMER', customerId: deepLinkId });
    dispatch({ type: 'GO_TO_STEP', step: STEPS.SCOPE });
  }, [deepLinkId, customers.length]);

  const summary = useMemo(
    () => selectionSummary(state.scope, customer),
    [state.scope, customer]
  );

  const range = useMemo(
    () => resolvePeriodRange(state.period, state.statementType),
    [state.period, state.statementType]
  );

  const transactions = useMemo(
    () => transactionsFor(state.scope, customer, range),
    [state.scope, customer, range]
  );

  // One gate per step, read straight off the rules module.
  const canAdvance = useMemo(() => {
    switch (state.step) {
      case STEPS.CUSTOMER:
        return Boolean(state.customerId);
      case STEPS.SCOPE:
        return !summary.isEmpty && Boolean(state.statementType);
      case STEPS.PERIOD:
        return validatePeriod(state.period, state.statementType).valid;
      case STEPS.REVIEW:
        return !state.generating;
      default:
        return false;
    }
  }, [state, summary]);

  const generate = useCallback(async () => {
    dispatch({ type: 'GENERATE_START' });
    try {
      const result = await api.generateStatement({
        customerId: state.customerId,
        scopeMode: state.scope.mode,
        productIds: summary.products.map((p) => p.id),
        accountNumbers: summary.accounts.map((a) => a.accountNumber),
        statementType: state.statementType,
        detailLevel: state.detailLevel,
        period: state.period,
        range,
        language: state.language,
      });
      dispatch({ type: 'GENERATE_SUCCESS', result, message: t('statements.generated') });
    } catch (err) {
      dispatch({ type: 'GENERATE_FAILURE', error: t('statements.generateFailed') });
    }
  }, [state, summary, range, t]);

  const onEmail = async () => {
    try {
      await api.emailDocument({ type: 'statement', customerId: state.customerId });
      dispatch({ type: 'SET_MESSAGE', message: t('statements.emailed') });
    } catch (err) {
      dispatch({ type: 'GENERATE_FAILURE', error: t('statements.emailFailed') });
    }
  };

  const hasWork = Boolean(state.customerId) || state.scope.productIds.length > 0;

  const onCancel = () => {
    if (hasWork) setConfirmCancel(true);
    else navigate('/');
  };

  if (loading) return <Loader label={t('common.loading')} />;

  const goTo = (step) => dispatch({ type: 'GO_TO_STEP', step });

  return (
    <div className="statement-page">
      <PageHero title={t('statements.title')} subtitle={t(STEP_CONFIG[state.step].subtitleKey)} />

      <Stepper
        steps={STEP_CONFIG.map((s) => t(s.labelKey))}
        current={state.step}
        onStepClick={goTo}
      />

      <section className="wizard">
        {state.error && (
          <p className="wizard__error" role="alert">
            {state.error}
          </p>
        )}

        {state.step === STEPS.CUSTOMER && (
          <StepCustomer
            customers={customers}
            customerId={state.customerId}
            customer={customer}
            onSelect={(customerId) => dispatch({ type: 'SELECT_CUSTOMER', customerId })}
          />
        )}

        {state.step === STEPS.SCOPE && (
          <StepScope
            customer={customer}
            scope={state.scope}
            statementType={state.statementType}
            detailLevel={state.detailLevel}
            dispatch={dispatch}
          />
        )}

        {state.step === STEPS.PERIOD && (
          <StepPeriod
            statementType={state.statementType}
            period={state.period}
            language={state.language}
            dispatch={dispatch}
          />
        )}

        {state.step === STEPS.REVIEW && (
          <StepReview state={state} customer={customer} dispatch={dispatch} />
        )}

        {state.step === STEPS.GENERATE && (
          <StepGenerate
            state={state}
            customer={customer}
            summary={summary}
            transactions={transactions}
            range={range}
          />
        )}

        <div className="wizard__footer">
          {state.step > STEPS.CUSTOMER && state.step < STEPS.GENERATE && (
            <Button variant="secondary" onClick={() => goTo(state.step - 1)}>
              {t('common.back')}
            </Button>
          )}

          <span className="wizard__footer-gap" />

          {state.step < STEPS.GENERATE && (
            <Button variant="ghost" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          )}

          {state.step < STEPS.REVIEW && (
            <Button onClick={() => goTo(state.step + 1)} disabled={!canAdvance}>
              {t('common.next')}
            </Button>
          )}

          {state.step === STEPS.REVIEW && (
            <Button onClick={generate} disabled={!canAdvance}>
              {t('common.generate')}
            </Button>
          )}

          {state.step === STEPS.GENERATE && (
            <>
              <Button variant="secondary" onClick={() => dispatch({ type: 'RESET' })}>
                {t('statements.generateAnother')}
              </Button>
              <Button onClick={onEmail}>{t('common.sendEmail')}</Button>
            </>
          )}
        </div>
      </section>

      <Modal
        open={confirmCancel}
        title={t('statements.cancelTitle')}
        onClose={() => setConfirmCancel(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmCancel(false)}>
              {t('statements.cancelKeep')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmCancel(false);
                dispatch({ type: 'RESET' });
                navigate('/');
              }}
            >
              {t('statements.cancelDiscard')}
            </Button>
          </>
        }
      >
        <p>{t('statements.cancelBody')}</p>
      </Modal>
    </div>
  );
}






import { useLanguage } from '../../context/LanguageContext';
import ScLogo from '../../components/ui/ScLogo';
import { formatAmount, formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { DETAIL_LEVELS, TYPES } from './statementRules';

// Owner: Sumit — on-screen approximation of the Standard Chartered Global
// Private Bank statement from the brief.
//
// The document's own language comes from `language` (US04), independent of the
// dashboard language (US05). The document BODY now varies by statement type —
// previously every type rendered the same holdings table.

const COPY = {
  en: {
    accountStatement: 'Statement of Accounts',
    transactionStatement: 'Transaction Statement',
    portfolioStatement: 'Portfolio Statement',
    consolidatedWealthStatement: 'Consolidated Wealth Statement',
    intro:
      'Please find enclosed the latest statement for your Standard Chartered Global Private Bank account(s). Should you wish to have a more detailed discussion on your portfolio, please do not hesitate to contact your Private Banker.',
    product: 'Product',
    category: 'Category',
    value: 'Value',
    account: 'Account',
    date: 'Date',
    description: 'Description',
    amount: 'Amount',
    total: 'Total',
    subtotal: 'Subtotal',
    holdings: 'Holdings',
    activity: 'Activity',
    noActivity: 'No activity in this period.',
    period: 'Period',
    asOf: 'As at',
    sign: 'Standard Chartered Global Private Bank',
  },
  'zh-CN': {
    accountStatement: '账户对账单',
    transactionStatement: '交易对账单',
    portfolioStatement: '投资组合对账单',
    consolidatedWealthStatement: '综合财富对账单',
    intro:
      '兹附上您渣打环球私人银行账户的最新对账单。如需详细讨论您的投资组合，请联系您的私人银行家。',
    product: '产品',
    category: '类别',
    value: '价值',
    account: '账户',
    date: '日期',
    description: '摘要',
    amount: '金额',
    total: '合计',
    subtotal: '小计',
    holdings: '持仓',
    activity: '交易明细',
    noActivity: '本期无交易记录。',
    period: '周期',
    asOf: '截至',
    sign: '渣打环球私人银行',
  },
};

function HoldingsTable({ products, copy }) {
  const total = products.reduce((sum, p) => sum + p.value, 0);

  return (
    <table className="statement-doc__table">
      <thead>
        <tr>
          <th>{copy.product}</th>
          <th>{copy.category}</th>
          <th>{copy.account}</th>
          <th style={{ textAlign: 'right' }}>{copy.value}</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr key={product.id}>
            <td>{product.name}</td>
            <td>{product.type}</td>
            <td>{product.accountNumber}</td>
            <td style={{ textAlign: 'right' }}>{formatAmount(product.value)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={3}>{copy.total}</td>
          <td style={{ textAlign: 'right' }}>{formatCurrency(total)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

function TransactionTable({ transactions, copy, docLanguage }) {
  if (!transactions.length) return <p>{copy.noActivity}</p>;

  return (
    <table className="statement-doc__table">
      <thead>
        <tr>
          <th>{copy.date}</th>
          <th>{copy.description}</th>
          <th style={{ textAlign: 'right' }}>{copy.amount}</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((tx) => (
          <tr key={tx.id}>
            <td>{formatDate(tx.date, docLanguage)}</td>
            <td>{tx.description}</td>
            <td style={{ textAlign: 'right' }}>{formatAmount(tx.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function StatementPreview({
  customer,
  products = [],
  transactions = [],
  statement,
  statementType = TYPES.ACCOUNT,
  detailLevel = DETAIL_LEVELS.PRODUCT_DETAILS,
  range = {},
  language = 'en',
}) {
  const { t } = useLanguage();
  const docLanguage = language === 'zh-CN' ? 'zh-CN' : 'en';
  const copy = COPY[docLanguage];
  const isChinese = docLanguage === 'zh-CN';

  if (!customer) return <p className="ui-table__empty">{t('common.noResults')}</p>;

  // Group the included products under their account — used by the per-account
  // layouts (consolidated, and product-details).
  const byAccount = products.reduce((groups, product) => {
    const key = product.accountNumber;
    (groups[key] = groups[key] || []).push(product);
    return groups;
  }, {});

  const periodLine = range.asOf
    ? `${copy.asOf} ${formatDate(range.asOf, docLanguage)}`
    : range.from && range.to
      ? `${copy.period}: ${formatDate(range.from, docLanguage)} – ${formatDate(range.to, docLanguage)}`
      : '';

  return (
    <article className="statement-doc" lang={docLanguage}>
      <header className="statement-doc__head">
        <div className="statement-doc__brand">
          <ScLogo size={34} />
          <span>
            standard chartered
            <small>global private bank</small>
          </span>
        </div>
        <address className="statement-doc__bank">
          Standard Chartered Bank (Singapore) Limited
          <br />
          Marina Bay Financial Centre (Tower 1)
          <br />
          8 Marina Boulevard, Level 27
        </address>
      </header>

      <p className="statement-doc__meta">
        {formatDate(new Date(), docLanguage)}
        {statement?.documentId && <span> · {statement.documentId}</span>}
      </p>

      <p className="statement-doc__to">
        {isChinese && customer.nameZh ? customer.nameZh : customer.name}
        <br />
        {customer.id}
        <br />
        {customer.email}
      </p>

      <h4>{copy[statementType] || copy.accountStatement}</h4>
      {periodLine && <p className="statement-doc__period">{periodLine}</p>}

      <p>{copy.intro}</p>

      {/* Transaction statement — the ledger, not the holdings. */}
      {statementType === TYPES.TRANSACTION && (
        <TransactionTable transactions={transactions} copy={copy} docLanguage={docLanguage} />
      )}

      {/* Consolidated wealth — one section per account, then a grand total. */}
      {statementType === TYPES.CONSOLIDATED && (
        <>
          {Object.entries(byAccount).map(([accountNumber, items]) => (
            <section key={accountNumber}>
              <h5>
                {copy.account} {accountNumber}
              </h5>
              <HoldingsTable products={items} copy={{ ...copy, total: copy.subtotal }} />
            </section>
          ))}
          <p className="statement-doc__grand">
            {copy.total}: {formatCurrency(products.reduce((sum, p) => sum + p.value, 0))}
          </p>
        </>
      )}

      {/* Account statement with per-product detail — holdings plus that
          product's own activity, one section each. */}
      {statementType === TYPES.ACCOUNT && detailLevel === DETAIL_LEVELS.PRODUCT_DETAILS && (
        <>
          {products.map((product) => (
            <section key={product.id}>
              <h5>
                {product.name} · {product.accountNumber}
              </h5>
              <HoldingsTable products={[product]} copy={copy} />
              <p className="statement-doc__label">{copy.activity}</p>
              <TransactionTable
                transactions={transactions.filter((tx) => tx.productId === product.id)}
                copy={copy}
                docLanguage={docLanguage}
              />
            </section>
          ))}
        </>
      )}

      {/* Holdings summary, and the portfolio snapshot — one combined table. */}
      {(statementType === TYPES.PORTFOLIO ||
        (statementType === TYPES.ACCOUNT && detailLevel === DETAIL_LEVELS.HOLDINGS_SUMMARY)) && (
        <HoldingsTable products={products} copy={copy} />
      )}

      <p className="statement-doc__sign">{copy.sign}</p>
    </article>
  );
}
