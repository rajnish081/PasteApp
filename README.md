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




{
  "nav": {
    "dashboard": "仪表板",
    "customers": "客户",
    "statements": "对账单",
    "advice": "建议书",
    "language": "语言"
  },
  "dashboard": {
    "title": "仪表板",
    "subtitle": "欢迎回来，以下是您今日的概览。",
    "priorityCustomers": "重点客户",
    "searchPlaceholder": "按姓名或类别搜索...",
    "name": "姓名",
    "priority": "优先级",
    "dueDate": "到期日",
    "category": "类别",
    "reason": "事由",
    "amount": "金额",
    "action": "操作"
  },
  "common": {
    "view": "查看",
    "exportReport": "导出报告",
    "newCustomer": "+ 新增客户",
    "loading": "加载中...",
    "language": "语言"
  }
}


<!-- language context -->

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from '../locales/en.json';
import zhCN from '../locales/zh-CN.json';

const DICTIONARIES = { en, 'zh-CN': zhCN };

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'zh-CN', label: '简体中文', short: '中文' },
];

const STORAGE_KEY = 'wealthcore.language';

const LanguageContext = createContext(null);

// Resolves a dotted key like "nav.dashboard" against the nested JSON.
function lookup(dictionary, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dictionary);
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return DICTIONARIES[saved] ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((code) => {
    if (DICTIONARIES[code]) setLanguageState(code);
  }, []);

  // Falls back to English, then to the key itself — so a missing translation
  // shows up as visible text instead of rendering blank.
  const t = useCallback(
    (key, fallback) =>
      lookup(DICTIONARIES[language], key) ?? lookup(DICTIONARIES.en, key) ?? fallback ?? key,
    [language]
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}

<!-- src/components/common/LanguageSwitcher.jsx -->
import { SUPPORTED_LANGUAGES, useLanguage } from '../../context/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const active = SUPPORTED_LANGUAGES.find((l) => l.code === language);

  return (
    <div className="language-pill">
      <label className="sr-only" htmlFor="language-select">{t('common.language')}</label>
      <span aria-hidden="true">{t('nav.language')}: {active?.short}</span>
      <select id="language-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>{lang.label}</option>
        ))}
      </select>
    </div>
  );
}


<!-- css -->
.language-pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 999px;
  background: #0473ea;
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
}
.language-pill:focus-within { outline: 2px solid #00285a; outline-offset: 2px; }
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}


import { LanguageProvider } from './context/LanguageContext';

<LanguageProvider>
  <BrowserRouter>
    {/* existing app */}
  </BrowserRouter>
</LanguageProvider>



import LanguageSwitcher from '../common/LanguageSwitcher';
// ...
<LanguageSwitcher />





import { useLanguage } from '../../context/LanguageContext';

export default function DashboardPage() {
  const { t } = useLanguage();
  return <h2>{t('dashboard.title')}</h2>;   // was: <h2>Dashboard</h2>
}



#hiiiii
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from '../locales/en.json';
import zhCN from '../locales/zh-CN.json';

// Owner: Rajnish (shared) — US04 / US05.
// Lightweight i18n: no library, just a dictionary lookup. Add keys to BOTH
// locales/en.json and locales/zh-CN.json — the key sets must stay identical.

const DICTIONARIES = {
  en,
  'zh-CN': zhCN,
};

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'zh-CN', label: '简体中文', short: '中文' },
];

const STORAGE_KEY = 'wealthcore.language';

const LanguageContext = createContext(null);

// Resolves a dotted key like "nav.dashboard" against a nested dictionary.
function lookup(dictionary, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dictionary);
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return DICTIONARIES[saved] ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((code) => {
    if (DICTIONARIES[code]) setLanguageState(code);
  }, []);

  // t('nav.dashboard') -> translated string, falling back to English, then the key
  // itself so a missing translation is visible instead of rendering blank.
  const t = useCallback(
    (key, fallback) =>
      lookup(DICTIONARIES[language], key) ?? lookup(DICTIONARIES.en, key) ?? fallback ?? key,
    [language]
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}

#hiiiii