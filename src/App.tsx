import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import EvaluationForm from './pages/EvaluationForm';
import SurveyForm from './pages/SurveyForm';
import SurveyHistory from './pages/SurveyHistory';
import SurveySettings from './pages/SurveySettings';
import SurveyMobile from './pages/SurveyMobile';

function App() {
  return (
    <BrowserRouter basename="/talentmanagementdemo">
      <Routes>
        {/* Admin Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="evaluation" element={<EvaluationForm />} />
          <Route path="survey" element={<SurveyForm />} />
          <Route path="survey/history" element={<SurveyHistory />} />
          <Route path="survey/settings" element={<SurveySettings />} />
          <Route path="staffing" element={<Dashboard />} />
          <Route path="alerts" element={<Dashboard />} />
        </Route>

        {/* Mobile Survey (no sidebar, standalone) */}
        <Route path="/s/:token" element={<SurveyMobile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
