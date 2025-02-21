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
import { useAuth } from "../context/AuthContext"; // For logout and currentEmail
import { useNavigate } from "react-router-dom"; // For navigation

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState("menu");
  const [searchTerm, setSearchTerm] = useState("");
  const { logout, currentEmail } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Logout function
  const handleLogout = () => {
    if (currentEmail) {
      logout(currentEmail); // Erase user from tab’s diary
      navigate("/"); // Go back to start page
    }
    setShowLogoutModal(false); // Close the modal
  };

  const renderActiveView = () => {
    switch (activeView) {
      case "menu":
        return (
          <MenuList searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        );
      case "transaction":
        return (
          <TransactionList
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        );
      case "payment":
        return (
          <PaymentHistory
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        );
      case "settings":
        return <Settings />;
      default:
        return (
          <MenuList searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-48 bg-gray-800 text-white pt-10 flex flex-col h-full">
          {/* Menu Items */}
          <div className="space-y-5">
            <div
              className={`p-4 cursor-pointer hover:bg-red-500 border rounded border-gray-400 flex items-center gap-2 ${
                activeView === "menu" ? "bg-red-600" : ""
              }`}
              onClick={() => setActiveView("menu")}
            >
              <SquareMenu color="white" size={20} />
              <span>Menu List</span>
            </div>

            <div
              className={`p-4 cursor-pointer hover:bg-red-500 border border-gray-400 rounded flex items-center gap-2 text-sm py-5 ${
                activeView === "transaction" ? "bg-red-600" : ""
              }`}
              onClick={() => setActiveView("transaction")}
            >
              <Archive color="white" size={20} />
              <span>Transaction Record</span>
            </div>

            <div
              className={`p-4 cursor-pointer hover:bg-red-500 border rounded border-gray-400 flex items-center gap-2 ${
                activeView === "payment" ? "bg-red-600" : ""
              }`}
              onClick={() => setActiveView("payment")}
            >
              <BadgeDollarSign color="white" size={20} />
              <span>Payment History</span>
            </div>

            <div
              className={`p-4 cursor-pointer hover:bg-red-500 border rounded border-gray-400 flex items-center gap-2 ${
                activeView === "settings" ? "bg-red-600" : ""
              }`}
              onClick={() => setActiveView("settings")}
            >
              <SettingsIcon color="white" size={20} />
              <span>Settings</span>
            </div>
          </div>

          {/* Log-Out pushed to bottom with slight space */}
          <div className="mt-auto pb-4">
            <div
              className="p-4 cursor-pointer border rounded border-red-500 text-red-500 hover:bg-red-500 hover:text-white hover:border-white flex items-center gap-2 group"
              onClick={() => setShowLogoutModal(true)}
            >
              <LogOut
                className="text-red-500 group-hover:text-white"
                size={20}
                strokeWidth={2}
              />
              <span>Log-Out</span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">{renderActiveView()}</div>
      </div>

      <Footer />

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h3 className="text-lg font-medium mb-4">Confirm Logout</h3>
            <p className="mb-6">Are you sure you want to log out?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
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
