import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { SymptomChecker } from './pages/SymptomChecker';
import { MedicalRecords } from './pages/MedicalRecords';
import { History } from './pages/History';
import { Experts } from './pages/Experts';
import { Dashboard } from './pages/Dashboard';
import { MyAppointments } from './pages/MyAppointments';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading your health profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("[PROTECTED ROUTE] User not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  console.log("[PROTECTED ROUTE] User authenticated, rendering route", {
    uid: user.uid,
    email: user.email
  });
  return <Layout>{children}</Layout>;
}

import { ErrorBoundary } from './components/ErrorBoundary';
import { LocationProvider } from './hooks/useLocation';
import { ThemeProvider } from './hooks/useTheme';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <LocationProvider>
            <Router>
              <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <SymptomChecker />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/records"
              element={
                <ProtectedRoute>
                  <MedicalRecords />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/experts"
              element={
                <ProtectedRoute>
                  <Experts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <ProtectedRoute>
                  <MyAppointments />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </LocationProvider>
    </ThemeProvider>
  </AuthProvider>
</ErrorBoundary>
  );
}
