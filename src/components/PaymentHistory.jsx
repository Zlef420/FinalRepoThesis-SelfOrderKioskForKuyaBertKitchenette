import React, { useState } from "react";

const PaymentHistory = ({ searchTerm, setSearchTerm }) => {
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Sample payment history data
  const [payments] = useState([
    {
      id: "P001",
      amount: 396,
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
      amount: 550,
      method: "Credit Card",
      status: "Processing",
      date: "29/11/24",
      customer: "Jane Smith",
      details: [
        { item: "Service Fee", amount: 450 },
        { item: "Tax", amount: 100 },
      ],
    },
  ]);

  const filteredPayments = payments.filter(
    (payment) =>
      payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 h-[calc(100vh-160px)] overflow-hidden">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search payments..."
          className="w-full p-2 bg-gray-200 rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex gap-4 h-full">
        {/* Left side - Payment details */}
        <div className="w-1/2 overflow-y-auto">
          {selectedPayment ? (
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-600">Payment ID</p>
                  <p className="font-medium">{selectedPayment.id}</p>
                </div>
                <div>
                  <p className="text-gray-600">Customer</p>
                  <p className="font-medium">{selectedPayment.customer}</p>
                </div>
                <div>
                  <p className="text-gray-600">Method</p>
                  <p className="font-medium">{selectedPayment.method}</p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  <p className="font-medium">{selectedPayment.status}</p>
                </div>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 text-left">Item</th>
                    <th className="border p-2 text-left">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPayment.details.map((detail, index) => (
                    <tr key={index}>
                      <td className="border p-2">{detail.item}</td>
                      <td className="border p-2">₱{detail.amount}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td className="border p-2 font-semibold">Total</td>
                    <td className="border p-2 font-semibold">
                      ₱{selectedPayment.amount}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-4">
              Select a payment to view details
            </div>
          )}
        </div>

        {/* Right side - Payment list */}
        <div className="w-1/2 overflow-y-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 text-left">ID</th>
                <th className="border p-2 text-left">Customer</th>
                <th className="border p-2 text-left">Amount</th>
                <th className="border p-2 text-left">Method</th>
                <th className="border p-2 text-left">Status</th>
                <th className="border p-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr
                  key={payment.id}
                  className={`cursor-pointer hover:bg-gray-100 ${
                    selectedPayment?.id === payment.id ? "bg-blue-100" : ""
                  }`}
                  onClick={() => setSelectedPayment(payment)}
                >
                  <td className="border p-2">{payment.id}</td>
                  <td className="border p-2">{payment.customer}</td>
                  <td className="border p-2">₱{payment.amount}</td>
                  <td className="border p-2">{payment.method}</td>
                  <td className="border p-2">{payment.status}</td>
                  <td className="border p-2">{payment.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
