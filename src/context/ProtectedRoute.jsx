import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoute = ({ children, allowedRole }) => {
  // Use the hook at the top level of the component
  const { isAuthenticated, getRole, currentEmail } = useAuth();
  
  // For debugging
  console.log("ProtectedRoute check:", { currentEmail, allowedRole });

  // Handle authentication logic with appropriate guards
  if (!currentEmail) {
    console.log("No currentEmail, redirecting to /");
    return <Navigate to="/" replace />;
  }

  // Check if the user is authenticated
  const isUserAuthenticated = isAuthenticated(currentEmail);
  if (!isUserAuthenticated) {
    console.log(`Not authenticated for ${currentEmail}, redirecting to /`);
    return <Navigate to="/" replace />;
  }

  // Check role if required
  if (allowedRole) {
    const userRole = getRole(currentEmail);
    if (userRole !== allowedRole) {
      console.log(
        `Role mismatch: expected ${allowedRole}, got ${userRole}, redirecting to /`
      );
      return <Navigate to="/" replace />;
    }
  }

  console.log("Access granted:", { currentEmail, userRole: getRole(currentEmail) });
  return children;
};

export default ProtectedRoute;