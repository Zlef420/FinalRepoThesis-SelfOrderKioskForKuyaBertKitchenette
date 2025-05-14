import React, { useState, useEffect, useRef } from "react"; // Added useRef for print functionality

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
  const printSectionRef = useRef(null);

  // Handle print functionality
  const handlePrint = () => {
    if (selectedTransaction) {
      // Get the payment method from the first item with a valid payment method
      const paymentMethod = selectedTransaction.items.find(item => item.PMthd)?.PMthd || '-';
      
      // Calculate subtotal and VAT (assuming 12% VAT included in TAmount)
      const subtotal = selectedTransaction.TAmount / 1.12;
      const vatAmount = selectedTransaction.TAmount - subtotal;
      
      const currentDate = new Date();
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Transaction Receipt - ORN: ${selectedTransaction.ORN}</title>
            <style>
              @page {
                size: 80mm 297mm;
                margin: 0;
              }
              body {
                font-family: 'Courier New', monospace;
                margin: 0;
                padding: 0;
                width: 80mm;
                background-color: white;
              }
              .receipt {
                width: 100%;
                padding: 5mm;
                box-sizing: border-box;
                text-align: center;
              }
              .receipt-header {
                margin-bottom: 5mm;
              }
              .receipt-header h1 {
                font-size: 16pt;
                margin: 0 0 2mm 0;
              }
              .receipt-header p {
                font-size: 9pt;
                margin: 0 0 1mm 0;
              }
              .receipt-details {
                font-size: 9pt;
                margin-bottom: 3mm;
                text-align: left;
              }
              .receipt-details p {
                margin: 0 0 1mm 0;
              }
              .receipt-items {
                border-top: 1px dashed black;
                border-bottom: 1px dashed black;
                padding: 2mm 0;
                margin: 2mm 0;
                text-align: left;
              }
              .item {
                margin-bottom: 2mm;
              }
              .item-row {
                display: flex;
                justify-content: space-between;
              }
              .addon-info {
                font-size: 8pt;
                margin-left: 4mm;
                font-style: italic;
              }
              .receipt-summary {
                font-size: 9pt;
                text-align: left;
              }
              .summary-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 1mm;
              }
              .bold {
                font-weight: bold;
              }
              .receipt-footer {
                margin-top: 5mm;
                font-size: 9pt;
                border-top: 1px dashed black;
                padding-top: 2mm;
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="receipt-header">
                <h1>Kuya Bert's Kitchenette</h1>
                <p>Sergio Osmeña St, Atimonan, 4331 Quezon</p>
                <p>facebook.com/KuyaBertKitchenette</p>
                <p class="bold">TRANSACTION COPY</p>
              </div>
              
              <div class="receipt-details">
                <p>Order Number: ${selectedTransaction.ORN}</p>
                <p>Reference Number: ${selectedTransaction.RefNum}</p>
                <p>Payment Method: ${paymentMethod}</p>
                <p>Status: ${selectedTransaction.status || '-'}</p>
                <p>Date: ${currentDate.toLocaleDateString()} Time: ${currentDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                })}</p>
              </div>
              
              <div class="receipt-items">
                ${selectedTransaction.items.map((item, index) => `
                  <div class="item">
                    <div class="item-row">
                      <span>${item.quantity} ${item.name}</span>
                      <span>₱${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    ${item.addons && item.addons.length > 0 ? `
                      <div class="addon-info">
                        <span class="bold">Add-ons: </span>
                        ${item.addons.map((addon, idx) => `
                          ${addon.name}${addon.quantity > 1 ? ` x${addon.quantity}` : ''}
                          ${idx < item.addons.length - 1 ? ', ' : ''}
                        `).join('')}
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
              
              <div class="receipt-summary">
                <div class="summary-row">
                  <span>${selectedTransaction.items.length} Item(s)</span>
                  <span>Subtotal ₱${subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-row bold">
                  <span>TOTAL DUE</span>
                  <span>₱${selectedTransaction.TAmount.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                  <span>VATable Sales</span>
                  <span>₱${subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                  <span>VAT Amount</span>
                  <span>₱${vatAmount.toFixed(2)}</span>
                </div>
              </div>
              
              <div class="receipt-footer">
                THANK YOU, AND PLEASE COME AGAIN.
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  // Sample transaction data
  const [transactions] = useState([
    {
      ORN: "420",
      TAmount: 396,
      RefNum: "A7B9D2P",
      TranDate: "30/11/24",
      items: [
        { 
          name: "Sisig", 
          price: 99, 
          quantity: 1, 
          PStat: "Pending", 
          PMthd: "",
          addons: [
            { name: "Extra Rice", price: 20, quantity: 1 },
            { name: "Extra Sauce", price: 10, quantity: 1 }
          ]
        },
        {
          name: "Carbonara",
          price: 99,
          quantity: 1,
          PStat: "Completed",
          PMthd: "Cash",
          addons: []
        }, // Added completed status
        { 
          name: "Halo-halo", 
          price: 99, 
          quantity: 1, 
          PStat: "", 
          PMthd: "",
          addons: [] 
        }, // Empty status
        {
          name: "Lemon Juice",
          price: 99,
          quantity: 1,
          PStat: "Cancelled",
          PMthd: "",
          addons: [
            { name: "Less Ice", price: 0, quantity: 1 }
          ]
        }, // Added cancelled status
      ],
      status: "Completed",
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
          addons: []
        },
      ],
      status: "Completed",
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
          addons: [
            { name: "Extra Cheese", price: 25, quantity: 1 }
          ]
        },
        {
          name: "Coke",
          price: 50,
          quantity: 2,
          PStat: "Completed",
          PMthd: "GCash",
          addons: []
        },
      ],
      status: "Completed",
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

      {/* Responsive flex layout: column on small, row on medium+ */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left side - Transaction list */}
        {/* Width: full on small, half on medium+. Added overflow-auto for small screens ONLY. */}
        {/* Added min-h-[200px] */}
        <div className="w-full md:w-1/2 overflow-auto md:overflow-visible min-h-[200px]">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search transactions..."
              className="w-full p-2 bg-gray-100 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500" // Adjusted style
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200 h-full" ref={printSectionRef}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Transaction Details
                </h3>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrint();
                  }}
                  className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm print:hidden flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Receipt
                </button>
              </div>
              
              {/* Title bar with transaction details */}
              <div className="p-3 bg-gray-50 rounded border border-gray-200 mb-4 title-bar">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p><span className="font-semibold">ORN:</span> {selectedTransaction.ORN}</p>
                  <p><span className="font-semibold">Reference Number:</span> {selectedTransaction.RefNum}</p>
                  <p><span className="font-semibold">Date:</span> {selectedTransaction.TranDate}</p>
                  <p>
                    <span className="font-semibold">Payment Status:</span> 
                    <span className={`ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(selectedTransaction.status)}`}>
                      {selectedTransaction.status || '-'}
                    </span>
                  </p>
                  <p><span className="font-semibold">Payment Method:</span> {selectedTransaction.items[0]?.PMthd || '-'}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                {" "}
                {/* Scroll horizontally if needed */}
                <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                  <table className="w-full border-collapse text-sm min-w-[450px] md:min-w-full">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="border p-2 text-left font-semibold">
                          Item Name
                        </th>
                        <th className="border p-2 text-right font-semibold">
                          Price
                        </th>
                        <th className="border p-2 text-center font-semibold">
                          Quantity
                        </th>
                      </tr>
                    </thead>
                  <tbody>
                    {selectedTransaction.items.map((item, index) => (
                      <React.Fragment key={index}>
                        <tr className="bg-white hover:bg-gray-50">
                          <td className="border p-2">{item.name}</td>
                          {/* Format currency, align right */}
                          <td className="border p-2 text-right">
                            ₱{item.price.toFixed(2)}
                          </td>
                          {/* Align center */}
                          <td className="border p-2 text-center">
                            {item.quantity}
                          </td>
                        </tr>
                        {/* Add-ons section */}
                        {item.addons && item.addons.length > 0 && item.addons.map((addon, addonIndex) => (
                          <tr key={`${index}-addon-${addonIndex}`} className="bg-gray-50">
                            <td className="border p-2 addon-item">
                              • {addon.name}
                            </td>
                            <td className="border p-2 text-right">
                              {addon.price > 0 ? `₱${addon.price.toFixed(2)}` : 'Free'}
                            </td>
                            <td className="border p-2 text-center">
                              {addon.quantity}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                    {/* Summary row for total amount */}
                    <tr className="bg-gray-100 font-bold sticky bottom-0">
                      <td className="border p-2 text-right" colSpan="2">
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
