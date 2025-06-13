import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoute = ({ children, allowedRole }) => {
  {/* Get auth context */}
  const { isAuthenticated, getRole, currentEmail } = useAuth();
  

  console.log("ProtectedRoute check:", { currentEmail, allowedRole });

  {/* Check if user is logged in */}
  if (!currentEmail) {
    console.log("No currentEmail, redirecting to /");
    return <Navigate to="/" replace />;
  }

  {/* Verify authentication */}
  const isUserAuthenticated = isAuthenticated(currentEmail);
  if (!isUserAuthenticated) {
    console.log(`Not authenticated for ${currentEmail}, redirecting to /`);
    return <Navigate to="/" replace />;
  }

  {/* Check user role */}
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