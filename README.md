import { currentRm } from '../../services/mockData';

// Owner: Rajnish — US03.
//
// Talks to the Spring Security backend: session cookie, progressive CAPTCHA, emailed
// one-time code. Falls back to a mock when REACT_APP_API_BASE_URL is unset, matching the
// switch in services/api.js, so the UI still runs with no backend.
//
// The security-relevant change from the old version: nothing is trusted from
// localStorage any more. A session exists only if GET /api/rm/me says so.

const BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

// Same switch as services/api.js: no API base URL configured means run on the mock, so a
// fresh clone works with no backend. Set REACT_APP_API_BASE_URL (or leave it empty and
// rely on the dev proxy by setting it to an empty-but-defined value) to talk to Spring.
const USE_MOCK = !BASE_URL && process.env.REACT_APP_USE_REAL_AUTH !== 'true';

// Errors carry the server's machine-readable code and details so the form can react —
// show the CAPTCHA, start a cooldown — instead of parsing message strings.
export class AuthError extends Error {
  constructor({ code, message, details, status }) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.details = details || {};
    this.status = status;
  }
}

// Spring writes the CSRF token to a readable cookie; we echo it back as a header. Any
// request that skips this gets a 403 from the CSRF filter.
function csrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = csrfToken();
  if (token) headers['X-XSRF-TOKEN'] = token;

  const response = await fetch(`${BASE_URL}/api${path}`, {
    method,
    headers,
    // Without this the session cookie is neither sent nor stored.
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new AuthError({
      code: payload?.code || 'UNKNOWN',
      message: payload?.message || 'Something went wrong. Please try again.',
      details: payload?.details,
      status: response.status,
    });
  }

  return payload;
}

// --- Mock -----------------------------------------------------------------
// Mirrors the real flow closely enough to develop the UI against: three failures
// demand a CAPTCHA, and a correct password still requires the code. The code is
// fixed and the CAPTCHA answer is printed on the image, because this path is for
// working offline, not for pretending to be secure.

const MOCK_PASSWORD = 'Avengers@2026';
const MOCK_OTP = '123456';
const mockState = { failures: 0, captchaAnswer: null, pending: false, signedIn: false };

/**
 * Clears the mock's failure counter and session between tests. Without this the
 * lockout state leaks from one test into the next, since the module is only
 * evaluated once per test file. No effect on the real service.
 */
export function resetMockAuthState() {
  mockState.failures = 0;
  mockState.captchaAnswer = null;
  mockState.pending = false;
  mockState.signedIn = false;
}

function mockCaptchaImage(answer) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="190" height="60">` +
    `<rect width="190" height="60" fill="#f2f6f4"/>` +
    `<text x="20" y="42" font-family="monospace" font-size="30" fill="#00674f">${answer}</text>` +
    `</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function newMockCaptcha() {
  mockState.captchaAnswer = String(Math.floor(10000 + Math.random() * 89999));
  return { imageDataUri: mockCaptchaImage(mockState.captchaAnswer), expiresInSeconds: 300 };
}

const mockService = {
  async captcha() {
    return newMockCaptcha();
  },

  async login({ username, password, captchaAnswer }) {
    if (mockState.failures >= 5) {
      throw new AuthError({
        code: 'ACCOUNT_LOCKED',
        message: 'Too many sign-in attempts. Try again later.',
        details: { retryAfterSeconds: 900 },
        status: 423,
      });
    }

    if (mockState.failures >= 3 && captchaAnswer !== mockState.captchaAnswer) {
      mockState.failures += 1;
      throw new AuthError({
        code: 'CAPTCHA_REQUIRED',
        message: captchaAnswer
          ? 'That security check was not correct. Try the new image.'
          : 'Please complete the security check.',
        details: { captchaRequired: true, ...newMockCaptcha() },
        status: 403,
      });
    }

    if (!username || password !== MOCK_PASSWORD) {
      mockState.failures += 1;
      throw new AuthError({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid user ID or password',
        status: 401,
      });
    }

    mockState.pending = true;
    return { mfaRequired: true, maskedEmail: 'r***h@sc.com', resendCooldownSeconds: 60 };
  },

  async verifyMfa({ code }) {
    if (!mockState.pending) {
      throw new AuthError({
        code: 'MFA_NOT_PENDING',
        message: 'Your sign-in session has expired. Please sign in again.',
        status: 401,
      });
    }
    if (code !== MOCK_OTP) {
      throw new AuthError({ code: 'MFA_CODE_INVALID', message: 'That code is not correct.', status: 401 });
    }
    mockState.pending = false;
    mockState.failures = 0;
    mockState.signedIn = true;
    return { ...currentRm };
  },

  async resendMfa() {
    return { maskedEmail: 'r***h@sc.com' };
  },

  async logout() {
    mockState.pending = false;
    mockState.signedIn = false;
  },

  async me() {
    if (!mockState.signedIn) {
      throw new AuthError({ code: 'UNAUTHENTICATED', message: 'No session', status: 401 });
    }
    return { ...currentRm };
  },
};

// --- Public API -----------------------------------------------------------

const realService = {
  captcha: () => request('/auth/captcha'),
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  verifyMfa: ({ code }) => request('/auth/mfa/verify', { method: 'POST', body: { code } }),
  resendMfa: () => request('/auth/mfa/resend', { method: 'POST' }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/rm/me'),
};

const backing = USE_MOCK ? mockService : realService;

const authService = {
  /** A fresh CAPTCHA image — for the refresh button. */
  captcha() {
    return backing.captcha();
  },

  /**
   * Step one. Resolving does NOT mean signed in: unless MFA is disabled for the RM the
   * result carries `mfaRequired` and the code still has to be verified.
   */
  login({ username, password, captchaAnswer }) {
    return backing.login({ username, password, captchaAnswer: captchaAnswer || undefined });
  },

  /** Step two — the call that actually establishes the session. */
  verifyMfa({ code }) {
    return backing.verifyMfa({ code });
  },

  resendMfa() {
    return backing.resendMfa();
  },

  logout() {
    return backing.logout();
  },

  /**
   * Restores a session on boot. This replaced reading a user object out of
   * localStorage — the old version meant anyone could forge a session by typing into
   * devtools. Only the server can answer this now.
   */
  async currentUser() {
    try {
      return await backing.me();
    } catch {
      return null;
    }
  },
};

export default authService;








import { useLanguage } from '../../context/LanguageContext';
import Input from '../../components/common/Input';

// Owner: Rajnish — US03.
//
// Only rendered once the server says a CAPTCHA is required, which happens after repeated
// failures rather than on every sign-in. The image arrives as a data URI already embedded
// in the login response, so there is no second round trip to draw the form.
export default function CaptchaField({ imageDataUri, value, onChange, onRefresh, error }) {
  const { t } = useLanguage();

  return (
    <div className="captcha">
      <div className="captcha__row">
        <img className="captcha__image" src={imageDataUri} alt={t('login.captchaImageAlt')} />
        <button
          type="button"
          className="captcha__refresh"
          onClick={onRefresh}
          aria-label={t('login.captchaRefresh')}
          title={t('login.captchaRefresh')}
        >
          ↻
        </button>
      </div>

      <Input
        id="captchaAnswer"
        name="captchaAnswer"
        label={t('login.captchaLabel')}
        value={value}
        onChange={onChange}
        error={error}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck="false"
        maxLength={8}
      />
    </div>
  );
}




import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import authService from './authService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import CaptchaField from './CaptchaField';

// Owner: Rajnish — US03. Step one: credentials.
//
// The CAPTCHA is progressive: it appears only when the server responds CAPTCHA_REQUIRED,
// which happens after repeated failures. Legitimate sign-ins never see it.
export default function LoginForm() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ username: '', password: '', captchaAnswer: '' });
  const [captcha, setCaptcha] = useState(null);
  const [error, setError] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [lockedFor, setLockedFor] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const refreshCaptcha = async () => {
    try {
      const fresh = await authService.captcha();
      setCaptcha(fresh);
      setForm((prev) => ({ ...prev, captchaAnswer: '' }));
      setCaptchaError('');
    } catch {
      setCaptchaError(t('login.captchaUnavailable'));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCaptchaError('');
    setSubmitting(true);

    try {
      const result = await login(form);
      // When MFA is required the page swaps to MfaForm on its own, driven by
      // `pendingMfa` in AuthContext — there is nothing to navigate to yet.
      if (!result.mfaRequired) {
        navigate(location.state?.from?.pathname || '/', { replace: true });
      }
    } catch (err) {
      // The server hands back a fresh challenge with the rejection, so the form can show
      // it without a second round trip. The old image is already spent.
      if (err.code === 'CAPTCHA_REQUIRED') {
        setCaptcha({
          imageDataUri: err.details.imageDataUri,
          expiresInSeconds: err.details.expiresInSeconds,
        });
        setForm((prev) => ({ ...prev, captchaAnswer: '' }));
        setCaptchaError(err.message);
      } else if (err.code === 'ACCOUNT_LOCKED') {
        setLockedFor(err.details?.retryAfterSeconds || 0);
        setError(err.message);
      } else {
        setError(err.message || t('login.error'));
      }
      setForm((prev) => ({ ...prev, password: '' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="login-form" onSubmit={onSubmit}>
      <Input
        id="username"
        name="username"
        label={t('login.username')}
        value={form.username}
        onChange={onChange}
        autoComplete="username"
      />

      <Input
        id="password"
        name="password"
        type="password"
        label={t('login.password')}
        value={form.password}
        onChange={onChange}
        autoComplete="current-password"
        error={error}
      />

      {captcha && (
        <CaptchaField
          imageDataUri={captcha.imageDataUri}
          value={form.captchaAnswer}
          onChange={onChange}
          onRefresh={refreshCaptcha}
          error={captchaError}
        />
      )}

      {lockedFor > 0 && (
        <p className="login-form__locked" role="alert">
          {t('login.lockedFor').replace('{minutes}', Math.ceil(lockedFor / 60))}
        </p>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting ? t('common.loading') : t('login.submit')}
      </Button>
    </form>
  );


}




import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import ScLogo from '../../components/ui/ScLogo';
import LoginForm from './LoginForm';
import MfaForm from './MfaForm';
import './auth.css';

// Owner: Rajnish.
export default function LoginPage() {
  const { isAuthenticated, pendingMfa } = useAuth();
  const { t } = useLanguage();

  // Already signed in — don't show the form again.
  if (isAuthenticated) return <Navigate to="/" replace />;

  // A password has been accepted but the one-time code has not. Still unauthenticated.
  const awaitingCode = Boolean(pendingMfa);

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__brand">
          <ScLogo size={38} />
          <span>
            standard chartered
            <small>{t('app.tagline')}</small>
          </span>
        </div>

        <h2 className="login-card__title">
          {awaitingCode ? t('login.mfaTitle') : t('login.title')}
        </h2>
        <p className="login-card__subtitle">
          {awaitingCode ? t('login.mfaSubtitle') : t('login.subtitle')}
        </p>

        {awaitingCode ? <MfaForm /> : <LoginForm />}

        <div className="login-card__footer">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}









import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

// Owner: Rajnish — US03. Second step: the emailed one-time code.
//
// Reaching this form means the password was accepted, but the session is still not
// authenticated — that only happens when verifyMfa resolves.
export default function MfaForm() {
  const { pendingMfa, verifyMfa, resendMfa, cancelMfa } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(pendingMfa?.resendCooldownSeconds ?? 0);

  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Resend cooldown. The server enforces its own — this only keeps the button honest.
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => setCooldown((s) => Math.max(s - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      await verifyMfa(code);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(err.message || t('login.error'));
      // A dead challenge cannot be retried — send the RM back to the start.
      if (['MFA_NOT_PENDING', 'MFA_ATTEMPTS_EXHAUSTED'].includes(err.code)) {
        cancelMfa();
      } else {
        setCode('');
        inputRef.current?.focus();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    setError('');
    try {
      await resendMfa();
      setNotice(t('login.mfaResent'));
      setCooldown(pendingMfa?.resendCooldownSeconds ?? 60);
    } catch (err) {
      setError(err.message || t('login.error'));
      if (err.details?.retryAfterSeconds) setCooldown(err.details.retryAfterSeconds);
    }
  };

  return (
    <form className="login-form" onSubmit={onSubmit}>
      <p className="login-form__lede">
        {t('login.mfaSentTo')} <strong>{pendingMfa?.maskedEmail}</strong>
      </p>

      <Input
        ref={inputRef}
        id="code"
        name="code"
        label={t('login.mfaCode')}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        error={error}
        // Lets the browser and iOS offer the code straight from the message.
        autoComplete="one-time-code"
        inputMode="numeric"
        maxLength={6}
        autoFocus
      />

      {notice && <p className="login-form__notice">{notice}</p>}

      <Button type="submit" disabled={submitting || code.length < 6}>
        {submitting ? t('common.loading') : t('login.mfaVerify')}
      </Button>

      <div className="login-form__actions">
        <button type="button" className="login-form__link" onClick={onResend} disabled={cooldown > 0}>
          {cooldown > 0 ? t('login.mfaResendIn').replace('{seconds}', cooldown) : t('login.mfaResend')}
        </button>
        <button type="button" className="login-form__link" onClick={cancelMfa}>
          {t('login.mfaUseAnother')}
        </button>
      </div>
    </form>
  );
}



import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import authService from '../features/auth/authService';

// Owner: Rajnish — RM session state.
//
// Sign-in is two steps: credentials, then an emailed one-time code. `pendingMfa` holds
// the gap between them. Nothing here counts as authenticated until verifyMfa resolves —
// a half-finished sign-in leaves `user` null and the route guard still closed.

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingMfa, setPendingMfa] = useState(null);

  // Ask the server whether there is a session. This replaced reading a user object out
  // of localStorage, which anyone could forge from devtools.
  useEffect(() => {
    let cancelled = false;
    authService.currentUser().then((restored) => {
      if (cancelled) return;
      setUser(restored);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Step one. Resolves to { mfaRequired } — deliberately does NOT set `user` in that
  // case, because the password alone grants nothing.
  const login = useCallback(async (credentials) => {
    const result = await authService.login(credentials);

    if (result?.mfaRequired) {
      setPendingMfa({
        maskedEmail: result.maskedEmail,
        resendCooldownSeconds: result.resendCooldownSeconds ?? 60,
      });
      return { mfaRequired: true };
    }

    // Only reachable when MFA is switched off for this RM.
    setUser(result.profile || result);
    setPendingMfa(null);
    return { mfaRequired: false };
  }, []);

  // Step two — the call that actually establishes the session.
  const verifyMfa = useCallback(async (code) => {
    const profile = await authService.verifyMfa({ code });
    setUser(profile);
    setPendingMfa(null);
    return profile;
  }, []);

  const resendMfa = useCallback(() => authService.resendMfa(), []);

  // Abandons a half-finished sign-in and returns to the credentials form.
  const cancelMfa = useCallback(() => setPendingMfa(null), []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      // Clear locally even if the call failed — the RM asked to be signed out, and the
      // server session is dead or unreachable either way.
      setUser(null);
      setPendingMfa(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      pendingMfa,
      login,
      verifyMfa,
      resendMfa,
      cancelMfa,
      logout,
      isAuthenticated: Boolean(user),
    }),
    [user, loading, pendingMfa, login, verifyMfa, resendMfa, cancelMfa, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
