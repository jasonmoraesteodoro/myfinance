import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinancialProvider } from './context/FinancialContext';
import LoginForm from './components/Auth/LoginForm';
import ResetPasswordForm from './components/Auth/ResetPasswordForm';
import Dashboard from './components/Dashboard/Dashboard';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  console.log('🎯 AppContent render - isAuthenticated:', isAuthenticated, 'loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPasswordForm />} />
      <Route 
        path="/" 
        element={
          !isAuthenticated ? (
            <LoginForm />
          ) : (
            <FinancialProvider>
              <Dashboard />
            </FinancialProvider>
          )
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;