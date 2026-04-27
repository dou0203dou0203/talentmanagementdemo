import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AIProvider } from './context/AIContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EvaluationForm from './pages/EvaluationForm';
import SurveyForm from './pages/SurveyForm';
import SurveyHistory from './pages/SurveyHistory';
import SurveySettings from './pages/SurveySettings';
import StaffDetail from './pages/StaffDetail';
import AptitudeTestForm from './pages/AptitudeTestForm';
import SurveyMobile from './pages/SurveyMobile';
import StaffProfile from './pages/StaffProfile';
import InterviewRecords from './pages/InterviewRecords';
import OrgChart from './pages/OrgChart';
import Analytics from './pages/Analytics';
import EvaluationHistory from './pages/EvaluationHistory';
import Recruitment from './pages/Recruitment';
import StaffingSimulation from './pages/StaffingSimulation';
import DocumentManager from './pages/DocumentManager';
import NewcomerChecklist from './pages/NewcomerChecklist';
import Notifications from './pages/Notifications';
import RetiredStaff from './pages/RetiredStaff';
import AttritionAnalysis from './pages/AttritionAnalysis';
import StaffDataExport from './pages/StaffDataExport';
import SupabaseTest from './pages/SupabaseTest';
import ThanksPoints from './pages/ThanksPoints';
import AdminSetup from './pages/AdminSetup';
import PayrollImport from './pages/PayrollImport';
import PayrollDataEditor from './pages/PayrollDataEditor';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontSize:'1.2rem',color:'#6b7280'}}>⏳ 読み込み中...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function ManagerRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const allowed = ['hr_admin', 'corp_head', 'facility_manager'];
  if (!user || !allowed.includes(user.role)) return <Navigate to="/staff" replace />;
  return <>{children}</>;
}

function HRRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user || user.role !== 'hr_admin') return <Navigate to="/staff" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  const defaultPath = user?.role === 'staff' ? '/staff' : '/';

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={defaultPath} replace /> : <Login />} />
      <Route path="/admin-setup" element={<AdminSetup />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<ManagerRoute><Dashboard /></ManagerRoute>} />
        <Route path="evaluation" element={<ManagerRoute><EvaluationForm /></ManagerRoute>} />
        <Route path="survey/history" element={<ManagerRoute><SurveyHistory /></ManagerRoute>} />
        <Route path="org" element={<ManagerRoute><OrgChart /></ManagerRoute>} />
        <Route path="analytics" element={<ManagerRoute><Analytics /></ManagerRoute>} />
        <Route path="staffing" element={<ManagerRoute><StaffingSimulation /></ManagerRoute>} />
        <Route path="alerts" element={<ManagerRoute><Dashboard /></ManagerRoute>} />
        <Route path="eval-history" element={<HRRoute><EvaluationHistory /></HRRoute>} />
        <Route path="recruitment" element={<HRRoute><Recruitment /></HRRoute>} />
        <Route path="documents" element={<HRRoute><DocumentManager /></HRRoute>} />
        <Route path="payroll-import" element={<HRRoute><PayrollImport /></HRRoute>} />
        <Route path="payroll-editor" element={<HRRoute><PayrollDataEditor /></HRRoute>} />
        <Route path="newcomer-checklist" element={<HRRoute><NewcomerChecklist /></HRRoute>} />
        <Route path="notifications" element={<HRRoute><Notifications /></HRRoute>} />
        <Route path="retired-staff" element={<HRRoute><RetiredStaff /></HRRoute>} />
        <Route path="supabase-test" element={<HRRoute><SupabaseTest /></HRRoute>} />
        <Route path="staff-data" element={<HRRoute><StaffDataExport /></HRRoute>} />
        <Route path="attrition-analysis" element={<HRRoute><AttritionAnalysis /></HRRoute>} />
        <Route path="staff" element={<StaffProfile />} />
        <Route path="staff/:userId" element={<StaffDetail />} />
        <Route path="interviews" element={<InterviewRecords />} />
        <Route path="survey" element={<SurveyForm />} />
        <Route path="survey/settings" element={<SurveySettings />} />
        <Route path="aptitude/test" element={<AptitudeTestForm />} />
        <Route path="thanks" element={<ThanksPoints />} />
      </Route>
      <Route path="/s/:token" element={<SurveyMobile />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <DataProvider>
          <AIProvider>
            <AppRoutes />
          </AIProvider>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;