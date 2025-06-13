import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MenuList from "../components/MenuList";
import TransactionList from "../components/TransactionList";
import PaymentHistory from "../components/PaymentHistory";
import Settings from "../components/Settings";
import {
  SquareMenu,
  Archive,
  BadgeDollarSign,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState("menu");
  const [searchTerm, setSearchTerm] = useState("");
  const { logout, currentEmail } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    if (currentEmail) {
      logout(currentEmail);
      navigate("/");
    }
    setShowLogoutModal(false);
  };

  const renderActiveView = () => {
    const commonProps = { searchTerm, setSearchTerm };

    switch (activeView) {
      case "menu":
        return <MenuList {...commonProps} />;
      case "transaction":
        return <TransactionList {...commonProps} />;
      case "payment":
        return <PaymentHistory {...commonProps} />;
      case "settings":
        return <Settings />;
      default:
        return <MenuList {...commonProps} />;
    }
  };

  const navItems = [
    { key: "menu", label: "Menu List", icon: SquareMenu },
    { key: "transaction", label: "Transaction Record", icon: Archive },
    { key: "payment", label: "Payment History", icon: BadgeDollarSign },
    { key: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-48 bg-gray-800 text-white flex flex-col shrink-0 shadow-lg">
          <nav className="flex-1 space-y-3 p-2 overflow-y-auto mt-4">
            {navItems.map((item) => (
              <div
                key={item.key}
                className={`p-3 cursor-pointer rounded border flex items-center gap-2 text-sm font-medium transition-all duration-150 ${
                  activeView === item.key
                    ? "bg-red-600 border-red-500 shadow-inner"
                    : "border-gray-600 hover:bg-gray-700 hover:border-gray-500"
                }`}
                onClick={() => {
                  setActiveView(item.key);
                  setSearchTerm("");
                }}
              >
                <item.icon
                  className="shrink-0"
                  color="white"
                  size={18}
                  strokeWidth={1.75}
                />
                <span>{item.label}</span>
              </div>
            ))}
          </nav>
          <div className="p-2 mt-auto shrink-0">
            <div
              className="p-3 cursor-pointer border rounded border-red-600 text-red-400 hover:bg-red-600 hover:text-white hover:border-red-500 flex items-center gap-2 group transition-all duration-150"
              onClick={() => setShowLogoutModal(true)}
            >
              <LogOut
                className="text-red-400 group-hover:text-white transition-colors shrink-0"
                size={18}
                strokeWidth={2}
              />
              <span className="text-sm font-medium">Log-Out</span>
            </div>
          </div>
        </div>
        <main className="flex-1 overflow-hidden">{renderActiveView()}</main>
      </div>
      <Footer />

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 w-full max-w-xs shadow-xl border">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Confirm Logout
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              Are you sure you want to log out?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 border rounded text-sm hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
