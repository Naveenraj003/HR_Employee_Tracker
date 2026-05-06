import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProtectedRoute } from './components/ProtectedRoute';
import apiClient from './api/apiClient';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        await apiClient.getCurrentUser();
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    const handleAuthChanged = () => {
      void checkAuth();
    };

    void checkAuth();
    window.addEventListener('auth-changed', handleAuthChanged);

    return () => {
      window.removeEventListener('auth-changed', handleAuthChanged);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const timeoutSeconds = Number(import.meta.env.VITE_SESSION_TIMEOUT || 1800);
    let timeoutId: number;

    const forceLogout = async () => {
      try {
        await apiClient.logout();
      } catch {
        // Ignore network errors during forced timeout logout.
      } finally {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setIsAuthenticated(false);
        window.location.replace('/login');
      }
    };

    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        void forceLogout();
      }, timeoutSeconds * 1000);
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      'click',
      'keydown',
      'mousemove',
      'scroll',
      'touchstart',
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetTimer);
    });

    resetTimer();

    return () => {
      window.clearTimeout(timeoutId);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetTimer);
      });
    };
  }, [isAuthenticated]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
