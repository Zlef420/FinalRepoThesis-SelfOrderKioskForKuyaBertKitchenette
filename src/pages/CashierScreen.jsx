import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const CashierScreen = () => {
  const [transactions] = useState([
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

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [cashAmount, setCashAmount] = useState("500");

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
  };

  const calculateChange = () => {
    if (!selectedTransaction || !cashAmount) return 0;
    return Number(cashAmount) - selectedTransaction.TAmount;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col p-4 gap-4 bg-gray-100">
        <div className="flex gap-4 flex-1">
          {/* Left Side - Order Details */}
          <div className="w-1/2 flex flex-col gap-4">
            <div className="bg-white rounded-lg shadow p-4 flex-1">
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
                  {selectedTransaction?.items.map((item, index) => (
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

            {/* Payment Section */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="space-y-4">
                <div className="text-xl font-bold">
                  Total: ₱{selectedTransaction?.TAmount || 0}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💵 Cash</span>
                    <input
                      type="number"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      className="border p-2 w-24 rounded"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-lg">🔄 Change</span>
                  <span className="text-xl">₱{calculateChange()}</span>
                </div>

                <button className="w-full bg-gray-200 p-2 rounded">
                  Print
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Transactions List */}
          <div className="w-1/2 bg-white rounded-lg shadow p-4">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search"
                className="w-full p-2 border rounded bg-gray-100"
              />
            </div>

            <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
              <table className="w-full">
                <thead className="bg-gray-100">
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
                      className={`cursor-pointer hover:bg-gray-50 border-b ${
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
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CashierScreen;
