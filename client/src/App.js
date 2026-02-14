import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import ClassDetail from './pages/ClassDetail';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import { API_URL } from './config';

// Set axios base URL
import axios from 'axios';
axios.defaults.baseURL = API_URL;

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#f5f5f5', paper: '#ffffff' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 8 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/classes" element={<PrivateRoute><Classes /></PrivateRoute>} />
            <Route path="/class/:id" element={<PrivateRoute><ClassDetail /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;