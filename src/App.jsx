import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { LoadingSpinner } from './components/common/LoadingSpinner';

import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { AcceptInvite } from './pages/AcceptInvite';
import { ChangePassword } from './pages/ChangePassword';
import { EmployeeList } from './pages/employees/EmployeeList';
import { EmployeeDeviceManagement } from './pages/employees/EmployeeDeviceManagement';
import { CompanyList } from './pages/companies/CompanyList';
import { LeadList } from './pages/leads/LeadList';
import { LeadDetail } from './pages/leads/LeadDetail';
import { ExcelUpload } from './pages/leads/ExcelUpload';
import { LeadAllocation } from './pages/leads/LeadAllocation';
import { UnworkedReassignment } from './pages/leads/UnworkedReassignment';
import { CampaignList } from './pages/campaigns/CampaignList';
import { CampaignDetail } from './pages/campaigns/CampaignDetail';
import { CampaignMIS } from './pages/reports/CampaignMIS';
import { LiveCalling } from './pages/calling/LiveCalling';
import { TelecallerAppNotice } from './pages/calling/TelecallerAppNotice';
import { TodayCallbacks } from './pages/followups/TodayCallbacks';
import { DailyCallingMIS } from './pages/reports/DailyCallingMIS';
import { EmployeeMIS } from './pages/reports/EmployeeMIS';
import { TelecallerLeadOverview } from './pages/reports/TelecallerLeadOverview';
import { EmployeeLeadDetail } from './pages/reports/EmployeeLeadDetail';
import { ConsentManagement } from './pages/compliance/ConsentManagement';
import { RolesPermissions } from './pages/settings/RolesPermissions';
import { CallingRules } from './pages/settings/CallingRules';
import { AutomationRules } from './pages/settings/AutomationRules';
import { BranchList } from './pages/employees/BranchList';
import { AttendancePage } from './pages/employees/AttendancePage';
import { AuditLogPage } from './pages/compliance/AuditLogPage';
import { WhatsAppTemplates } from './pages/communication/WhatsAppTemplates';

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
                <CompanyList />
              </ProtectedRoute>
            }
          />

          <Route path="employees" element={<EmployeeList />} />
          <Route path="employees/devices" element={<EmployeeDeviceManagement />} />
          <Route path="branches" element={<BranchList />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="employee-performance" element={<EmployeeMIS />} />

          <Route path="leads" element={<LeadList />} />
          <Route path="leads/upload" element={<ExcelUpload />} />
          <Route path="leads/allocate" element={<LeadAllocation />} />
          <Route path="leads/transfer" element={<LeadAllocation />} />
          <Route path="leads/unworked" element={<UnworkedReassignment />} />
          <Route path="leads/duplicates" element={<LeadList />} />
          <Route path="leads/:id" element={<LeadDetail />} />

          <Route path="live-calling" element={<LiveCalling />} />
          <Route path="autodialer" element={<TelecallerAppNotice />} />
          <Route path="campaigns" element={<CampaignList />} />
          <Route path="campaigns/:id" element={<CampaignDetail />} />
          <Route path="call-history" element={<DailyCallingMIS />} />
          <Route path="dispositions" element={<CallingRules />} />
          <Route path="retry-config" element={<CallingRules />} />
          <Route path="message-templates" element={<WhatsAppTemplates />} />

          <Route path="callbacks/today" element={<TodayCallbacks />} />
          <Route path="callbacks/overdue" element={<TodayCallbacks />} />
          <Route path="followup-mis" element={<DailyCallingMIS />} />

          <Route path="reports/daily" element={<DailyCallingMIS />} />
          <Route path="reports/employee" element={<EmployeeMIS />} />
          <Route path="reports/employee/:userId" element={<EmployeeLeadDetail />} />
          <Route path="reports/telecaller-overview" element={<TelecallerLeadOverview />} />
          <Route path="reports/campaign" element={<CampaignMIS />} />
          <Route path="reports/branch" element={<DailyCallingMIS />} />
          <Route path="reports/analytics" element={<Dashboard />} />

          <Route path="compliance/consent" element={<ConsentManagement />} />
          <Route path="compliance/dnd" element={<ConsentManagement />} />
          <Route path="compliance/access-logs" element={<AuditLogPage />} />
          <Route path="compliance/audit" element={<AuditLogPage />} />

          <Route path="settings/roles" element={<RolesPermissions />} />
          <Route path="settings/calling-rules" element={<CallingRules />} />
          <Route path="settings/automation" element={<AutomationRules />} />
          <Route path="settings/notifications" element={<AutomationRules />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
