import React, { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  DollarSign,
  ArrowLeftRight,
  Printer,
} from "lucide-react";

const CashierScreen = () => {
  const [allTransactions] = useState([
    {
      ORN: "420",
      TAmount: 396,
      RefNum: "A7B9D2P",
      PaymentStat: "Pending",
      items: [
        { name: "Sisig", price: 99, quantity: 1, total: 99 },
        { name: "Carbonara", price: 99, quantity: 1, total: 99 },
        { name: "Halo-halo", price: 99, quantity: 1, total: 99 },
        { name: "Lemon Juice", price: 99, quantity: 1, total: 99 },
      ],
    },
    {
      ORN: "419",
      TAmount: 123,
      RefNum: "B7B9D2P",
      PaymentStat: "Paid",
      items: [{ name: "Sisig", price: 123, quantity: 1, total: 123 }],
    },
  ]);

  const [transactions, setTransactions] = useState(allTransactions);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [cashAmount, setCashAmount] = useState("500");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const printRef = useRef();

  const { logout, currentEmail } = useAuth();
  const navigate = useNavigate();

  // Handle live search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setTransactions(allTransactions);
    } else {
      const filteredTransactions = allTransactions.filter(
        (transaction) =>
          transaction.ORN.toLowerCase().includes(searchQuery.toLowerCase()) ||
          transaction.RefNum.toLowerCase().includes(
            searchQuery.toLowerCase()
          ) ||
          transaction.PaymentStat.toLowerCase().includes(
            searchQuery.toLowerCase()
          ) ||
          transaction.TAmount.toString().includes(searchQuery)
      );
      setTransactions(filteredTransactions);
    }
  }, [searchQuery, allTransactions]);

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
  };

  const calculateChange = () => {
    if (!selectedTransaction || !cashAmount) return 0;
    return Number(cashAmount) - selectedTransaction.TAmount;
  };

  const handleLogout = () => {
    if (currentEmail) {
      logout(currentEmail);
      navigate("/");
    }
    setShowLogoutModal(false);
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setTransactions(allTransactions);
    setSelectedTransaction(null);
    setCashAmount("500");
  };

  const handlePrint = () => {
    if (!selectedTransaction) return;

    const receipt = `
      ===== KUYA BERT RECEIPT =====
      Order #: ${selectedTransaction.ORN}
      Reference: ${selectedTransaction.RefNum}
      Status: ${selectedTransaction.PaymentStat}
      
      ITEMS:
      ${selectedTransaction.items
        .map(
          (item) =>
            `${item.name.padEnd(15)} ${item.quantity}x ₱${item.price} = ₱${
              item.total
            }`
        )
        .join("\n")}
      
      TOTAL: ₱${selectedTransaction.TAmount}
      CASH: ₱${cashAmount}
      CHANGE: ₱${calculateChange()}
      
      Thank you for your order!
      ${new Date().toLocaleString()}
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt #${selectedTransaction.ORN}</title>
          <style>
            body { font-family: monospace; margin: 30px; }
            pre { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <pre>${receipt}</pre>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      <Header />

      <div className="flex-1 flex flex-col p-4 gap-4 bg-gray-100">
        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* Left Side - Transactions List */}
          <div className="w-2/5 flex flex-col">
            <div className="bg-white rounded-lg shadow p-4 flex-1 overflow-hidden flex flex-col">
              <div className="mb-4 relative">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 pl-2 pr-10 border rounded bg-gray-100"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
              </div>

              <div className="overflow-y-auto flex-1">
                <table className="w-full">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="p-2 text-left">ORN</th>
                      <th className="p-2 text-left">TAmount</th>
                      <th className="p-2 text-left">RefNum</th>
                      <th className="p-2 text-left">PaymentStat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction.ORN}
                        onClick={() => handleTransactionClick(transaction)}
                        className={`cursor-pointer hover:bg-gray-200 border-b ${
                          selectedTransaction?.ORN === transaction.ORN
                            ? "bg-gray-100"
                            : ""
                        }`}
                      >
                        <td className="p-2">{transaction.ORN}</td>
                        <td className="p-2">{transaction.TAmount}</td>
                        <td className="p-2">{transaction.RefNum}</td>
                        <td className="p-2">{transaction.PaymentStat}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Logout and Refresh Buttons at the Bottom of the Container */}
            <div className="mt-4 flex justify-between px-4">
              <button
                onClick={() => setShowLogoutModal(true)}
                className="bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded"
              >
                Log-out
              </button>
              <button
                onClick={handleRefresh}
                className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center"
              >
                <RefreshCw size={20} />
                <span className="ml-2">Refresh</span>
              </button>
            </div>
          </div>

          {/* Right Side - Order Details and Payment Section */}
          <div className="w-3/5 flex flex-col gap-4">
            <div className="bg-white rounded-lg shadow p-4 flex-1 overflow-hidden flex flex-col">
              {selectedTransaction ? (
                <div ref={printRef} className="overflow-y-auto flex-1">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Price</th>
                        <th className="text-left p-2">Quantity</th>
                        <th className="text-left p-2">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTransaction.items.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{item.name}</td>
                          <td className="p-2">{item.price}</td>
                          <td className="p-2">{item.quantity}</td>
                          <td className="p-2">{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <p className="text-lg mb-2">No order selected</p>
                    <p>Click on an order from the list to view details</p>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Section */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="space-y-4">
                <div className="text-xl font-bold">
                  Total: ₱{selectedTransaction?.TAmount || 0}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center text-lg">₱ Cash</span>
                    <input
                      type="number"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      className="border p-2 w-24 rounded"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex items-center text-lg">
                    <ArrowLeftRight size={18} className="mr-1" /> Change
                  </span>
                  <span className="text-xl">₱{calculateChange()}</span>
                </div>

                <button
                  onClick={handlePrint}
                  disabled={!selectedTransaction}
                  className={`w-full p-2 rounded flex items-center justify-center ${
                    selectedTransaction
                      ? "bg-customOrange hover:bg-orange-600"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                >
                  <Printer size={16} className="mr-1" /> Print
                </button>
              </div>
            </div>
          </div>
        </div>
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

export default CashierScreen;
