auth.css
.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32px 20px;
  background: var(--background);
}

.login-card {
  width: 100%;
  max-width: 460px;
  padding: 40px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}

.brand-mark {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  color: var(--surface);
  font-size: 22px;
  font-weight: 700;
  background: var(--sc-blue);
  border-radius: var(--radius-sm);
}

.brand-name,
.brand-subtitle {
  margin: 0;
}

.brand-name {
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 600;
  text-transform: lowercase;
}

.brand-subtitle {
  margin-top: 2px;
  color: var(--sc-green);
  font-size: 13px;
  font-weight: 600;
}

.login-heading {
  margin-bottom: 28px;
}

.login-heading h1 {
  margin: 0 0 8px;
  color: var(--text-primary);
  font-size: 30px;
  font-weight: 700;
  line-height: 1.2;
}

.login-heading p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.login-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.login-field label {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
}

.login-input {
  width: 100%;
  padding: 12px 14px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 15px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.login-input::placeholder {
  color: var(--text-muted);
}

.login-input:focus {
  border-color: var(--sc-blue);
  box-shadow: 0 0 0 3px rgba(0, 114, 170, 0.14);
}

.input-error {
  border-color: #c62828;
}

.password-input-wrapper {
  position: relative;
}

.password-input-wrapper .login-input {
  padding-right: 70px;
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 10px;
  padding: 4px 6px;
  color: var(--sc-blue);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  background: transparent;
  border: none;
  cursor: pointer;
  transform: translateY(-50%);
}

.password-toggle:hover {
  color: var(--sc-blue-bright);
}

.field-error,
.login-error {
  margin: 0;
  color: #c62828;
  font-size: 13px;
}

.login-error {
  padding: 10px 12px;
  background: #fff2f2;
  border: 1px solid #f1c8c8;
  border-radius: var(--radius-sm);
}

.login-submit-button {
  width: 100%;
  padding: 12px 18px;
  color: var(--surface);
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  background: var(--sc-blue);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.2s ease;
}

.login-submit-button:hover:not(:disabled) {
  background: #005f8f;
}

.login-submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.login-demo-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 24px 0 0;
  padding-top: 20px;
  color: var(--text-muted);
  font-size: 12px;
  border-top: 1px solid var(--border-light);
}

.login-demo-text strong {
  color: var(--text-secondary);
  font-weight: 600;
}

@media (max-width: 768px) {
  .login-page {
    align-items: flex-start;
    padding: 24px 16px;
  }

  .login-card {
    padding: 28px 22px;
  }

  .login-heading h1 {
    font-size: 26px;
  }
}

















import LoginForm from "./LoginForm";
import "./auth.css";

const LoginPage = () => {
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="brand-mark">S</div>

          <div>
            <p className="brand-name">standard chartered</p>
            <p className="brand-subtitle">WealthCore</p>
          </div>
        </div>

        <div className="login-heading">
          <h1>RM Dashboard Login</h1>
          <p>
            Sign in to access customer portfolios, statements, and advice
            tools.
          </p>
        </div>

        <LoginForm />

        <div className="login-demo-text">
          <strong>Demo account</strong>
          <span>rm@bank.com / password123</span>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;