import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { LoadingSpinner } from './components/common/LoadingSpinner';

import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { AcceptInvite } from './pages/AcceptInvite';
import { ChangePassword } from './pages/ChangePassword';
import { LeadList } from './pages/leads/LeadList';

const EmployeeList = lazy(() =>
  import('./pages/employees/EmployeeList').then((m) => ({ default: m.EmployeeList })),
);
const EmployeeDeviceManagement = lazy(() =>
  import('./pages/employees/EmployeeDeviceManagement').then((m) => ({
    default: m.EmployeeDeviceManagement,
  })),
);
const CompanyList = lazy(() =>
  import('./pages/companies/CompanyList').then((m) => ({ default: m.CompanyList })),
);
const LeadDetail = lazy(() =>
  import('./pages/leads/LeadDetail').then((m) => ({ default: m.LeadDetail })),
);
const ExcelUpload = lazy(() =>
  import('./pages/leads/ExcelUpload').then((m) => ({ default: m.ExcelUpload })),
);
const LeadAllocation = lazy(() =>
  import('./pages/leads/LeadAllocation').then((m) => ({ default: m.LeadAllocation })),
);
const UnworkedReassignment = lazy(() =>
  import('./pages/leads/UnworkedReassignment').then((m) => ({ default: m.UnworkedReassignment })),
);
const CampaignList = lazy(() =>
  import('./pages/campaigns/CampaignList').then((m) => ({ default: m.CampaignList })),
);
const CampaignDetail = lazy(() =>
  import('./pages/campaigns/CampaignDetail').then((m) => ({ default: m.CampaignDetail })),
);
const CampaignMIS = lazy(() =>
  import('./pages/reports/CampaignMIS').then((m) => ({ default: m.CampaignMIS })),
);
const LiveCalling = lazy(() =>
  import('./pages/calling/LiveCalling').then((m) => ({ default: m.LiveCalling })),
);
const TelecallerAppNotice = lazy(() =>
  import('./pages/calling/TelecallerAppNotice').then((m) => ({ default: m.TelecallerAppNotice })),
);
const TodayCallbacks = lazy(() =>
  import('./pages/followups/TodayCallbacks').then((m) => ({ default: m.TodayCallbacks })),
);
const DailyCallingMIS = lazy(() =>
  import('./pages/reports/DailyCallingMIS').then((m) => ({ default: m.DailyCallingMIS })),
);
const EmployeeMIS = lazy(() =>
  import('./pages/reports/EmployeeMIS').then((m) => ({ default: m.EmployeeMIS })),
);
const TelecallerLeadOverview = lazy(() =>
  import('./pages/reports/TelecallerLeadOverview').then((m) => ({
    default: m.TelecallerLeadOverview,
  })),
);
const EmployeeLeadDetail = lazy(() =>
  import('./pages/reports/EmployeeLeadDetail').then((m) => ({ default: m.EmployeeLeadDetail })),
);
const ConsentManagement = lazy(() =>
  import('./pages/compliance/ConsentManagement').then((m) => ({ default: m.ConsentManagement })),
);
const RolesPermissions = lazy(() =>
  import('./pages/settings/RolesPermissions').then((m) => ({ default: m.RolesPermissions })),
);
const CallingRules = lazy(() =>
  import('./pages/settings/CallingRules').then((m) => ({ default: m.CallingRules })),
);
const AutomationRules = lazy(() =>
  import('./pages/settings/AutomationRules').then((m) => ({ default: m.AutomationRules })),
);
const BranchList = lazy(() =>
  import('./pages/employees/BranchList').then((m) => ({ default: m.BranchList })),
);
const AttendancePage = lazy(() =>
  import('./pages/employees/AttendancePage').then((m) => ({ default: m.AttendancePage })),
);
const AuditLogPage = lazy(() =>
  import('./pages/compliance/AuditLogPage').then((m) => ({ default: m.AuditLogPage })),
);
const WhatsAppTemplates = lazy(() =>
  import('./pages/communication/WhatsAppTemplates').then((m) => ({
    default: m.WhatsAppTemplates,
  })),
);

const ProtectedRoute = ({ children, permission }) => {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const ChangePasswordRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.mustChangePassword) return <Navigate to="/dashboard" replace />;
  return <ChangePassword />;
};

const LazyPage = ({ children }) => (
  <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
);

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />
        <Route path="/change-password" element={<ChangePasswordRoute />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          <Route
            path="companies"
            element={
              <ProtectedRoute permission="manage_companies">
                <LazyPage>
                  <CompanyList />
                </LazyPage>
              </ProtectedRoute>
            }
          />

          <Route
            path="employees"
            element={
              <LazyPage>
                <EmployeeList />
              </LazyPage>
            }
          />
          <Route
            path="employees/devices"
            element={
              <LazyPage>
                <EmployeeDeviceManagement />
              </LazyPage>
            }
          />
          <Route
            path="branches"
            element={
              <LazyPage>
                <BranchList />
              </LazyPage>
            }
          />
          <Route
            path="attendance"
            element={
              <LazyPage>
                <AttendancePage />
              </LazyPage>
            }
          />
          <Route
            path="employee-performance"
            element={
              <LazyPage>
                <EmployeeMIS />
              </LazyPage>
            }
          />

          <Route path="leads" element={<LeadList />} />
          <Route
            path="leads/upload"
            element={
              <LazyPage>
                <ExcelUpload />
              </LazyPage>
            }
          />
          <Route
            path="leads/allocate"
            element={
              <LazyPage>
                <LeadAllocation />
              </LazyPage>
            }
          />
          <Route
            path="leads/transfer"
            element={
              <LazyPage>
                <LeadAllocation />
              </LazyPage>
            }
          />
          <Route
            path="leads/unworked"
            element={
              <LazyPage>
                <UnworkedReassignment />
              </LazyPage>
            }
          />
          <Route path="leads/duplicates" element={<LeadList />} />
          <Route
            path="leads/:id"
            element={
              <LazyPage>
                <LeadDetail />
              </LazyPage>
            }
          />

          <Route
            path="live-calling"
            element={
              <LazyPage>
                <LiveCalling />
              </LazyPage>
            }
          />
          <Route
            path="autodialer"
            element={
              <LazyPage>
                <TelecallerAppNotice />
              </LazyPage>
            }
          />
          <Route
            path="campaigns"
            element={
              <LazyPage>
                <CampaignList />
              </LazyPage>
            }
          />
          <Route
            path="campaigns/:id"
            element={
              <LazyPage>
                <CampaignDetail />
              </LazyPage>
            }
          />
          <Route
            path="call-history"
            element={
              <LazyPage>
                <DailyCallingMIS />
              </LazyPage>
            }
          />
          <Route
            path="dispositions"
            element={
              <LazyPage>
                <CallingRules />
              </LazyPage>
            }
          />
          <Route
            path="retry-config"
            element={
              <LazyPage>
                <CallingRules />
              </LazyPage>
            }
          />
          <Route
            path="message-templates"
            element={
              <LazyPage>
                <WhatsAppTemplates />
              </LazyPage>
            }
          />

          <Route
            path="callbacks/today"
            element={
              <LazyPage>
                <TodayCallbacks />
              </LazyPage>
            }
          />
          <Route
            path="callbacks/overdue"
            element={
              <LazyPage>
                <TodayCallbacks />
              </LazyPage>
            }
          />
          <Route
            path="followup-mis"
            element={
              <LazyPage>
                <DailyCallingMIS />
              </LazyPage>
            }
          />

          <Route
            path="reports/daily"
            element={
              <LazyPage>
                <DailyCallingMIS />
              </LazyPage>
            }
          />
          <Route
            path="reports/employee"
            element={
              <LazyPage>
                <EmployeeMIS />
              </LazyPage>
            }
          />
          <Route
            path="reports/employee/:userId"
            element={
              <LazyPage>
                <EmployeeLeadDetail />
              </LazyPage>
            }
          />
          <Route
            path="reports/telecaller-overview"
            element={
              <LazyPage>
                <TelecallerLeadOverview />
              </LazyPage>
            }
          />
          <Route
            path="reports/campaign"
            element={
              <LazyPage>
                <CampaignMIS />
              </LazyPage>
            }
          />
          <Route
            path="reports/branch"
            element={
              <LazyPage>
                <DailyCallingMIS />
              </LazyPage>
            }
          />
          <Route path="reports/analytics" element={<Dashboard />} />

          <Route
            path="compliance/consent"
            element={
              <LazyPage>
                <ConsentManagement />
              </LazyPage>
            }
          />
          <Route
            path="compliance/dnd"
            element={
              <LazyPage>
                <ConsentManagement />
              </LazyPage>
            }
          />
          <Route
            path="compliance/access-logs"
            element={
              <LazyPage>
                <AuditLogPage />
              </LazyPage>
            }
          />
          <Route
            path="compliance/audit"
            element={
              <LazyPage>
                <AuditLogPage />
              </LazyPage>
            }
          />

          <Route
            path="settings/roles"
            element={
              <LazyPage>
                <RolesPermissions />
              </LazyPage>
            }
          />
          <Route
            path="settings/calling-rules"
            element={
              <LazyPage>
                <CallingRules />
              </LazyPage>
            }
          />
          <Route
            path="settings/automation"
            element={
              <LazyPage>
                <AutomationRules />
              </LazyPage>
            }
          />
          <Route
            path="settings/notifications"
            element={
              <LazyPage>
                <AutomationRules />
              </LazyPage>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
