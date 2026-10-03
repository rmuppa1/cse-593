import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import Home from './pages/Home';
import Events from './pages/Events';
import ReportIssue from './pages/ReportIssue';
import MyRequests from './pages/MyRequests';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/login" element={<Login />} />
        <Route path="/report" element={<ProtectedRoute roles={['CITIZEN', 'ADMIN']}><ReportIssue /></ProtectedRoute>} />
        <Route path="/my-requests" element={<ProtectedRoute roles={['CITIZEN']}><MyRequests /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['ADMIN', 'MANAGER']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="*" element={<p className="py-12 text-center text-slate-500">Page not found.</p>} />
      </Route>
    </Routes>
  );
}
