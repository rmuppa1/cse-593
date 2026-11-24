import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout/Layout.jsx';
import ProtectedRoute from './components/UI/ProtectedRoute.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminReview from './pages/AdminReview.jsx';
import Events from './pages/Events.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import MyRequests from './pages/MyRequests.jsx';
import NotFound from './pages/NotFound.jsx';
import ReportIssue from './pages/ReportIssue.jsx';

export default function App() {
  return <Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="events" element={<Events />} />
      <Route path="report" element={<ProtectedRoute roles={['CITIZEN']}><ReportIssue /></ProtectedRoute>} />
      <Route path="requests" element={<ProtectedRoute roles={['CITIZEN']}><MyRequests /></ProtectedRoute>} />
      <Route path="admin" element={<ProtectedRoute roles={['ADMIN', 'MANAGER']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="admin/review" element={<ProtectedRoute roles={['ADMIN']}><AdminReview /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>;
}
