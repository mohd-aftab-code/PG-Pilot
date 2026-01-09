import React from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import AppRoutes from './routes/app-routes';
import LayoutWrapper from './modules/layout/LayoutWrapper';
import ErrorBoundary from './components/common/ErrorBoundary';
import { SubscriptionProvider } from './context/SubscriptionContext';
import './App.css';

const LayoutDecider = () => {
  const location = useLocation();
  const noLayoutRoutes = ['/', '/login', '/signup', '/for-owners', '/for-tenants', '/register-pg', '/pg-success', '/choose-plan', '/payment-success', '/marketplace/search', '/marketplace/pg'];
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
      <SubscriptionProvider>
        <Router>
          <LayoutDecider />
        </Router>
      </SubscriptionProvider>
    </ErrorBoundary>
  );
}

export default App;
