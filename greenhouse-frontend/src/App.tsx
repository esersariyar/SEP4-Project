import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import './App.css';
import Dashboard from './components/pages/dashboard/Dashboard';
import Home from './components/pages/home/Home';
import Header from './components/includes/Header';
import Login from './components/pages/Login';
import Devices from './components/pages/devices/Devices';
import Settings from './components/pages/settings/Settings';
import Predictions from './components/pages/predictions/Predictions';

interface User {
  id: number;
  username: string;
  firstName: string | null;
  lastName: string | null;
  refCode: string;
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Try to load user from localStorage when app starts
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (e) {
      // Error parsing stored user
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    setLoading(false);
  }, []);

  // Handle login/authentication
  const handleLogin = (newToken: string, userData: User) => {
    setToken(newToken);
    setUser(userData);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Protected route component
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (loading) {
      return <div>Loading...</div>;
    }
    
    if (!token) {
      return <Navigate to="/login" replace />;
    }
    
    return <>{children}</>;
  };

  return (
    <ChakraProvider value={defaultSystem}>
      <Router>
        <div className="App">
          <Header 
            isLoggedIn={!!token} 
            username={user?.username || ''} 
            onLogout={handleLogout} 
          />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={
              token ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/devices" element={
              <ProtectedRoute>
                <Devices />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/predictions" element={
              <ProtectedRoute>
                <Predictions />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ChakraProvider>
  );
}

export default App;
