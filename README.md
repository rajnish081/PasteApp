Looking at your screenshots, the highest-leverage thing here is that your Statement page already solved preview + download. So the prompt below tells Copilot to extract and reuse that, not rebuild it — that's what guarantees the CSS matches instead of drifting.

I've also folded in Akshada's five focus calculations, the Current Value vs Investments semantics, and the Save-as-Draft bug.


# Task: Complete the Advice page — focus-driven content, document preview, download

## Read these first, before writing anything

1. The **Statements** feature (`localhost:3000/statements`). Its Review step renders a
   full Standard Chartered document preview, and its Generate step offers Download and
   Send email. **That preview and download already work. Do not reinvent them.**
2. The existing Advice feature (`localhost:3000/advice`) — Details → Review → Dispatch.
3. The backend `bank_data` source and its product records.
4. The SC logo at `frontend/src/assets/images/` — use the existing asset, do not add one.

## Architectural instruction — do this first

Extract the Statement page's document preview into a **shared, reusable component**, then
render the Advice document through it. Something like:

```
components/documents/DocumentPreview.jsx     frame: SC logo, letterhead, meta block, footer
components/documents/DocumentPreview.css     one stylesheet, both document types
components/documents/documentTheme.js        fonts, spacing, table styles, colours
```

The Statement page must keep working **unchanged** after this refactor.

Doing it this way is the point: it is what makes the Advice document look identical to the
Statement document, and it means the Download behaviour is shared rather than reimplemented
and subtly different. Do not copy-paste the statement's markup into the Advice page — if
the two diverge later, one will silently stop matching the other.

## Bug to fix

**"Save as Draft" currently triggers preview generation.** It must not. Separate them:

- **Save as Draft** → persist the current form state only. No document generation, no
  preview refresh, no navigation. Show a quiet "Draft saved" confirmation and stay put.
  It must work from Review *and* Dispatch, and with fields still incomplete — a draft is a
  partial thing by definition, so do not run full validation on it.
- **Continue to Review** → generate/refresh the preview.

## Product Focus drives everything

Product Focus is the RM choosing *which area to advise on*. The **same customer with a
different focus must produce a different document** — different products included,
different calculations, different recommendations.

Define this as **one data-driven configuration object**, not scattered `if`/`switch`
blocks across components:

| Product Focus | Products included | Headline calculations |
|---|---|---|
| Equity Portfolio Restructuring | Mutual Fund, Portfolio Management | Total MF value; fund allocation %; current vs recommended equity allocation |
| Fixed Income Advisory | Bond, Fixed Deposit | Total bond value + total FD value; maturity schedule; interest income |
| Wealth Preservation & Insurance | Insurance | Total coverage (sum assured); total premium; coverage gap |
| Retirement Planning | Portfolio Management, Mutual Fund, Fixed Deposit | Current corpus; target corpus; monthly SIP required |
| Alternative Investments | Portfolio Management | Alternative allocation %; recommended allocation % |

Adding a sixth focus later must mean adding one entry to that object — nothing else.

## Product Summary — the column semantics

The table has three columns and they mean different things per focus. Get this right:

- **Current Value** — the *latest* value, including returns, interest or growth where
  applicable. For insurance this is the **coverage / sum assured**, not a market value.
- **Investments / Contributions** — the *original* amount: invested, contributed, or for
  insurance the **premium paid**.
- **Fees Due** — outstanding fees/charges on that product; `₹0` when none apply.

Only products belonging to the selected focus appear. Always render a **Total** row.
Money as `₹` with Indian digit grouping (`₹48,72,760.00`), two decimals, right-aligned,
tabular figures so the columns line up.

Show "All values as of {adviceDate}" under the table.

## Advice document template

One template structure, five content variants. Match the Statement document's visual
language exactly — same logo placement, letterhead, typography, table styling, footer.

Structure:

```
[SC logo]                          Wealth Core — Personalized Advice
                                   For {customerName} (ID: {customerId})
                                   {adviceDate}

Dear {customerName},

Based on your latest portfolio profile, we have prepared a recommendation
focused on {productFocus}.

── Personalized Advice Summary ──
── Portfolio Position ──        (the Product Summary table)
── Recommendation Focus ──      (focus-specific analysis + figures)
── Recommended Actions ──       (bulleted, specific, with numbers)
── Important Information ──     (disclaimer)

Prepared by {rmName} · Standard Chartered Global Private Bank
```

Content per focus — use the customer's real figures, never placeholders:

- **Equity Portfolio Restructuring** — current vs recommended equity allocation with real
  percentages; identify overexposure and concentration; name underperforming holdings;
  suggest rebalancing. *"Current Equity Allocation: 85% → Recommended: 65%"*
- **Fixed Income Advisory** — bond and FD holdings review; maturity/renewal planning;
  interest income optimisation. *"Renew FD maturing {date} at a longer tenure"*
- **Wealth Preservation & Insurance** — coverage vs recommended, and the **gap** between
  them; protection planning. *"Current Coverage ₹50L → Recommended ₹1Cr"*
- **Retirement Planning** — current corpus, target corpus, and the **monthly SIP required
  to close the difference**; allocation by age. *"Target ₹5Cr · Monthly SIP ₹50,000"*
- **Alternative Investments** — current alternative allocation %, diversification
  opportunities, risk-return comparison. *"Allocate 10% to REITs"*

**Every number in the document must be computed from real customer data.** If a figure
cannot be derived, omit that line — never print a hard-coded example value into a document
that goes to a customer.

## Preview and Download — match the Statement page

- **Multi-page preview** with `‹ 1/2 ›` paging and an **Expand preview** control, exactly
  as Statements does.
- **Download** produces the PDF the same way the Statement page does. Reuse that code
  path. If it is print-to-PDF, add a print stylesheet that hides nav, buttons and the
  stepper, forces page breaks between sections, and keeps table headers repeating across
  pages (`thead { display: table-header-group }`).
- **Documents Included** — list generated documents with remove (×) and add (+), as now.

## Dispatch step

Keep what exists: masked recipient (`r***a@g***.com`), subject defaulting to
`Your Wealth Core Advice - {adviceDate}`, editable message body, "Notify me when the email
is opened", the summary panel (Products Covered, Total Current Value, Investments /
Contributions, Fees Due), and the security note about password-protected attachments.

**Mask the recipient server-side.** The browser has no reason to hold the customer's full
address — the backend already has it to send with.

On success: "Advice dispatched", the Document ID, and "Generate another" — which must
reset the **whole** wizard, not just the customer.

## CSS consistency — non-negotiable

Take colours, spacing, fonts, buttons, tables, pagination and the stepper from the
**existing shared styles**. Do not introduce new hex values, new button variants, or a new
table style. If something you need does not exist, add it to the shared layer so every page
gets it — not to an Advice-only stylesheet.

The Advice document and the Statement document must be **visually indistinguishable** apart
from their content. Put them side by side and check.

## Data and state

- Fetch product data from the backend (`bank_data`); do not compute customer figures in the
  browser from hard-coded values.
- Changing the **Product Focus must invalidate the generated preview** — a stale preview
  from a previous focus is the worst failure here, because it looks correct and is not.
- Changing the customer resets focus, preview and documents.
- Every fetch needs a **loading state and a visible error state**. A silently empty Product
  Summary table looks like a customer with no holdings.

## Done when

1. The same customer under all five focuses produces five genuinely different documents
   with correct, different figures.
2. The Advice document is visually identical to the Statement document in style.
3. Download works from Advice exactly as it does from Statements.
4. **Save as Draft persists without generating a preview**, from both Review and Dispatch,
   with incomplete fields.
5. The Statements page still works, unchanged.
6. `npm run build` compiles with no warnings.
Two things I'd flag before you run it:

The "Fees Due" column needs a source. I've told Copilot to read it from the backend and show ₹0 when absent — but if bank_data has no fee field, it'll invent one. Worth checking that field exists first, or the column will quietly be zeros everywhere.

Stale preview after changing focus is the bug most likely to embarrass you in a demo. If the RM picks Equity, previews, then switches to Retirement without regenerating, the document still says Equity — and it looks completely convincing. That's why it's called out explicitly rather than left to Copilot's judgement.