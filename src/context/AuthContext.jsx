import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [sessions, setSessions] = useState(() => {
    const storedSessions = sessionStorage.getItem("sessions");
    console.log("Init sessions:", storedSessions);
    return storedSessions ? JSON.parse(storedSessions) : {};
  });
  const [currentEmail, setCurrentEmail] = useState(() => {
    const storedEmail = sessionStorage.getItem("currentEmail");
    console.log("Init currentEmail:", storedEmail);
    return storedEmail || null;
  });

  const login = (role, email) => {
    const updatedSessions = {
      ...sessions,
      [email]: { role, authenticated: true },
    };
    console.log("Login:", { email, role, updatedSessions });
    setSessions(updatedSessions);
    setCurrentEmail(email);
    sessionStorage.setItem("sessions", JSON.stringify(updatedSessions));
    sessionStorage.setItem("currentEmail", email);
    return role;
  };

  const logout = (email) => {
    const newSessions = { ...sessions };
    delete newSessions[email];
    setSessions(newSessions);
    if (currentEmail === email) setCurrentEmail(null);
    sessionStorage.setItem("sessions", JSON.stringify(newSessions));
    sessionStorage.setItem(
      "currentEmail",
      currentEmail === email ? null : currentEmail
    );
  };

  const isAuthenticated = (email) => {
    const authStatus = !!sessions[email]?.authenticated;
    console.log(`Is ${email} authenticated?`, authStatus);
    return authStatus;
  };

  const getRole = (email) => {
    const role = sessions[email]?.role || null;
    console.log(`Role for ${email}:`, role);
    return role;
  };

  return (
    <AuthContext.Provider
      value={{
        sessions,
        login,
        logout,
        isAuthenticated,
        getRole,
        currentEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
