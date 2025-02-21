import React, { useState } from "react";

const TransactionList = ({ searchTerm, setSearchTerm }) => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Sample transaction data
  const [transactions] = useState([
    {
      ORN: "420",
      TAmount: 396,
      RefNum: "A7B9D2P",
      TranDate: "30/11/24",
      items: [
        { name: "Sisig", price: 99, quantity: 1, PStat: "Pending", PMthd: "" },
        { name: "Carbonara", price: 99, quantity: 1, PStat: "", PMthd: "Cash" },
        { name: "Halo-halo", price: 99, quantity: 1, PStat: "", PMthd: "" },
        { name: "Lemon Juice", price: 99, quantity: 1, PStat: "", PMthd: "" },
      ],
    },
    {
      ORN: "419",
      TAmount: 123,
      RefNum: "B7B9D2P",
      TranDate: "30/11/24",
      items: [
        {
          name: "Sisig",
          price: 99,
          quantity: 1,
          PStat: "Completed",
          PMthd: "Cash",
        },
      ],
    },
  ]);

  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.ORN.includes(searchTerm) ||
      transaction.RefNum.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 h-[calc(100vh-160px)] overflow-hidden">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search transactions..."
          className="w-full p-2 bg-gray-200 rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex gap-4 h-full">
        {/* Left side - Transaction list (moved from right) */}
        <div className="w-1/2 overflow-y-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 text-left">ORN</th>
                <th className="border p-2 text-left">TAmount</th>
                <th className="border p-2 text-left">RefNum</th>
                <th className="border p-2 text-left">TranDate</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr
                  key={transaction.ORN}
                  className={`cursor-pointer hover:bg-gray-200 ${
                    selectedTransaction?.ORN === transaction.ORN
                      ? "bg-blue-100"
                      : ""
                  }`}
                  onClick={() => setSelectedTransaction(transaction)}
                >
                  <td className="border p-2">{transaction.ORN}</td>
                  <td className="border p-2">{transaction.TAmount}</td>
                  <td className="border p-2">{transaction.RefNum}</td>
                  <td className="border p-2">{transaction.TranDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right side - Transaction details (moved from left) */}
        <div className="w-1/2 overflow-y-auto">
          {selectedTransaction ? (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 text-left">Name</th>
                  <th className="border p-2 text-left">Price</th>
                  <th className="border p-2 text-left">Qntty</th>
                  <th className="border p-2 text-left">PStat</th>
                  <th className="border p-2 text-left">PMthd</th>
                </tr>
              </thead>
              <tbody>
                {selectedTransaction.items.map((item, index) => (
                  <tr key={index}>
                    <td className="border p-2">{item.name}</td>
                    <td className="border p-2">{item.price}</td>
                    <td className="border p-2">{item.quantity}</td>
                    <td className="border p-2">{item.PStat}</td>
                    <td className="border p-2">{item.PMthd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center text-gray-500 mt-4">
              Select a transaction to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionList;
