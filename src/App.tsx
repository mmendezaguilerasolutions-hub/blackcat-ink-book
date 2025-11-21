import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SuperAdminUsers from "./pages/SuperAdminUsers";
import PortfolioAdmin from "./pages/PortfolioAdmin";
import ArtistAgenda from "./pages/ArtistAgenda";
import MySpace from "./pages/MySpace";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/register"
              element={
                <ProtectedRoute requireRole="superadmin">
                  <Register />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requireRole="superadmin">
                  <SuperAdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/portfolio"
              element={
                <ProtectedRoute requireRole="superadmin">
                  <PortfolioAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/artist/agenda"
              element={
                <ProtectedRoute>
                  <ArtistAgenda />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-space"
              element={
                <ProtectedRoute>
                  <MySpace />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
