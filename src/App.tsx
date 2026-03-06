import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EvaluationForm from './pages/EvaluationForm';
import SurveyForm from './pages/SurveyForm';
import SurveyHistory from './pages/SurveyHistory';
import SurveyMobile from './pages/SurveyMobile';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Login */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />

      {/* Admin Layout (protected) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="evaluation" element={<EvaluationForm />} />
        <Route path="survey" element={<SurveyForm />} />
        <Route path="survey/history" element={<SurveyHistory />} />
        <Route path="staffing" element={<Dashboard />} />
        <Route path="alerts" element={<Dashboard />} />
      </Route>

      {/* Mobile Survey (no auth needed) */}
      <Route path="/s/:token" element={<SurveyMobile />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter basename="/talentmanagementdemo">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
