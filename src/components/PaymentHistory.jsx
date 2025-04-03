import React, { useState } from "react";

// Helper function to get status badge styles
const getStatusClasses = (status) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "failed": // Example for another status
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const PaymentHistory = ({ searchTerm, setSearchTerm }) => {
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Sample payment history data (Tax included in details for calculation reference, but will be filtered out in display)
  // NOTE: The top-level 'amount' should represent the true total including any tax for accuracy in the main list.
  // The details view will show the breakdown excluding tax, but the total row will still show the top-level 'amount'.
  const [payments] = useState([
    {
      id: "P001",
      amount: 396, // 296 + 100
      method: "Cash",
      status: "Completed",
      date: "30/11/24",
      customer: "John Doe",
      details: [
        { item: "Service Fee", amount: 296 },
        { item: "Tax", amount: 100 },
      ],
    },
    {
      id: "P002",
      amount: 550, // 450 + 100
      method: "Credit Card",
      status: "Processing",
      date: "29/11/24",
      customer: "Jane Smith",
      details: [
        { item: "Service Fee", amount: 450 },
        { item: "Tax", amount: 100 },
      ],
    },
    {
      id: "P003",
      amount: 120, // 100 + 20
      method: "GCash",
      status: "Completed",
      date: "28/11/24",
      customer: "Alice Brown",
      details: [
        { item: "Product A", amount: 100 },
        { item: "Tax", amount: 20 },
      ],
    },
    {
      id: "P004",
      amount: 850, // 750 + 100
      method: "Bank Transfer",
      status: "Pending",
      date: "27/11/24",
      customer: "Bob Green",
      details: [
        { item: "Consultation", amount: 750 },
        { item: "Tax", amount: 100 },
      ],
    },
    {
      id: "P005",
      amount: 50,
      method: "Cash",
      status: "Failed",
      date: "26/11/24",
      customer: "Charlie Davis",
      details: [
        { item: "Small Fee", amount: 50 },
        // No tax item example
      ],
    },
  ]);

  const filteredPayments = payments.filter(
    (payment) =>
      payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.date.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset selected payment if it's filtered out
  React.useEffect(() => {
    if (
      selectedPayment &&
      !filteredPayments.some((p) => p.id === selectedPayment.id)
    ) {
      setSelectedPayment(null);
    }
  }, [filteredPayments, selectedPayment]);

  return (
    // Removed height and overflow - parent component now controls scroll if needed
    <div className="p-4">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search payments (ID, Customer, Method, Status, Date)..."
          className="w-full p-2 bg-gray-200 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Responsive flex layout: column on small, row on medium+ */}
      {/* Removed explicit height/overflow from children for large screens */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left side - Payment list */}
        {/* Width: full on small, half on medium+. Added overflow-auto for small screens ONLY. */}
        {/* Added min-h-[200px] for better stacking view on small screens */}
        <div className="w-full md:w-1/2 overflow-auto md:overflow-visible min-h-[200px]">
          <div className="overflow-x-auto">
            {" "}
            {/* Ensure table scrolls horizontally if needed on small screens */}
            <table className="w-full border-collapse text-sm min-w-[600px] md:min-w-full">
              {" "}
              {/* Min-width for horizontal scroll */}
              <thead className="sticky top-0 bg-gray-100 z-10">
                <tr>
                  <th className="border p-2 text-left font-semibold">ID</th>
                  <th className="border p-2 text-left font-semibold">
                    Customer
                  </th>
                  <th className="border p-2 text-left font-semibold">Amount</th>
                  <th className="border p-2 text-left font-semibold">Method</th>
                  <th className="border p-2 text-left font-semibold">Status</th>
                  <th className="border p-2 text-left font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className={`cursor-pointer hover:bg-gray-100 ${
                        selectedPayment?.id === payment.id
                          ? "bg-orange-100"
                          : "bg-white"
                      }`}
                      onClick={() => setSelectedPayment(payment)}
                    >
                      <td className="border p-2 whitespace-nowrap">
                        {payment.id}
                      </td>
                      <td className="border p-2 whitespace-nowrap">
                        {payment.customer}
                      </td>
                      <td className="border p-2 whitespace-nowrap">
                        ₱{payment.amount.toFixed(2)}
                      </td>
                      <td className="border p-2 whitespace-nowrap">
                        {payment.method}
                      </td>
                      <td className="border p-2 whitespace-nowrap">
                        {/* Status Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(
                            payment.status
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="border p-2 whitespace-nowrap">
                        {payment.date}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center p-4 text-gray-500 border"
                    >
                      No matching payments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right side - Payment details */}
        {/* Width: full on small, half on medium+. Added overflow-auto for small screens ONLY. */}
        {/* Added min-h-[200px] */}
        <div className="w-full md:w-1/2 overflow-auto md:overflow-visible min-h-[200px]">
          {selectedPayment ? (
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200 h-full">
              {" "}
              {/* Added h-full to match table height on large screens */}
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Payment Details
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Payment ID</p>
                  <p className="font-medium text-gray-900">
                    {selectedPayment.id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium text-gray-900">
                    {selectedPayment.customer}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Method</p>
                  <p className="font-medium text-gray-900">
                    {selectedPayment.method}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  {/* Status Badge in Details */}
                  <p className="font-medium text-gray-900 inline-block">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(
                        selectedPayment.status
                      )}`}
                    >
                      {selectedPayment.status}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium text-gray-900">
                    {selectedPayment.date}
                  </p>
                </div>
              </div>
              <table className="w-full border-collapse text-sm mb-4">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border p-2 text-left font-semibold">Item</th>
                    <th className="border p-2 text-right font-semibold">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Filter out 'Tax' items before mapping */}
                  {selectedPayment.details
                    .filter((detail) => detail.item.toLowerCase() !== "tax")
                    .map((detail, index) => (
                      <tr key={index}>
                        <td className="border p-2">{detail.item}</td>
                        <td className="border p-2 text-right">
                          ₱{detail.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  {/* Total row still shows the original full amount */}
                  <tr className="bg-gray-100">
                    <td className="border p-2 font-bold text-gray-800">
                      Total
                    </td>
                    <td className="border p-2 font-bold text-gray-800 text-right">
                      ₱{selectedPayment.amount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300 p-4 min-h-[200px]">
              Select a payment from the list to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
