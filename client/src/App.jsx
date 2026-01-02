import React from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import AppRoutes from './routes/app-routes';
import LayoutWrapper from './modules/layout/LayoutWrapper';
import ErrorBoundary from './components/common/ErrorBoundary';
import './App.css';

const LayoutDecider = () => {
  const location = useLocation();
  const noLayoutRoutes = ['/', '/login', '/signup', '/marketplace/search', '/marketplace/pg'];
  const isNoLayout = noLayoutRoutes.some(route => location.pathname === route || location.pathname.startsWith(route + '/'));
  
  try {
    return isNoLayout ? <AppRoutes /> : <LayoutWrapper><AppRoutes /></LayoutWrapper>;
  } catch (error) {
    console.error('Layout error:', error);
    return <AppRoutes />;
  }
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <LayoutDecider />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
