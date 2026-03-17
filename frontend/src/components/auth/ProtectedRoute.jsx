import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * A wrapper for routes that require authentication or specific roles.
 * @param {Object} props
 * @param {Object} props.user - The current user object from global state
 * @param {boolean} props.user.isLoggedIn
 * @param {string} props.user.role
 * @param {string[]} [props.allowedRoles] - Optional array of roles that can access this route
 * @param {React.ReactNode} props.children - The component to render if allowed
 */
const ProtectedRoute = ({ user, allowedRoles, children }) => {
  if (!user.isLoggedIn) {
    // Not logged in -> send to login page
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Logged in but wrong role -> send to home page
    return <Navigate to="/" replace />;
  }

  // Authorized -> render the route
  return children;
};

export default ProtectedRoute;
