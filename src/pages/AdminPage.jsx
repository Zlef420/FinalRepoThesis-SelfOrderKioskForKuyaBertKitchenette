import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MenuList from "../components/MenuList";
import TransactionList from "../components/TransactionList";
import PaymentHistory from "../components/PaymentHistory";
import SalesReport from "../components/SalesReport";
import Settings from "../components/Settings";
import {
  SquareMenu,
  Archive,
  BadgeDollarSign,
  BarChart,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState("menu");
  const [searchTerm, setSearchTerm] = useState("");
  const { logout, currentEmail } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      case "sales":
        return <SalesReport {...commonProps} />;
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
    { key: "sales", label: "Sales Report", icon: BarChart },
    { key: "settings", label: "Settings", icon: SettingsIcon },
  ];

  const handleNavClick = (view) => {
    setActiveView(view);
    setSearchTerm("");
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const AdminNav = () => (
    <div className="w-64 md:w-48 bg-gray-800 text-white flex flex-col shrink-0 shadow-lg h-full">
      <div className="md:hidden flex justify-between items-center p-2 border-b border-gray-700">
        <span className="text-lg font-semibold text-white px-2">Admin Menu</span>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="p-1 text-white"
        >
          <X size={24} />
        </button>
      </div>
      <nav className="flex-1 space-y-2 p-2 overflow-y-auto mt-4">
        {navItems.map((item) => (
          <div
            key={item.key}
            className={`p-3 cursor-pointer rounded border flex items-center gap-2 text-sm font-medium transition-all duration-150 ${
              activeView === item.key
                ? "bg-red-600 border-red-500 shadow-inner"
                : "border-gray-600 hover:bg-gray-700 hover:border-gray-500"
            }`}
            onClick={() => handleNavClick(item.key)}
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
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />

      {/* Mobile Header */}
      <div className="md:hidden flex justify-between items-center px-4 py-2 bg-gray-900 shadow-md">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-md text-gray-100 hover:text-gray-300"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-white font-bold text-lg">Admin Panel</h1>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div
          className={`absolute md:relative md:block z-30 h-full transition-transform duration-300 transform ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }`}
        >
          <AdminNav />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">{renderActiveView()}</main>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

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
