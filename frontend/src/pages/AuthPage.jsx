import { useState } from 'react';
import { useSignIn, useSignUp } from '@clerk/clerk-react';
import { ABOUT_ITEMS, BRAND_COPY, BRAND_NAME, CONTACT_INFO } from '../config/branding.js';

function getClerkError(error, fallbackMessage) {
  const clerkMessage =
    error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message || error?.message;

  return clerkMessage || fallbackMessage;
}

function AuthInput({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </label>
  );
}

function SignInPanel({ onForgotPassword, onSwitchMode }) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!isLoaded) return;
    if (!form.email.trim() || !form.password.trim()) {
      setMessage('Please enter your email address and password.');
      return;
    }

    try {
      setSubmitting(true);
      setMessage('');
      const result = await signIn.create({
        identifier: form.email.trim(),
        password: form.password,
      });

      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        return;
      }

      setMessage('Sign-in needs an extra verification step in your authentication settings.');
    } catch (error) {
      setMessage(getClerkError(error, 'Could not sign in. Please check your email and password.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-form-wrap fade-in-up">
      <div className="auth-form-header">
        <h2>{BRAND_COPY.signInTitle}</h2>
        <p>{BRAND_COPY.signInText}</p>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <AuthInput
          label="Email address"
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <AuthInput
          label="Password"
          type="password"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
        <button className="primary-button auth-submit" type="submit" disabled={submitting || !isLoaded}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
        <button className="text-button" type="button" onClick={onForgotPassword}>
          Forgot password?
        </button>
        <button className="text-button" type="button" onClick={() => onSwitchMode('sign-up')}>
          New here? Create an account
        </button>
        {message ? <div className="auth-inline-message auth-inline-error">{message}</div> : null}
      </form>
    </div>
  );
}

function SignUpPanel({ onSwitchMode }) {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [step, setStep] = useState('create');
  const [form, setForm] = useState({ email: '', password: '', code: '' });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submitCreate(event) {
    event.preventDefault();
    if (!isLoaded) return;
    if (!form.email.trim() || !form.password.trim()) {
      setMessage('Please enter your email address and password.');
      return;
    }

    try {
      setSubmitting(true);
      setMessage('');
      await signUp.create({
        emailAddress: form.email.trim(),
        password: form.password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('verify');
      setMessage('Verification code sent to your email address.');
    } catch (error) {
      setMessage(getClerkError(error, 'Could not create the account.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitVerify(event) {
    event.preventDefault();
    if (!isLoaded) return;
    if (!form.code.trim()) {
      setMessage('Please enter the verification code.');
      return;
    }

    try {
      setSubmitting(true);
      setMessage('');
      const result = await signUp.attemptEmailAddressVerification({
        code: form.code.trim(),
      });

      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        return;
      }

      setMessage('Verification is not complete yet. Please check the code and try again.');
    } catch (error) {
      setMessage(getClerkError(error, 'Could not verify the email code.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-form-wrap fade-in-up">
      <div className="auth-form-header">
        <h2>{BRAND_COPY.signUpTitle}</h2>
        <p>{BRAND_COPY.signUpText}</p>
      </div>

      {step === 'create' ? (
        <form className="auth-form" onSubmit={submitCreate}>
          <AuthInput
            label="Email address"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <AuthInput
            label="Password"
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            placeholder="Create a strong password"
            autoComplete="new-password"
          />
          <button className="primary-button auth-submit" type="submit" disabled={submitting || !isLoaded}>
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
          {message ? <div className="auth-inline-message">{message}</div> : null}
        </form>
      ) : (
        <form className="auth-form" onSubmit={submitVerify}>
          <AuthInput
            label="Verification code"
            value={form.code}
            onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
            placeholder="Enter the code from your email"
            autoComplete="one-time-code"
          />
          <button className="primary-button auth-submit" type="submit" disabled={submitting || !isLoaded}>
            {submitting ? 'Verifying...' : 'Verify email'}
          </button>
          <button className="text-button" type="button" onClick={() => setStep('create')}>
            Change email
          </button>
          {message ? <div className="auth-inline-message">{message}</div> : null}
        </form>
      )}
      <button className="text-button" type="button" onClick={() => onSwitchMode('sign-in')}>
        Already have an account? Sign in
      </button>
    </div>
  );
}

function ForgotPasswordPanel({ onBack, onSwitchMode }) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [step, setStep] = useState('request');
  const [form, setForm] = useState({ email: '', code: '', password: '' });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function requestReset(event) {
    event.preventDefault();
    if (!isLoaded) return;
    if (!form.email.trim()) {
      setMessage('Please enter your email address.');
      return;
    }

    try {
      setSubmitting(true);
      setMessage('');
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: form.email.trim(),
      });
      setStep('reset');
      setMessage('Password reset code sent to your email address.');
    } catch (error) {
      setMessage(getClerkError(error, 'Could not start password reset.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReset(event) {
    event.preventDefault();
    if (!isLoaded) return;
    if (!form.code.trim() || !form.password.trim()) {
      setMessage('Please enter the reset code and your new password.');
      return;
    }

    try {
      setSubmitting(true);
      setMessage('');
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: form.code.trim(),
        password: form.password,
      });

      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        return;
      }

      setMessage('Password reset could not be completed. Please verify the code and try again.');
    } catch (error) {
      setMessage(getClerkError(error, 'Could not reset the password.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-form-wrap fade-in-up">
      <div className="auth-form-header">
        <h2>Reset your password</h2>
        <p>Enter your email address to receive a reset code, then choose a new password.</p>
      </div>

      {step === 'request' ? (
        <form className="auth-form" onSubmit={requestReset}>
          <AuthInput
            label="Email address"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <button className="primary-button auth-submit" type="submit" disabled={submitting || !isLoaded}>
            {submitting ? 'Sending code...' : 'Send reset code'}
          </button>
          <button className="text-button" type="button" onClick={onBack}>
            Back to sign in
          </button>
          {message ? <div className="auth-inline-message">{message}</div> : null}
        </form>
      ) : (
        <form className="auth-form" onSubmit={submitReset}>
          <AuthInput
            label="Reset code"
            value={form.code}
            onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
            placeholder="Enter the code from your email"
            autoComplete="one-time-code"
          />
          <AuthInput
            label="New password"
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            placeholder="Choose a new password"
            autoComplete="new-password"
          />
          <button className="primary-button auth-submit" type="submit" disabled={submitting || !isLoaded}>
            {submitting ? 'Updating password...' : 'Reset password'}
          </button>
          <button className="text-button" type="button" onClick={onBack}>
            Back to sign in
          </button>
          {message ? <div className="auth-inline-message">{message}</div> : null}
        </form>
      )}
      <button className="text-button" type="button" onClick={() => onSwitchMode('sign-up')}>
        Need a new account? Sign up
      </button>
    </div>
  );
}

export default function AuthPage({ message, isSignedIn, theme, onToggleTheme }) {
  const [mode, setMode] = useState('sign-in');
  const [view, setView] = useState('home');

  function renderTopNav() {
    return (
      <div className="landing-topbar landing-topbar-right">
        <div className="landing-actions">
          {view !== 'home' ? (
            <button className="nav-link-button" type="button" onClick={() => setView('home')}>
              Home
            </button>
          ) : null}
          {view !== 'about' ? (
            <button className="nav-link-button" type="button" onClick={() => setView('about')}>
              About us
            </button>
          ) : null}
          {view !== 'contact' ? (
            <button className="nav-link-button" type="button" onClick={() => setView('contact')}>
              Contact us
            </button>
          ) : null}
          <button className="theme-toggle" type="button" onClick={onToggleTheme}>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </div>
    );
  }

  if (view === 'about' || view === 'contact') {
    return (
      <div className="auth-shell auth-shell-v2">
        <div className="auth-background-glow auth-background-glow-left" />
        <div className="auth-background-glow auth-background-glow-right" />
        <div className="info-layout fade-in-up">
          {renderTopNav()}
          {view === 'about' ? (
            <section className="about-page surface-card">
              <div className="about-page-header">
                <div>
                  <h1>{BRAND_COPY.aboutTitle}</h1>
                </div>
              </div>
              <p>{BRAND_COPY.aboutText}</p>
              <div className="about-grid">
                {ABOUT_ITEMS.map((item) => (
                  <article key={item.title} className="about-card">
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : (
            <section className="about-page surface-card">
              <div className="about-page-header">
                <div>
                  <h1>Contact Fund Circle</h1>
                </div>
              </div>
              <p>
                If you need help with your group workspace, onboarding, or account access, please use
                the contact details below.
              </p>
              <div className="contact-grid">
                <article className="about-card">
                  <h3>Contact person</h3>
                  <p>{CONTACT_INFO.name}</p>
                </article>
                <article className="about-card">
                  <h3>Email</h3>
                  <p>{CONTACT_INFO.email}</p>
                </article>
                <article className="about-card">
                  <h3>Phone</h3>
                  <p>{CONTACT_INFO.phone}</p>
                </article>
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell auth-shell-v2">
      <div className="auth-background-glow auth-background-glow-left" />
      <div className="auth-background-glow auth-background-glow-right" />

      <div className="landing-shell fade-in-up">
        {renderTopNav()}
      </div>
      <div className="auth-layout">
        <section className="auth-hero fade-in-up">
          <div className="landing-view fade-in-up">
            <div className="brand-hero">{BRAND_NAME}</div>
            <div className="auth-copy">
              <h1>{BRAND_COPY.heroTitle}</h1>
              <p>{BRAND_COPY.heroText}</p>
            </div>
          </div>
        </section>

        <section className="auth-card auth-authbox surface-card fade-in-up" style={{ animationDelay: '120ms' }}>
          {message ? <div className="auth-message">{message}</div> : null}
          {isSignedIn ? <div className="auth-message">Finishing your secure session...</div> : null}

          {mode === 'sign-in' ? (
            <SignInPanel onForgotPassword={() => setMode('forgot-password')} onSwitchMode={setMode} />
          ) : null}
          {mode === 'sign-up' ? <SignUpPanel onSwitchMode={setMode} /> : null}
          {mode === 'forgot-password' ? (
            <ForgotPasswordPanel onBack={() => setMode('sign-in')} onSwitchMode={setMode} />
          ) : null}
        </section>
      </div>
    </div>
  );
}
