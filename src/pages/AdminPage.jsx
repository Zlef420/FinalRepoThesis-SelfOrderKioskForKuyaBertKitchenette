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
            {" "}
            {/* Added pb-4 for bottom padding */}
            <div
              className="p-4 cursor-pointer border rounded border-red-500 text-red-500 hover:bg-red-500 
                        hover:text-white hover:border-white flex items-center gap-2 group"
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
    </div>
  );
};

export default AdminDashboard;
