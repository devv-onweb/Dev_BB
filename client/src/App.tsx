import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.js';
import Navbar from './components/Navbar.js';
import Footer from './components/Footer.js';
import ProtectedRoute from './components/ProtectedRoute.js';

// Pages
import Login from './pages/Login.js';
import Register from './pages/Register.js';
import AdminDashboard from './pages/AdminDashboard.js';
import DonorDashboard from './pages/DonorDashboard.js';
import PatientDashboard from './pages/PatientDashboard.js';
import EmergencyCommandCenter from './pages/EmergencyCommandCenter.js';
import NotFound from './pages/NotFound.js';

// Dynamic root redirect based on logged in user's role
const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'ADMIN':
      return <Navigate to="/admin-dashboard" replace />;
    case 'DONOR':
      return <Navigate to="/donor-dashboard" replace />;
    case 'PATIENT':
      return <Navigate to="/patient-dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export const App: React.FC = () => {
  const location = useLocation();
  const isCommandCenter = location.pathname === '/command-center' || location.pathname === '/emergency';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Navigation Bar */}
      <Navbar />

      {/* Main Content Viewport */}
      <main className="flex-1">
        <Routes>
          {/* Emergency Command Center (Open / Direct Telemetry Access) */}
          <Route path="/command-center" element={<EmergencyCommandCenter />} />
          <Route path="/emergency" element={<EmergencyCommandCenter />} />

          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Role-Protected Dashboards */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['DONOR', 'ADMIN']} />}>
            <Route path="/donor-dashboard" element={<DonorDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['PATIENT', 'ADMIN']} />}>
            <Route path="/patient-dashboard" element={<PatientDashboard />} />
          </Route>

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Fallback 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Global Academic & Organization Footer */}
      {!isCommandCenter && <Footer />}
    </div>
  );
};

export default App;
