import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EvaluationForm from './pages/EvaluationForm';
import SurveyForm from './pages/SurveyForm';
import SurveyHistory from './pages/SurveyHistory';
import SurveyMobile from './pages/SurveyMobile';
import StaffProfile from './pages/StaffProfile';
import InterviewRecords from './pages/InterviewRecords';
import OrgChart from './pages/OrgChart';
import Analytics from './pages/Analytics';
import EvaluationHistory from './pages/EvaluationHistory';
import Recruitment from './pages/Recruitment';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />

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
        <Route path="staff" element={<StaffProfile />} />
        <Route path="interviews" element={<InterviewRecords />} />
        <Route path="org" element={<OrgChart />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="eval-history" element={<EvaluationHistory />} />
        <Route path="recruitment" element={<Recruitment />} />
        <Route path="staffing" element={<Dashboard />} />
        <Route path="alerts" element={<Dashboard />} />
      </Route>

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
