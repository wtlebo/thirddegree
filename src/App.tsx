import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GamePage } from './pages/GamePage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import './index.css';

function App() {
  const location = useLocation();
  console.log("Current Path:", location.pathname);

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
