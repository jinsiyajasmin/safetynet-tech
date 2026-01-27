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

import GenericReportPage from './pages/GenericReportPage';

function App() {


  return (
    <>
      <ErrorBoundary>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/clients" element={<Client />} />

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

          <Route path="/frida-forms" element={<RequireAuth><GenericReportPage pageTitle="Friday pack forms" /></RequireAuth>} />


        </Routes>
      </ErrorBoundary>
    </>



  )
}

export default App
