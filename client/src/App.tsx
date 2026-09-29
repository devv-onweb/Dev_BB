import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import Navbar from './components/Navbar.js';
import Footer from './components/Footer.js';
import ProtectedRoute from './components/ProtectedRoute.js';
import ChatbotWidget from './components/ChatbotWidget.js';

// Layouts
import UserLayout from './components/user/UserLayout.js';

// Auth Pages
import PatientLogin from './pages/PatientLogin.js';
import StaffLogin from './pages/StaffLogin.js';
import Login from './pages/Login.js';
import Register from './pages/Register.js';
import UserRegister from './pages/UserRegister.js';

// Existing Dashboards
import AdminDashboard from './pages/AdminDashboard.js';
import DonorDashboard from './pages/DonorDashboard.js';
import PatientDashboard from './pages/PatientDashboard.js';
import EmergencyCommandCenter from './pages/EmergencyCommandCenter.js';
import NotFound from './pages/NotFound.js';

// 5 New USER/Patient Role Feature Pages
import UserDashboard from './pages/user/UserDashboard.js';
import UserOrderBlood from './pages/user/UserOrderBlood.js';
import UserReports from './pages/user/UserReports.js';
import UserDoctors from './pages/user/UserDoctors.js';
import UserNotifications from './pages/user/UserNotifications.js';
import UserProfilePage from './pages/user/UserProfilePage.js';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isCommandCenter = location.pathname === '/command-center' || location.pathname === '/emergency';

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-850 dark:text-slate-100 transition-colors duration-200">
      {/* Navigation Bar */}
      <Navbar />

      {/* Main Content Viewport */}
      <main className="flex-1">
        <Routes>
          {/* Emergency Command Center (Open / Direct Telemetry Access) */}
          <Route path="/command-center" element={<EmergencyCommandCenter />} />
          <Route path="/emergency" element={<EmergencyCommandCenter />} />

          {/* Root Route: Patient Login Entry Point */}
          <Route path="/" element={<PatientLogin />} />
          <Route path="/login" element={<PatientLogin />} />
          <Route path="/user/login" element={<PatientLogin />} />

          {/* Staff & Clinical Access Portal (Old Multi-Tab Login: Hospital | Admin | Donor) */}
          <Route path="/staff-login" element={<StaffLogin />} />

          {/* Registrations */}
          <Route path="/register" element={<Register />} />
          <Route path="/user/register" element={<UserRegister />} />
          <Route path="/patient/register" element={<UserRegister />} />

          {/* Dedicated USER & PATIENT Role Features (Phase 9 + Patient Requisitions) */}
          <Route element={<ProtectedRoute allowedRoles={['USER', 'PATIENT', 'ADMIN', 'HOSPITAL']} />}>
            <Route path="/user" element={<UserLayout />}>
              <Route path="dashboard" element={<UserDashboard />} />
              <Route path="order-blood" element={<UserOrderBlood />} />
              <Route path="reports" element={<UserReports />} />
              <Route path="doctors" element={<UserDoctors />} />
              <Route path="notifications" element={<UserNotifications />} />
              <Route path="profile" element={<UserProfilePage />} />
            </Route>
            {/* Alias /patient/* to user layout */}
            <Route path="/patient" element={<UserLayout />}>
              <Route path="dashboard" element={<UserDashboard />} />
              <Route path="order-blood" element={<UserOrderBlood />} />
              <Route path="reports" element={<UserReports />} />
              <Route path="doctors" element={<UserDoctors />} />
              <Route path="notifications" element={<UserNotifications />} />
              <Route path="profile" element={<UserProfilePage />} />
            </Route>
          </Route>

          {/* Existing Role-Protected Dashboards */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'HOSPITAL']} />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
            <Route path="/hospital/*" element={<AdminDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['DONOR', 'ADMIN']} />}>
            <Route path="/donor-dashboard" element={<DonorDashboard />} />
            <Route path="/donor/*" element={<DonorDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['PATIENT', 'USER', 'ADMIN']} />}>
            <Route path="/patient-dashboard" element={<PatientDashboard />} />
          </Route>

          {/* Fallback 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Global Academic & Organization Footer */}
      {!isCommandCenter && <Footer />}

      {/* Global Role-Aware AI Chatbot Widget */}
      <ChatbotWidget />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
