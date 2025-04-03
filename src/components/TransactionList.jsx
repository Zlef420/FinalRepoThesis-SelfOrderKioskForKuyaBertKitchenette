import React, { useState, useEffect } from "react"; // Added useEffect

// Helper function to get status badge styles (can be reused or kept separate)
const getStatusClasses = (status) => {
  // Handle potential null/empty strings gracefully
  const lowerStatus = status?.toLowerCase() || "";
  switch (lowerStatus) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "processing": // Example if needed
      return "bg-blue-100 text-blue-800";
    case "cancelled": // Example
    case "failed": // Example
      return "bg-red-100 text-red-800";
    case "": // Handle empty status if needed
      return "text-gray-400 italic"; // Example for empty status
    default:
      return "bg-gray-100 text-gray-800";
  }
};

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
        {
          name: "Carbonara",
          price: 99,
          quantity: 1,
          PStat: "Completed",
          PMthd: "Cash",
        }, // Added completed status
        { name: "Halo-halo", price: 99, quantity: 1, PStat: "", PMthd: "" }, // Empty status
        {
          name: "Lemon Juice",
          price: 99,
          quantity: 1,
          PStat: "Cancelled",
          PMthd: "",
        }, // Added cancelled status
      ],
    },
    {
      ORN: "419",
      TAmount: 123.5, // Example with decimals
      RefNum: "B7B9D2P",
      TranDate: "30/11/24",
      items: [
        {
          name: "Sisig",
          price: 123.5,
          quantity: 1,
          PStat: "Completed",
          PMthd: "Cash",
        },
      ],
    },
    {
      ORN: "418",
      TAmount: 250,
      RefNum: "C1E8F3G",
      TranDate: "29/11/24",
      items: [
        {
          name: "Pizza Slice",
          price: 150,
          quantity: 1,
          PStat: "Completed",
          PMthd: "GCash",
        },
        {
          name: "Coke",
          price: 50,
          quantity: 2,
          PStat: "Completed",
          PMthd: "GCash",
        },
      ],
    },
  ]);

  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.ORN.toLowerCase().includes(searchTerm.toLowerCase()) || // Case-insensitive
      transaction.RefNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.TranDate.includes(searchTerm) || // Search by date
      transaction.TAmount.toString().includes(searchTerm) // Search by amount
  );

  // Reset selected transaction if it's filtered out
  useEffect(() => {
    if (
      selectedTransaction &&
      !filteredTransactions.some((t) => t.ORN === selectedTransaction.ORN)
    ) {
      setSelectedTransaction(null);
    }
  }, [filteredTransactions, selectedTransaction]);

  return (
    // Removed height and overflow - parent component now controls scroll if needed
    <div className="p-4">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search transactions (ORN, RefNum, Date, Amount)..."
          className="w-full p-2 bg-gray-100 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500" // Adjusted style
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Responsive flex layout: column on small, row on medium+ */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left side - Transaction list */}
        {/* Width: full on small, half on medium+. Added overflow-auto for small screens ONLY. */}
        {/* Added min-h-[200px] */}
        <div className="w-full md:w-1/2 overflow-auto md:overflow-visible min-h-[200px]">
          <div className="overflow-x-auto">
            {" "}
            {/* Ensure table scrolls horizontally if needed */}
            <table className="w-full border-collapse text-sm min-w-[500px] md:min-w-full">
              {" "}
              {/* Min-width for horizontal scroll */}
              <thead className="sticky top-0 bg-gray-100 z-10">
                <tr>
                  <th className="border p-2 text-left font-semibold">ORN</th>
                  <th className="border p-2 text-left font-semibold">
                    Total Amount
                  </th>{" "}
                  {/* Renamed */}
                  <th className="border p-2 text-left font-semibold">
                    Reference
                  </th>{" "}
                  {/* Renamed */}
                  <th className="border p-2 text-left font-semibold">
                    Date
                  </th>{" "}
                  {/* Renamed */}
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction.ORN}
                      className={`cursor-pointer hover:bg-gray-100 ${
                        selectedTransaction?.ORN === transaction.ORN
                          ? "bg-orange-100" // Use consistent selection color
                          : "bg-white"
                      }`}
                      onClick={() => setSelectedTransaction(transaction)}
                    >
                      <td className="border p-2 whitespace-nowrap">
                        {transaction.ORN}
                      </td>
                      {/* Format currency */}
                      <td className="border p-2 whitespace-nowrap">
                        ₱{transaction.TAmount.toFixed(2)}
                      </td>
                      <td className="border p-2 whitespace-nowrap">
                        {transaction.RefNum}
                      </td>
                      <td className="border p-2 whitespace-nowrap">
                        {transaction.TranDate}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="text-center p-4 text-gray-500 border"
                    >
                      No matching transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right side - Transaction details */}
        {/* Width: full on small, half on medium+. Added overflow-auto for small screens ONLY. */}
        {/* Added min-h-[200px] */}
        <div className="w-full md:w-1/2 overflow-auto md:overflow-visible min-h-[200px]">
          {selectedTransaction ? (
            // Added background, shadow, border for consistency
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200 h-full">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Transaction Details (ORN: {selectedTransaction.ORN})
              </h3>
              <div className="overflow-x-auto">
                {" "}
                {/* Scroll horizontally if needed */}
                <table className="w-full border-collapse text-sm min-w-[450px] md:min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border p-2 text-left font-semibold">
                        Item Name
                      </th>{" "}
                      {/* Renamed */}
                      <th className="border p-2 text-right font-semibold">
                        Price
                      </th>{" "}
                      {/* Aligned Right */}
                      <th className="border p-2 text-center font-semibold">
                        Quantity
                      </th>{" "}
                      {/* Centered */}
                      <th className="border p-2 text-center font-semibold">
                        Status
                      </th>{" "}
                      {/* Centered */}
                      <th className="border p-2 text-left font-semibold">
                        Payment Method
                      </th>{" "}
                      {/* Renamed */}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTransaction.items.map((item, index) => (
                      <tr key={index} className="bg-white hover:bg-gray-50">
                        <td className="border p-2">{item.name}</td>
                        {/* Format currency, align right */}
                        <td className="border p-2 text-right">
                          ₱{item.price.toFixed(2)}
                        </td>
                        {/* Align center */}
                        <td className="border p-2 text-center">
                          {item.quantity}
                        </td>
                        {/* Status Badge */}
                        <td className="border p-2 text-center whitespace-nowrap">
                          {item.PStat ? (
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(
                                item.PStat
                              )}`}
                            >
                              {item.PStat}
                            </span>
                          ) : (
                            <span className={getStatusClasses(item.PStat)}>
                              -
                            </span> // Display dash if status is empty
                          )}
                        </td>
                        <td className="border p-2">{item.PMthd || "-"}</td>{" "}
                        {/* Display dash if method is empty */}
                      </tr>
                    ))}
                    {/* Optional: Add a summary row for total amount again if desired */}
                    <tr className="bg-gray-100 font-bold">
                      <td className="border p-2 text-right" colSpan="4">
                        Total Transaction Amount:
                      </td>
                      <td className="border p-2 text-right">
                        ₱{selectedTransaction.TAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            // Improved placeholder style
            <div className="flex items-center justify-center h-full text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300 p-4 min-h-[200px]">
              Select a transaction from the list to view item details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionList;
