import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/home";
import Navbar from "./components/custom/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { Dashboard } from "./pages/dashboard";
import Login from "./components/auth/login";
import Signup from "./components/auth/signup";
import AllProducts from "./components/custom/dashboard/pages/all.products";
import AuthMiddleware from "./components/custom/auth/AuthMiddleware";
import PropertyView from "./pages/property.view";
import Portfolio from "./components/custom/dashboard/pages/Portfolio";
import CreditPurchasePage from "./pages/offset";
import Transaction_History from "./components/custom/dashboard/pages/transactions.history";
import ProjectStatus from "./pages/project.status";
import ForgotPassword from "./components/auth/forgot.password";
import { UpdatePasswordForm } from "./components/auth/update.password";
import Admin from "./admin";
import AdminMiddleware from "./components/custom/auth/AdminMiddleware";
import Users from "./admin/allUsers";
import { ProjectsTable } from "@/components/ProjectsTable";
import CreatePropertyForm from "./admin/createProperty/createProperty";
import { KycProvider } from "./hooks/kyccontext";
import { useAuth } from "./hooks/authcontext";

function App() {
  const location = useLocation();
  const isDashboardPage = location.pathname.startsWith("/dashboard");
  const isAdminPage = location.pathname.startsWith("/admin");
  const { user } = useAuth();

  return (
    <KycProvider user={user}>
      <div className="min-h-screen overflow-x-hidden relative">
        {/* Conditionally hide TopBanner & Navbar on Dashboard/Admin */}
        {!isDashboardPage && !isAdminPage && <Navbar />}

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/update-password" element={<UpdatePasswordForm />} />
          <Route path="/property/view/:id" element={<PropertyView />} />
          <Route path="/property/view/:id/status" element={<ProjectStatus />} />

          {/* Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <Dashboard>
                <AllProducts />
              </Dashboard>
            }
          />
          <Route
            path="/dashboard/portfolio"
            element={
              <AuthMiddleware>
                <Dashboard>
                  <Portfolio />
                </Dashboard>
              </AuthMiddleware>
            }
          />
          <Route
            path="/dashboard/history"
            element={
              <AuthMiddleware>
                <Dashboard>
                  <Transaction_History />
                </Dashboard>
              </AuthMiddleware>
            }
          />
          <Route
            path="/offset"
            element={
              <AuthMiddleware>
                <Dashboard>
                  <CreditPurchasePage />
                </Dashboard>
              </AuthMiddleware>
            }
          />

          {/* Admin Routes */}

          <Route
            path="/admin/create"
            element={
              <AdminMiddleware>
                <Admin>
                  <CreatePropertyForm />
                </Admin>
              </AdminMiddleware>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminMiddleware>
                <Admin>
                  <ProjectsTable />
                </Admin>
              </AdminMiddleware>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminMiddleware>
                <Admin>
                  <Users />
                </Admin>
              </AdminMiddleware>
            }
          />
        </Routes>

        <Toaster richColors />
      </div>
    </KycProvider>
  );
}

export default App;
