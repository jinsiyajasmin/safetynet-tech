import Home from './pages/Home'
import { Routes, Route } from "react-router-dom";
import SignupPage from "./pages/Signup";
import Client from "./pages/Clients";
import ErrorBoundary from './components/ErrorBoundary';
import UsersPage from './pages/Users';
import LoginPage from './pages/Login';
import RequireAuth from './components/RequireAuth';
import ClientsPage from './pages/Clients';
import EnableUserAccessPage from './pages/EnableUserAccess';
import FormBuilderPage from './pages/FormBuilderPage';
import UserClients from './pages/UserClients';
import ViewForms from './pages/ViewForms';
import ViewSingleForm from './pages/ViewSingleForm';
import UseForm from './pages/UseForm';

import ProfilePage from './pages/ProfilePage';
import AccountSettings from './pages/AccountSettings';

import ResetPassword from "./pages/ResetPassword";
import Setup2FA from "./pages/Setup2FA";

import GenericReportPage from './pages/GenericReportPage';


import CreateSitesPage from './pages/CreateSitesPage';
import SitepackManagement from './pages/SitepackManagement';
import ConcernReportDashboard from './pages/ConcernReportDashboard';
import AuditReportDashboard from './pages/AuditReportDashboard';
import GeneralFormsList from './pages/GeneralFormsList';
import ToolBoxTalkForm from './pages/ToolBoxTalkForm';
import RamsBriefingForm from './pages/RamsBriefingForm';
import SiteInductionForm from './pages/SiteInductionForm';
import ManagementSiteInspectionForm from './pages/ManagementSiteInspectionForm';
import DailySafeStartBriefingForm from './pages/DailySafeStartBriefingForm';
import AuditActionForm from './pages/AuditActionForm';
import SiteInductionRecordForm from './pages/SiteInductionRecordForm';
import LolerInspectionForm from './pages/LolerInspectionForm';
import PuwerInspectionForm from './pages/PuwerInspectionForm';


import { ThemeProvider } from './context/ThemeContext';

function App() {

  return (
    <ThemeProvider>
      <ErrorBoundary>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/clients" element={<Client />} />

          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/setup-2fa" element={<Setup2FA />} />

          <Route path="/users" element={<UsersPage />} />
          <Route path="/clients/:id/users" element={<UsersPage />} />
          <Route path="/clients" element={
            <RequireAuth><ClientsPage /></RequireAuth>
          } />

          <Route path="/enable-user" element={<EnableUserAccessPage />} />
          <Route path="/form-build" element={<FormBuilderPage />} />
          <Route path="/company" element={<UserClients />} />
          <Route
            path="/forms"
            element={

              <ViewForms />

            }
          />


          <Route
            path="/forms/:id"
            element={
              <RequireAuth>
                <ViewSingleForm />
              </RequireAuth>
            }
          />

          <Route path="/forms/:id/use" element={<UseForm />} />
          <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/account-settings" element={<RequireAuth><AccountSettings /></RequireAuth>} />

          {/* Report Routes */}
          <Route path="/report-health-safety" element={<RequireAuth><GenericReportPage pageTitle="Health & Safety concern" /></RequireAuth>} />
          <Route path="/report-environmental" element={<RequireAuth><GenericReportPage pageTitle="Sustainability concern" /></RequireAuth>} />
          <Route path="/report-quality" element={<RequireAuth><GenericReportPage pageTitle="Quality concern" /></RequireAuth>} />
          <Route path="/report-positive" element={<RequireAuth><GenericReportPage pageTitle="Positive observation" /></RequireAuth>} />
          <Route path="/concern-positive-report" element={<RequireAuth><GenericReportPage pageTitle="Concern and positive feedback report" /></RequireAuth>} />

          <Route path="/weekly-supervisor" element={<RequireAuth><GenericReportPage pageTitle="Weekly supervisor health & safety inspection" /></RequireAuth>} />
          <Route path="/weekly-reports" element={<RequireAuth><GenericReportPage pageTitle="Weekly supervisor reports" /></RequireAuth>} />

          <Route path="/sheq-report" element={<RequireAuth><GenericReportPage pageTitle="SHEQ Inspection service report" /></RequireAuth>} />
          <Route path="/sheq-install" element={<RequireAuth><GenericReportPage pageTitle="SHEQ Inspection installation" /></RequireAuth>} />
          <Route path="/sheq-install-report" element={<RequireAuth><GenericReportPage pageTitle="SHEQ Inspection installation report" /></RequireAuth>} />

          <Route path="/lift-sector-client" element={<RequireAuth><GenericReportPage pageTitle="Client level analysis" /></RequireAuth>} />
          <Route path="/lift-sector-site" element={<RequireAuth><GenericReportPage pageTitle="Site level analysis" /></RequireAuth>} />

          <Route path="/create-sites" element={<RequireAuth><CreateSitesPage /></RequireAuth>} />
          <Route path="/sitepack-management" element={<RequireAuth><SitepackManagement /></RequireAuth>} />


          <Route path="/general-forms" element={<RequireAuth><GeneralFormsList /></RequireAuth>} />
          
          <Route path="/general-forms/tool-box-talk" element={<RequireAuth><ToolBoxTalkForm /></RequireAuth>} />
          <Route path="/general-forms/tool-box-talk/:id" element={<RequireAuth><ToolBoxTalkForm /></RequireAuth>} />
          
          <Route path="/general-forms/rams-briefing" element={<RequireAuth><RamsBriefingForm /></RequireAuth>} />
          <Route path="/general-forms/rams-briefing/:id" element={<RequireAuth><RamsBriefingForm /></RequireAuth>} />

          <Route path="/general-forms/site-induction" element={<RequireAuth><SiteInductionForm /></RequireAuth>} />
          <Route path="/general-forms/site-induction/:id" element={<RequireAuth><SiteInductionForm /></RequireAuth>} />

          <Route path="/general-forms/daily-safe-start-briefing" element={<RequireAuth><DailySafeStartBriefingForm /></RequireAuth>} />
          <Route path="/general-forms/daily-safe-start-briefing/:id" element={<RequireAuth><DailySafeStartBriefingForm /></RequireAuth>} />

          <Route path="/general-forms/audit-action-form" element={<RequireAuth><AuditActionForm /></RequireAuth>} />
          <Route path="/general-forms/audit-action-form/:id" element={<RequireAuth><AuditActionForm /></RequireAuth>} />

          <Route path="/general-forms/site-induction-form" element={<RequireAuth><SiteInductionRecordForm /></RequireAuth>} />
          <Route path="/general-forms/site-induction-form/:id" element={<RequireAuth><SiteInductionRecordForm /></RequireAuth>} />

          <Route path="/general-forms/management-site-inspection" element={<RequireAuth><ManagementSiteInspectionForm /></RequireAuth>} />
          <Route path="/general-forms/management-site-inspection/:id" element={<RequireAuth><ManagementSiteInspectionForm /></RequireAuth>} />
          
          <Route path="/general-forms/loler-inspection-form" element={<RequireAuth><LolerInspectionForm /></RequireAuth>} />
          <Route path="/general-forms/loler-inspection-form/:id" element={<RequireAuth><LolerInspectionForm /></RequireAuth>} />
          
          <Route path="/general-forms/puwer-inspection-form" element={<RequireAuth><PuwerInspectionForm /></RequireAuth>} />
          <Route path="/general-forms/puwer-inspection-form/:id" element={<RequireAuth><PuwerInspectionForm /></RequireAuth>} />
          <Route path="/frida-forms" element={<RequireAuth><GenericReportPage pageTitle="Friday pack forms" /></RequireAuth>} />

          {/* Dashboards */}
          <Route path="/concern-reports" element={<RequireAuth><ConcernReportDashboard /></RequireAuth>} />
          <Route path="/audit-reports" element={<RequireAuth><AuditReportDashboard /></RequireAuth>} />


        </Routes>
      </ErrorBoundary>
    </ThemeProvider>



  )
}

export default App
