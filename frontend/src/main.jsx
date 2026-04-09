import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.jsx';
import { BRAND_NAME } from './config/branding.js';
import './styles/globals.css';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function ConfigScreen() {
  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-copy">
          <div className="auth-eyebrow">{BRAND_NAME}</div>
          <h1>Local setup is incomplete.</h1>
          <p>Add the missing frontend environment values, then refresh the page.</p>
        </div>
        <div className="auth-card">
          <div className="tile-title">Required file</div>
          <div className="card-sub">Create or update `frontend/.env` with:</div>
          <pre className="auth-info">{`VITE_API_BASE_URL=${apiBaseUrl}
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...`}</pre>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {publishableKey ? (
      <ClerkProvider publishableKey={publishableKey}>
        <App />
      </ClerkProvider>
    ) : (
      <ConfigScreen />
    )}
  </React.StrictMode>
);
