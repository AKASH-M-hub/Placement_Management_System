import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import StudentJobReviewPage from './pages/StudentJobReviewPage';
import StudentCalendarPage from './pages/StudentCalendarPage';
import StudentInterviewsPage from './pages/StudentInterviewsPage';
import StudentOffersPage from './pages/StudentOffersPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminInterviewsPage from './pages/AdminInterviewsPage';
import AdminOffersPage from './pages/AdminOffersPage';
import { getToken, isAdmin, isStudent } from './lib/auth';

const StudentRoute = ({ children }) => {
  if (!getToken() || !isStudent()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  if (!getToken() || !isAdmin()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/student-dashboard"
        element={(
          <StudentRoute>
            <StudentDashboardPage />
          </StudentRoute>
        )}
      />
      <Route
        path="/student-review/:jobId"
        element={(
          <StudentRoute>
            <StudentJobReviewPage />
          </StudentRoute>
        )}
      />
      <Route
        path="/student-calendar"
        element={(
          <StudentRoute>
            <StudentCalendarPage />
          </StudentRoute>
        )}
      />
      <Route
        path="/student-interviews"
        element={(
          <StudentRoute>
            <StudentInterviewsPage />
          </StudentRoute>
        )}
      />
      <Route
        path="/student-offers"
        element={(
          <StudentRoute>
            <StudentOffersPage />
          </StudentRoute>
        )}
      />
      <Route
        path="/admin-dashboard"
        element={(
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        )}
      />
      <Route
        path="/admin-analytics"
        element={(
          <AdminRoute>
            <AdminAnalyticsPage />
          </AdminRoute>
        )}
      />
      <Route
        path="/admin-interviews"
        element={(
          <AdminRoute>
            <AdminInterviewsPage />
          </AdminRoute>
        )}
      />
      <Route
        path="/admin-offers"
        element={(
          <AdminRoute>
            <AdminOffersPage />
          </AdminRoute>
        )}
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
