import React from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import AppRoutes from './routes/app-routes';
import LayoutWrapper from './modules/layout/LayoutWrapper';
import { AuthProvider } from './context/AuthContext';
import './App.css';

const LayoutDecider = () => {
  const location = useLocation();
  const noLayoutRoutes = ['/', '/login'];
  const isNoLayout = noLayoutRoutes.includes(location.pathname);
  
  return isNoLayout ? <AppRoutes /> : <LayoutWrapper><AppRoutes /></LayoutWrapper>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <LayoutDecider />
      </Router>
    </AuthProvider>
  );
}

export default App;
