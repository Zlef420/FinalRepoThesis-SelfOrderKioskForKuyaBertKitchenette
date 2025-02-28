import React, { useState, useEffect } from "react";
import { UserCog, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

const LoginForm = ({ onClose }) => {
  const navigate = useNavigate();
  const { login, currentEmail } = useAuth();
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState("");
  const [loginRole, setLoginRole] = useState(null); // Track role post-login

  const MOCK_CREDENTIALS = {
    admin: { email: "admin@example.com", password: "admin123" },
    cashier: { email: "cashier@example.com", password: "cashier123" },
  };

  // Handle Escape key press to close the form
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login attempt:", { role, email });

    if (!role) {
      toast.error("Please select a role");
      return;
    }

    const credentials = MOCK_CREDENTIALS[role];
    if (email === credentials.email && password === credentials.password) {
      const loggedInRole = login(role, email);
      console.log("Login successful, role:", loggedInRole);
      toast.success("Login successful!");
      setLoginRole(loggedInRole); // Trigger navigation via effect
    } else {
      console.log("Invalid credentials");
      toast.error("Invalid credentials");
    }
  };

  useEffect(() => {
    if (loginRole && currentEmail === email) {
      console.log("Effect triggered, currentEmail:", currentEmail);
      if (loginRole === "admin") {
        console.log("Navigating to /admin-page");
        navigate("/admin-page", { replace: true });
      } else if (loginRole === "cashier") {
        console.log("Navigating to /cashier-screen");
        navigate("/cashier-screen", { replace: true });
      } else {
        console.log("Fallback navigation to /");
        navigate("/");
      }
      onClose();
      setLoginRole(null); // Reset to prevent re-trigger
    }
  }, [loginRole, currentEmail, email, navigate, onClose]);

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${
                role === "admin"
                  ? "border-customOrange text-customOrange"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <UserCog className="size-6" />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("cashier")}
              className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${
                role === "cashier"
                  ? "border-customOrange text-customOrange"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <Users className="size-6" />
              <span>Cashier</span>
            </button>
          </div>

          <div className="relative">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField("")}
              className="w-full px-4 py-3 border-2 text-black rounded-lg outline-none transition-all peer"
              required
            />
            <label
              htmlFor="email"
              className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                focusedField === "email" || email
                  ? "-top-2 text-xs bg-white px-2 text-customOrange"
                  : "top-3 text-gray-500"
              }`}
            >
              Email address
            </label>
          </div>

          <div className="relative">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField("")}
              className="w-full px-4 py-3 text-black border-2 rounded-lg outline-none transition-all peer"
              required
            />
            <label
              htmlFor="password"
              className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                focusedField === "password" || password
                  ? "-top-2 text-xs bg-white px-2 text-customOrange"
                  : "top-3 text-gray-500"
              }`}
            >
              Password
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-customOrange text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Login
          </button>
        </form>
        <button
          onClick={onClose}
          className="mt-6 w-full text-center text-gray-500 hover:text-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
