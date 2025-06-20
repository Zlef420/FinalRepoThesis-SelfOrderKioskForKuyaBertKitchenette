import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { supabase } from '../supabaseClient';

const LoginForm = ({ onClose }) => {
  const navigate = useNavigate();
  const { login, currentEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState("");
  const [loginRole, setLoginRole] = useState(null);

  {/* State for Forgot Password Modal */}
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordForm, setForgotPasswordForm] = useState({
    email: "",
    securityQuestion: "What was your first pet's name?",
    securityAnswer: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [targetAccount, setTargetAccount] = useState(null);

  {/* Handle Escape key press */}
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
      {/* Query Supabase account_table */}
      const { data, error } = await supabase
        .from('account_table')
        .select('email, password, role')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error logging in:', error);
        toast.error(`Login failed: ${error.message}`);
        return;
      }

      if (data) {
        // User found and credentials match
        console.log("Supabase login successful, user data:", data);
        const loggedInRole = login(data.role, data.email);
        toast.success("Login successful!");
        setLoginRole(loggedInRole);
      } else {
        {/* No user found with matching credentials */}
        console.log("Invalid credentials or user not found");
        toast.error("Invalid credentials");
      }
    } catch (err) {
      console.error("Unexpected error during login:", err);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const resetForgotPasswordForm = () => {
    setForgotPasswordForm({
      email: "",
      securityQuestion: "What was your first pet's name?",
      securityAnswer: "",
      newPassword: "",
      confirmNewPassword: "",
    });
    setIsVerified(false);
    setIsLoading(false);
    setTargetAccount(null);
    setShowForgotPasswordModal(false);
  };

  const handleVerify = async () => {
    setIsLoading(true);
    const { email, securityQuestion, securityAnswer } = forgotPasswordForm;

    try {
      const { data, error } = await supabase
        .from('account_table')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !data) {
        toast.error('Account not found. Please check the email address.', { id: 'account-not-found' });
        setIsLoading(false);
        return;
      }
      
      if (data.security_question === securityQuestion && data.security_answer === securityAnswer) {
        toast.success('Verification successful! You can now reset your password.', { id: 'verification-success' });
        setIsVerified(true);
        setTargetAccount(data);
      } else {
        toast.error('Security question or answer is incorrect.', { id: 'verification-failed' });
      }
    } catch (err) {
      toast.error('An unexpected error occurred during verification.', { id: 'verification-error' });
      console.error('Verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const { newPassword, confirmNewPassword } = forgotPasswordForm;

    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match.', { id: 'password-mismatch' });
      return;
    }
    if (!newPassword) {
        toast.error('Password cannot be empty.', { id: 'empty-password' });
        return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('account_table')
        .update({ password: newPassword })
        .eq('id', targetAccount.id);

      if (error) {
        throw error;
      }

      toast.success('Password updated successfully!', { id: 'password-reset-success' });
      resetForgotPasswordForm();
      
    } catch (err) {
      toast.error('Failed to update password. Please try again.', { id: 'password-reset-error' });
      console.error('Password reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    {/* Handle navigation based on role */}
    if (loginRole && currentEmail) {
      console.log("Effect triggered, currentEmail:", currentEmail);
      const role = loginRole.toLowerCase();
      if (role === "admin") {
        console.log("Navigating to /admin-page");
        navigate("/admin-page", { replace: true });
      } else if (role === "cashier") {
        console.log("Navigating to /cashier-screen");
        navigate("/cashier-screen", { replace: true });
      } else {
        console.log("Fallback navigation to /");
        navigate("/");
      }
      onClose();
      setLoginRole(null);
    }
  }, [loginRole, currentEmail, email, navigate, onClose]);

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-6">

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
        <div className="text-center mt-4">
            <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className="text-sm text-blue-600 hover:underline"
            >
                Forgot your password?
            </button>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full text-center text-gray-500 hover:text-gray-700"
        >
          Close
        </button>
      </div>

      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-[60]">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Forgot Password</h2>
                {!isVerified ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Email:</label>
                            <input
                                type="email"
                                className="w-full p-2 border rounded text-black"
                                value={forgotPasswordForm.email}
                                onChange={(e) => setForgotPasswordForm({ ...forgotPasswordForm, email: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Security Question:</label>
                            <select
                                className="w-full p-2 border rounded text-black"
                                value={forgotPasswordForm.securityQuestion}
                                onChange={(e) => setForgotPasswordForm({ ...forgotPasswordForm, securityQuestion: e.target.value })}
                            >
                                <option value="What was your first pet's name?">What was your first pet's name?</option>
                                <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                                <option value="What was the name of your elementary school?">What was the name of your elementary school?</option>
                                <option value="What was your childhood nickname?">What was your childhood nickname?</option>
                                <option value="In what city were you born?">In what city were you born?</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Security Answer:</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded text-black"
                                value={forgotPasswordForm.securityAnswer}
                                onChange={(e) => setForgotPasswordForm({ ...forgotPasswordForm, securityAnswer: e.target.value })}
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-4 mt-6">
                            <button onClick={resetForgotPasswordForm} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">Cancel</button>
                            <button onClick={handleVerify} disabled={isLoading} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300">
                                {isLoading ? 'Verifying...' : 'Verify'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">New Password:</label>
                            <input
                                type="password"
                                className="w-full p-2 border rounded text-black"
                                value={forgotPasswordForm.newPassword}
                                onChange={(e) => setForgotPasswordForm({ ...forgotPasswordForm, newPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Confirm New Password:</label>
                            <input
                                type="password"
                                className="w-full p-2 border rounded text-black"
                                value={forgotPasswordForm.confirmNewPassword}
                                onChange={(e) => setForgotPasswordForm({ ...forgotPasswordForm, confirmNewPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-4 mt-6">
                            <button onClick={() => setIsVerified(false)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">Back</button>
                            <button onClick={handlePasswordReset} disabled={isLoading} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300">
                                {isLoading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
