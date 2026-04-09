import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import { getCurrentUser } from './services/authService.js';
import { setAuthTokenProvider } from './services/apiClient.js';

function App() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [user, setUser] = useState(undefined);
  const [authError, setAuthError] = useState('');
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';

    const storedTheme = window.localStorage.getItem('fundcircle-theme');
    return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'dark';
  });

  useEffect(() => {
    document.body.dataset.theme = theme;
    window.localStorage.setItem('fundcircle-theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  useEffect(() => {
    if (!isLoaded) return;

    setAuthTokenProvider(isSignedIn ? () => getToken() : null);
  }, [getToken, isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setAuthError('');
      setUser(null);
      return;
    }

    let active = true;
    setUser(undefined);

    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();
        if (!active) return;
        setAuthError('');
        setUser(currentUser);
      } catch (error) {
        if (active) {
          setAuthError('Unable to finish sign-in. Please refresh and try again.');
          setUser(null);
        }
      }
    }

    loadUser();
    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || user === undefined) {
    return <div className="app-loading">Loading...</div>;
  }

  if (!user) {
    return (
      <AuthPage
        message={authError}
        isSignedIn={isSignedIn}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <DashboardPage
      user={user}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  );
}

export default App;
