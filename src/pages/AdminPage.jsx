import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MenuList from "../components/MenuList";
import TransactionList from "../components/TransactionList";
import PaymentHistory from "../components/PaymentHistory";
import Settings from "../components/Settings";

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState("menu");
  const [searchTerm, setSearchTerm] = useState("");

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
        <div className="w-48 bg-gray-800 text-white">
          <div
            className={`p-4 cursor-pointer ${
              activeView === "menu" ? "bg-gray-700" : ""
            }`}
            onClick={() => setActiveView("menu")}
          >
            Menu List
          </div>
          <div
            className={`p-4 cursor-pointer ${
              activeView === "transaction" ? "bg-gray-700" : ""
            }`}
            onClick={() => setActiveView("transaction")}
          >
            Transaction Record
          </div>
          <div
            className={`p-4 cursor-pointer ${
              activeView === "payment" ? "bg-gray-700" : ""
            }`}
            onClick={() => setActiveView("payment")}
          >
            Payment History
          </div>
          <div
            className={`p-4 cursor-pointer ${
              activeView === "settings" ? "bg-gray-700" : ""
            }`}
            onClick={() => setActiveView("settings")}
          >
            Settings
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">{renderActiveView()}</div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
