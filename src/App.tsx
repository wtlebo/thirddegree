import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GamePage } from './pages/GamePage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import './index.css';

function App() {
  const location = useLocation();
  console.log("Current Path:", location.pathname);

  // Auto-refresh on new day to ensure fresh content
  useEffect(() => {
    const checkNewDay = () => {
      const lastVisit = localStorage.getItem('last_visit_date');
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

      if (lastVisit && lastVisit !== today) {
        // It's a new day and we have a previous visit recorded.
        // Force a reload to ensure we fetch the latest index.html/bundles
        console.log("New day detected, refreshing...");
        localStorage.setItem('last_visit_date', today);

        // Use window.location.reload(true) to force cache bypass if supported,
        // or just reload. Appending a timestamp query param helps bust cache too.
        const url = new URL(window.location.href);
        url.searchParams.set('t', Date.now().toString());
        window.location.href = url.toString();
        return;
      }

      // Update visit date if not set or if it was just updated above
      localStorage.setItem('last_visit_date', today);
    };

    checkNewDay();

    // Also check when tab becomes visible (e.g. user left tab open overnight)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkNewDay();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <Routes>
      <Route path="/" element={<GamePage />} />
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminPage />
        </ProtectedRoute>
      } />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
