import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("fs_user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const handleLogin = (u: { name: string; email: string }) => {
    localStorage.setItem("fs_user", JSON.stringify(u));
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem("fs_user");
    setUser(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />}
            />
            <Route
              path="/"
              element={user ? <Index user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;