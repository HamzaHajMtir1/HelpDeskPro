import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
// ── Pages publiques ──
import Login          from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import VerifyCode     from './pages/VerifyCode';
import ResetPassword  from './pages/ResetPassword';
import ChangePassword from './pages/ChangePassword';
import AllNotificationsPage from './pages/AllNotificationsPage';



// ── Pages Admin ──
import AdminDashboard    from './pages/Admin/AdminDashboard';
import AdminUsers        from './pages/Admin/AdminUsers';
import AdminProfile      from './pages/Admin/AdminProfile';
import AdminTicketDetail from './pages/Admin/AdminTicketDetail';
import AdminTickets      from './pages/Admin/AdminTickets';
import AdminReports      from './pages/Admin/AdminReports';
import AdminParametres   from './pages/Admin/AdminParametres';
import AdminSla          from './pages/Admin/AdminSla';
import AdminKnowledge    from './pages/Admin/AdminKnowledge';
import AdminCreateTicket from './pages/Admin/AdminCreateTicket';  // ← NOUVEAU
import KnowledgePage     from './pages/Client/KnowledgePage';
import AccountRequestsPage from './pages/Admin/AccountRequestsPage';

// ── Pages Client ──
import ClientDashboard    from './pages/Client/ClientDashboard';
import CreateTicket       from './pages/Client/CreateTicket';
import MyTickets          from './pages/Client/MyTickets';
import ClientTicketDetail from './pages/Client/ClientTicketDetail';
import ClientProfile      from './pages/Client/ClientProfile';
import  {LandingPage} from './pages/LandingPage';
import ClientStats from './pages/Client/ClientStats';

// ── Pages Technicien ──
import TechDashboard    from './pages/Technicien/TechDashboard';
import TechProfile      from './pages/Technicien/TechProfile';
import TechTickets      from './pages/Technicien/TechTickets';
import TechTicketDetail from './pages/Technicien/TechTicketDetail';
import TechCreateTicket from './pages/Technicien/TechCreateTickets';
import TechKnowledgePage from './pages/Technicien/TechKnowledgePage';

// ════════════════════════════════════════════
// Guards de routes
// ════════════════════════════════════════════
function PrivateRoute({ children }) {
  return localStorage.getItem('token')
    ? children
    : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const role = localStorage.getItem('role');
  return localStorage.getItem('token') && role === 'ADMIN'
    ? children
    : <Navigate to="/login" />;
}

function ClientRoute({ children }) {
  const role = localStorage.getItem('role');
  return localStorage.getItem('token') && role === 'CLIENT'
    ? children
    : <Navigate to="/login" />;
}

function TechnicienRoute({ children }) {
  const role = localStorage.getItem('role');
  return localStorage.getItem('token') && role === 'TECHNICIEN'
    ? children
    : <Navigate to="/login" />;
}

// ════════════════════════════════════════════
// Redirection selon le rôle
// ════════════════════════════════════════════
function RoleRedirect() {
  const role  = localStorage.getItem('role');
  const token = localStorage.getItem('token');
  if (!token)                return <Navigate to="/login" />;
  if (role === 'ADMIN')      return <Navigate to="/admin" />;
  if (role === 'TECHNICIEN') return <Navigate to="/dashboardTech" />;
  if (role === 'CLIENT')     return <Navigate to="/dashboard" />;
  return <Navigate to="/login" />;
}

// ════════════════════════════════════════════
// App
// ════════════════════════════════════════════
export default function App() {
  return (
    <BrowserRouter>
    <SettingsProvider>
      <Routes>

        {/* ── Routes publiques ── */}
        <Route path="/" element={<LandingPage onGetStarted={() => window.location.href = '/login'} />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-code"     element={<VerifyCode />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
        

        {/* ── Redirection racine ── */}
        <Route path="/" element={<RoleRedirect />} />

        {/* ── Routes Admin ── */}
        <Route path="/admin"                element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/new"            element={<AdminRoute><AdminCreateTicket /></AdminRoute>} />  {/* ← NOUVEAU */}
        <Route path="/admin/tickets"        element={<AdminRoute><AdminTickets /></AdminRoute>} />
        <Route path="/admin/tickets/:id"    element={<AdminRoute><AdminTicketDetail /></AdminRoute>} />
        <Route path="/admin/users"          element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/reports"        element={<AdminRoute><AdminReports /></AdminRoute>} />
        <Route path="/admin/sla"            element={<AdminRoute><AdminSla /></AdminRoute>} />
        <Route path="/admin/parametres"     element={<AdminRoute><AdminParametres /></AdminRoute>} />
        <Route path="/admin/profile"        element={<AdminRoute><AdminProfile /></AdminRoute>} />
        <Route path="/admin/adminknowledge" element={<AdminRoute><AdminKnowledge /></AdminRoute>} />
        <Route path="/admin/account-requests" element={<AdminRoute><AccountRequestsPage /></AdminRoute>} />

        {/* ── Routes Client ── */}
        <Route path="/dashboard"   element={<ClientRoute><ClientDashboard /></ClientRoute>} />
        <Route path="/tickets/new" element={<ClientRoute><CreateTicket /></ClientRoute>} />
        <Route path="/tickets/:id" element={<ClientRoute><ClientTicketDetail /></ClientRoute>} />
        <Route path="/tickets"     element={<ClientRoute><MyTickets /></ClientRoute>} />
        <Route path="/profile"     element={<ClientRoute><ClientProfile /></ClientRoute>} />
        <Route path="/knowledge"   element={<ClientRoute><KnowledgePage /></ClientRoute>} />
        <Route path="/client/stats" element={<ClientStats />} />

        {/* ── Routes Technicien ── */}
        <Route path="/dashboardTech"    element={<TechnicienRoute><TechDashboard /></TechnicienRoute>} />
        <Route path="/tech/tickets/new" element={<TechnicienRoute><TechCreateTicket /></TechnicienRoute>} />
        <Route path="/tech/tickets/:id" element={<TechnicienRoute><TechTicketDetail /></TechnicienRoute>} />
        <Route path="/tech/tickets"     element={<TechnicienRoute><TechTickets /></TechnicienRoute>} />
        <Route path="/tech/profile"     element={<TechnicienRoute><TechProfile /></TechnicienRoute>} />
        <Route path="/tech/knowledge"   element={<TechnicienRoute><TechKnowledgePage /></TechnicienRoute>} />

        {/* ── Fallback ── */}
        <Route path="*" element={<RoleRedirect />} />
        // Dans tes routes :
<Route path="/notifications"           element={<AllNotificationsPage />} />
<Route path="/tech/notifications"      element={<AllNotificationsPage />} />
<Route path="/admin/notifications"     element={<AllNotificationsPage />} />

      </Routes>
      </SettingsProvider>
    </BrowserRouter>
  );
}
