import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { user, profile, loading } = useAuth();

  console.log('App state:', { user: !!user, profile: !!profile, loading });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <Routes>
          <Route 
            path="/auth" 
            element={!user ? <AuthPage /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/" 
            element={user ? <HomePage /> : <Navigate to="/auth" replace />} 
          />
          <Route 
            path="*" 
            element={<Navigate to={user ? "/" : "/auth"} replace />} 
          />
        </Routes>
        
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#333',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;