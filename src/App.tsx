import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Feedback from "./pages/Feedback";
import Plans from "./pages/Plans";
import Coaches from "./pages/Coaches";
import Settings from "./pages/Settings";
import Templates from "./pages/Templates";
import Login from "./pages/Login";
import Users from "./pages/Users";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Data is immediately stale, will refetch on mount
      gcTime: 1000 * 60 * 5, // 5 minutes garbage collection
      retry: 1, // Only retry once on failure
      refetchOnWindowFocus: true, // Refetch when window regains focus
      refetchOnMount: true, // Refetch when component mounts
      refetchOnReconnect: true, // Refetch when reconnecting
    },
  },
});

// Protected route wrapper
const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: "admin" | "coach" }) => {
  const { user, loading, isAdmin, isCoach } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === "admin" && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === "coach" && !isCoach) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Main app content with layout
const AppContent = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Determine role for layout
  const currentRole = user?.role || "client";

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <AppLayout
      currentRole={currentRole}
      currentUser={user}
      onSignOut={handleSignOut}
    >
      <Routes>
        <Route path="/" element={<Index currentRole={currentRole} />} />
        <Route path="/clients" element={
          <ProtectedRoute requiredRole="coach">
            <Clients currentRole={currentRole} currentCoachId={user?.id} />
          </ProtectedRoute>
        } />
        <Route path="/clients/:clientId" element={
          <ProtectedRoute requiredRole="coach">
            <ClientDetail />
          </ProtectedRoute>
        } />
        <Route path="/feedback" element={
          <ProtectedRoute requiredRole="coach">
            <Feedback />
          </ProtectedRoute>
        } />
        <Route path="/coaches" element={
          <ProtectedRoute requiredRole="coach">
            <Coaches currentRole={currentRole} currentCoachId={user?.id} />
          </ProtectedRoute>
        } />
        <Route path="/plans" element={
          <ProtectedRoute requiredRole="coach">
            <Plans />
          </ProtectedRoute>
        } />
        <Route path="/templates" element={
          <ProtectedRoute requiredRole="coach">
            <Templates />
          </ProtectedRoute>
        } />
        <Route path="/messages" element={
          <ProtectedRoute requiredRole="coach">
            <Messages />
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute requiredRole="admin">
            <Users />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={<Settings currentRole={currentRole} />} />
        <Route path="/audit" element={
          <ProtectedRoute requiredRole="admin">
            <div className="text-center py-12"><h2 className="text-2xl font-semibold">Audit Logs coming soon</h2></div>
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginWrapper />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <AppContent />
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

// Wrapper to redirect logged-in users away from login page
const LoginWrapper = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Login />;
};

export default App;
