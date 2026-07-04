import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TaskDetail from './pages/TaskDetail';
import { LogOut, Brain } from 'lucide-react';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-800 border-t-indigo-500"></div>
          <Brain className="absolute h-6 w-6 text-indigo-400 animate-pulse-slow" />
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Navigation layout wrapper for authorized pages
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
      {/* Decorative Glow Elements */}
      <div className="glow-accent-blue" />
      <div className="glow-accent-purple" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-800/80 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600/25 p-2 rounded-xl border border-indigo-500/30">
            <Brain className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 font-sans font-extrabold">
              AI Task Processor <span className="text-[10px] uppercase font-semibold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30">v1.0</span>
            </h1>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-medium text-slate-200">{user.username}</span>
              <span className="text-xs text-slate-400">{user.email}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-red-950/20 hover:border-red-500/40 text-slate-300 hover:text-red-400 transition duration-200 text-sm font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-slate-500 text-xs border-t border-slate-900 z-10">
        &copy; {new Date().getFullYear()} AI Task Processing Platform. Built with React, Express, Python, Redis & MongoDB.
      </footer>
    </div>
  );
};

const AppRoutes: React.FC = () => {
  const { token } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={token ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={token ? <Navigate to="/" replace /> : <Register />}
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <TaskDetail />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;
