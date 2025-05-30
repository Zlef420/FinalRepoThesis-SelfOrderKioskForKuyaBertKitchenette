import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { supabase } from '../supabaseClient'; // Import Supabase client

const LoginForm = ({ onClose }) => {
  const navigate = useNavigate();
  const { login, currentEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState("");
  const [loginRole, setLoginRole] = useState(null); // Track role post-login

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Login attempt:", { email });

    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      // Query Supabase account_table
      // IMPORTANT: This method of querying passwords directly is insecure.
      // Consider using Supabase Auth for proper password handling.
      const { data, error } = await supabase
        .from('account_table')
        .select('username, password, role') // Fetch username, password, and role
        .eq('username', email) // Assuming 'email' from form maps to 'username' in DB
        .eq('password', password) // Direct password comparison (INSECURE)
        .single(); // Expecting a single user or null

      if (error && error.code !== 'PGRST116') { // PGRST116: Row not found (not an error for login logic)
        console.error('Error logging in:', error);
        toast.error(`Login failed: ${error.message}`);
        return;
      }

      if (data) {
        // User found and credentials match
        console.log("Supabase login successful, user data:", data);
        const loggedInRole = login(data.role, data.username); // Use role and username from DB
        toast.success("Login successful!");
        setLoginRole(loggedInRole); // Trigger navigation via effect
      } else {
        // No user found with matching username and password, or other error handled above
        console.log("Invalid credentials or user not found");
        toast.error("Invalid credentials");
      }
    } catch (err) {
      console.error("Unexpected error during login:", err);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  useEffect(() => {
    // currentEmail is set by AuthContext's login function, which now receives username from DB
    if (loginRole && currentEmail) {
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
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role selection buttons removed */}
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
