import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import Layout from './components/Layout.jsx';
import CoursesPage from './pages/CoursesPage.jsx';
import CoursePage from './pages/CoursePage.jsx';
import InstructorDashboard from './pages/InstructorDashboard.jsx';
import InstructorCourseEditor from './pages/InstructorCourseEditor.jsx';
import CertificatesPage from './pages/CertificatesPage.jsx';
import InstructorQuizEditor from './pages/InstructorQuizEditor.jsx';
import InstructorAnalyticsPage from './pages/InstructorAnalyticsPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/courses" replace />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CoursePage />} />
        <Route path="/certificates" element={<CertificatesPage />} />
        <Route path="/instructor" element={<InstructorDashboard />} />
        <Route path="/instructor/courses/:id" element={<InstructorCourseEditor />} />
        <Route path="/instructor/courses/:id/analytics" element={<InstructorAnalyticsPage />} />
        <Route path="/instructor/courses/:id/quiz" element={<InstructorQuizEditor />} />
      </Route>
      <Route path="*" element={<Navigate to="/courses" replace />} />
    </Routes>
  );
}
