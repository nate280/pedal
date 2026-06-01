import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { ConfigNotice } from "@/components/ConfigNotice";
import { AppLayout } from "@/components/AppLayout";
import { Toaster } from "@/components/ui/toaster";
import { Logo } from "@/components/Logo";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Fleet from "@/pages/Fleet";
import BikeDetail from "@/pages/BikeDetail";
import LogIssue from "@/pages/LogIssue";
import Settings from "@/pages/Settings";

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="animate-pulse">
        <Logo size={34} />
      </div>
    </div>
  );
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function AuthedApp() {
  const location = useLocation();
  return (
    <Routes location={location}>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <DataProvider>
              <AppLayout />
            </DataProvider>
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/fleet" element={<Fleet />} />
        <Route path="/fleet/:bikeId" element={<BikeDetail />} />
        <Route path="/log" element={<LogIssue />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <>
      <AuthProvider>
        <AppGate />
      </AuthProvider>
      <Toaster />
    </>
  );
}

function AppGate() {
  const { configured } = useAuth();
  if (!configured) return <ConfigNotice />;
  return (
    <AnimatePresence mode="wait">
      <AuthedApp />
    </AnimatePresence>
  );
}
