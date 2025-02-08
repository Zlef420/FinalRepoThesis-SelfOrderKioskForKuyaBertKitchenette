import React, { useState } from "react";
import { UserCog, Users } from "lucide-react";

const LoginForm = ({ onClose }) => {
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`Role: ${role}, Email: ${email}`);
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center mb-8">Login</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`p-4 border rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${
                role === "admin"
                  ? "border-teal-500 text-teal-500"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <UserCog className="size-6" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => setRole("cashier")}
              className={`p-4 border rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${
                role === "cashier"
                  ? "border-teal-500 text-teal-500"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <Users className="size-6" />
              <span>Cashier</span>
            </button>
          </div>

          {/* Email Input */}
          <div className="relative">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField("")}
              className="w-full px-4 py-3 border text-black rounded-lg outline-none transition-all peer"
              required
            />
            <label
              htmlFor="email"
              className={`absolute left-4 transition-all duration-200 pointer-events-none
                ${
                  focusedField === "email" || email
                    ? "-top-2 text-xs bg-white px-2 text-teal-500"
                    : "top-3 text-gray-500"
                }`}
            >
              Email address
            </label>
          </div>

          {/* Password Input */}
          <div className="relative">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField("")}
              className="w-full px-4 py-3 text-black border rounded-lg outline-none transition-all peer"
              required
            />
            <label
              htmlFor="password"
              className={`absolute left-4 transition-all duration-200 pointer-events-none
                ${
                  focusedField === "password" || password
                    ? "-top-2 text-xs bg-white px-2 text-teal-500"
                    : "top-3 text-gray-500"
                }`}
            >
              Password
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-teal-500 text-white py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors"
          >
            Login
          </button>
        </form>

        {/* Close Button */}
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
