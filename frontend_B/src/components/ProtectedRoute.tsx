// frontend_B/src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import './ProtectedRoute.css';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoggedIn, loading, user } = useUser();
  const location = useLocation();

  // Afficher un loader pendant la vérification de l'authentification
  if (loading || (isLoggedIn && !user)) {
    return (
      <div className="protected-route-loading">
        <div className="loading-spinner">⏳</div>
        <p>Vérification de l'authentification...</p>
      </div>
    );
  }

  // Rediriger vers login si pas connecté
  if (!isLoggedIn || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Rendre le composant enfant si authentifié
  return <>{children}</>;
};

export default ProtectedRoute;