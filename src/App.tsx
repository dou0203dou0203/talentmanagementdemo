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
import StaffingSimulation from './pages/StaffingSimulation';
import DocumentManager from './pages/DocumentManager';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Routes requiring manager or above
function ManagerRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const allowed = ['hr_admin', 'corp_head', 'facility_manager'];
  if (!user || !allowed.includes(user.role)) return <Navigate to="/staff" replace />;
  return <>{children}</>;
}

// Routes requiring HR admin only
function HRRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user || user.role !== 'hr_admin') return <Navigate to="/staff" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  // Staff default landing = /staff, others = /
  const defaultPath = user?.role === 'staff' ? '/staff' : '/';

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={defaultPath} replace /> : <Login />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Manager+ pages */}
        <Route index element={<ManagerRoute><Dashboard /></ManagerRoute>} />
        <Route path="evaluation" element={<ManagerRoute><EvaluationForm /></ManagerRoute>} />
        <Route path="survey/history" element={<ManagerRoute><SurveyHistory /></ManagerRoute>} />
        <Route path="org" element={<ManagerRoute><OrgChart /></ManagerRoute>} />
        <Route path="analytics" element={<ManagerRoute><Analytics /></ManagerRoute>} />
        <Route path="staffing" element={<ManagerRoute><StaffingSimulation /></ManagerRoute>} />
        <Route path="alerts" element={<ManagerRoute><Dashboard /></ManagerRoute>} />

        {/* HR admin only */}
        <Route path="eval-history" element={<HRRoute><EvaluationHistory /></HRRoute>} />
        <Route path="recruitment" element={<HRRoute><Recruitment /></HRRoute>} />
        <Route path="documents" element={<HRRoute><DocumentManager /></HRRoute>} />

        {/* All authenticated users */}
        <Route path="staff" element={<StaffProfile />} />
        <Route path="interviews" element={<InterviewRecords />} />
        <Route path="survey" element={<SurveyForm />} />
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
