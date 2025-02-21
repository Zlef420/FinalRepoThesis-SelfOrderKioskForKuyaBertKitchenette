import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRole }) => {
  const { isAuthenticated, getRole, currentEmail } = useAuth();
  console.log("ProtectedRoute check:", { currentEmail, allowedRole });

  if (!currentEmail) {
    console.log("No currentEmail, redirecting to /");
    return <Navigate to="/" replace />;
  }

  if (!isAuthenticated(currentEmail)) {
    console.log(`Not authenticated for ${currentEmail}, redirecting to /`);
    return <Navigate to="/" replace />;
  }

  const userRole = getRole(currentEmail);
  if (allowedRole && userRole !== allowedRole) {
    console.log(
      `Role mismatch: expected ${allowedRole}, got ${userRole}, redirecting to /`
    );
    return <Navigate to="/" replace />;
  }

  console.log("Access granted:", { currentEmail, userRole });
  return children;
};

export default ProtectedRoute;
