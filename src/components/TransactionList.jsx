import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient"; // Import Supabase client

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
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionItems, setTransactionItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemsError, setItemsError] = useState(null);
  const printSectionRef = useRef(null);

  // Fetch transactions from trans_table
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('trans_table')
          .select('*') // Select all columns for now, can be optimized later
          .order('trans_date', { ascending: false })
          .order('trans_time', { ascending: false });

        if (error) throw error;
        setTransactions(data || []);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError(err.message || "Failed to fetch transactions.");
        setTransactions([]); // Clear transactions on error
      }
      setLoading(false);
    };

    fetchTransactions();
  }, []);

  // Fetch transaction items when a transaction is selected
  useEffect(() => {
    if (selectedTransaction && selectedTransaction.trans_id) {
      const fetchTransactionItems = async () => {
        setLoadingItems(true);
        setItemsError(null);
        try {
          const { data, error } = await supabase
            .from('trans_items_table')
            .select('*') // Adjust columns as needed: e.g., 'prdct_name, unit_price, quantity, addons_details'
            .eq('fk_trans_id', selectedTransaction.trans_id);

          if (error) throw error;
          setTransactionItems(data || []);
        } catch (err) {
          console.error("Error fetching transaction items:", err);
          setItemsError(err.message || "Failed to fetch transaction items.");
          setTransactionItems([]);
        }
        setLoadingItems(false);
      };
      fetchTransactionItems();
    } else {
      setTransactionItems([]); // Clear items if no transaction is selected
    }
  }, [selectedTransaction]);

  // Handle print functionality
  const handlePrint = () => {
    if (selectedTransaction) {
      // Get the payment method from the first item with a valid payment method
      const paymentMethod = selectedTransaction.pymnt_method === 1 ? 'Cash' : selectedTransaction.pymnt_method === 2 ? 'E-Wallet' : '-';
      
      // Calculate subtotal and VAT (assuming 12% VAT included in TAmount)
      const subtotal = (selectedTransaction.total_amntdue || 0) / 1.12;
      const vatAmount = (selectedTransaction.total_amntdue || 0) - subtotal;
      
      const currentDate = new Date();
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Transaction Receipt - ORN: ${selectedTransaction.order_number}</title>
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
                <p>Order Number: ${selectedTransaction.order_number}</p>
                <p>Reference Number: ${selectedTransaction.ref_number}</p>
                <p>Payment Method: ${paymentMethod}</p>
                <p>Status: ${selectedTransaction.pymnt_status}</p>
                <p>Date: ${currentDate.toLocaleDateString()} Time: ${currentDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                })}</p>
              </div>
              
              <div class="receipt-items">
                ${transactionItems.map(item => {
                  let addonsText = '';
                  if (item.addons_details && Array.isArray(item.addons_details) && item.addons_details.length > 0) {
                    addonsText = `
                      <div class="addon-info">
                        <span class="bold">Add-ons: </span>
                        ${item.addons_details.map(addon => `${addon.name}${addon.quantity > 1 ? ` x${addon.quantity}` : ''}`).join(', ')}
                      </div>
                    `;
                  }
                  return `
                    <div class="item">
                      <div class="item-row">
                        <span>${item.quantity} ${item.prdct_name || 'N/A'}</span>
                        <span>₱${((item.unit_price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                      </div>
                      ${addonsText}
                    </div>
                  `;
                }).join('')}
              </div>
              
              <div class="receipt-summary">
                <div class="summary-row">
                  <span>${transactionItems.length} Item(s)</span>
                  <span>Subtotal ₱${subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-row bold">
                  <span>TOTAL DUE</span>
                  <span>₱${selectedTransaction.total_amntdue.toFixed(2)}</span>
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

  const filteredTransactions = transactions.filter((transaction) => {
    return (
      (transaction.order_number?.toString().toLowerCase().includes(searchTerm.toLowerCase())) || // ORN is order_number // Case-insensitive
      (transaction.pymnt_status?.toLowerCase().includes(searchTerm.toLowerCase())) || // Payment status
      (transaction.trans_date?.includes(searchTerm)) || // Search by date - fixed field name
      (transaction.total_amntdue?.toString().includes(searchTerm)) // Total Amount // Search by amount
    );
  });

  // Reset selected transaction if it's filtered out
  useEffect(() => {
    if (
      selectedTransaction &&
      !filteredTransactions.some((t) => t.order_number === selectedTransaction.order_number)
    ) {
      setSelectedTransaction(null);
    }
  }, [filteredTransactions, selectedTransaction]);

  return (
    <div className="p-4">

      {/* Responsive flex layout: column on small, row on medium+ */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left side - Transaction list */}
        {/* Width: full on small, half on medium+. Added overflow-auto for small screens ONLY. */}
        {/* Added min-h-[200px] */}
        <div className="w-full md:w-1/2 flex flex-col min-h-[200px]">
          <div className="sticky top-0 z-20 bg-white py-2">
            <input
              type="text"
              placeholder="Search transactions..."
              className="w-full p-2 bg-gray-100 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500" // Adjusted style
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="overflow-x-auto overflow-y-auto flex-1 max-h-[calc(80vh-56px)]">
            <table className="w-full border-collapse text-sm min-w-[600px] md:min-w-full">
              <thead className="sticky top-0 bg-gray-100 z-10">
                <tr>
                  <th className="border p-2 text-left font-semibold w-20">Order #</th>
                  <th className="border p-2 text-left font-semibold">Ref #</th>
                  <th className="border p-2 text-left font-semibold w-40">Date/Time</th>
                  <th className="border p-2 text-left font-semibold w-32">Total</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="text-center p-4 text-gray-500 border">Loading transactions...</td></tr>
                ) : error ? (
                  <tr><td colSpan="4" className="text-center p-4 text-red-500 border">Error: {error}</td></tr>
                ) : filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction.trans_id}
                      className={`cursor-pointer hover:bg-gray-100 ${
                        selectedTransaction?.trans_id === transaction.trans_id
                          ? "bg-orange-100"
                          : "bg-white"
                      }`}
                      onClick={() => setSelectedTransaction(transaction)}
                    >
                      <td className="border p-2 whitespace-nowrap">
                        {transaction.order_number}
                      </td>
                      <td className="border p-2 whitespace-nowrap">
                        {transaction.ref_number}
                      </td>
                      <td className="border p-2 whitespace-nowrap">
                        {`${new Date(transaction.trans_date).toLocaleDateString()} ${transaction.trans_time}`}
                      </td>
                      <td className="border p-2 whitespace-nowrap text-right">
                        ₱{(transaction.total_amntdue || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center p-4 text-gray-500 border">
                      No matching transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right side - Transaction details */}
        <div className="w-full md:w-1/2 overflow-auto max-h-[80vh] min-h-[200px]">
          {selectedTransaction ? (
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200 h-full">
            {/* Transaction Header Info - Redesigned to match Payment History */}
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Transaction Details</h2>
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm print:hidden flex items-center"
                disabled={!selectedTransaction || transactionItems.length === 0 || loadingItems}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Receipt
              </button>
            </div>

            {/* Transaction Info Card - Redesigned to match Payment History */}
            <div className="p-3 bg-gray-50 rounded border border-gray-200 mb-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p><span className="font-semibold">Order Number:</span> {selectedTransaction.order_number}</p>
                <p><span className="font-semibold">Reference No:<br /></span> {selectedTransaction.ref_number}</p>
                <p><span className="font-semibold">Date:</span> {new Date(selectedTransaction.trans_date).toLocaleDateString()}</p>
                <p><span className="font-semibold">Time:</span> {selectedTransaction.trans_time}</p>
                <p><span className="font-semibold">Payment Method:</span> {selectedTransaction.pymnt_method}</p>
                <p>
                  <span className="font-semibold">Payment Status:</span>
                  <span className={`ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(selectedTransaction.pymnt_status)}`}>
                    {selectedTransaction.pymnt_status}
                  </span>
                </p>
                <p>
                  <span className="font-semibold">Order Status:</span>
                  <span className={`ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(selectedTransaction.order_status)}`}>
                    {selectedTransaction.order_status}
                  </span>
                </p>
              </div>
            </div>

            {/* Items Table - Redesigned to match Payment History */}
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Items Ordered</h3>
              <table className="w-full border-collapse text-sm mb-4">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="border p-2 text-left font-semibold">Product Name</th>
                    <th className="border p-2 text-right font-semibold w-32">Unit Price</th>
                    <th className="border p-2 text-center font-semibold w-24">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingItems ? (
                    <tr><td colSpan="3" className="text-center p-4 text-gray-500">Loading items...</td></tr>
                  ) : itemsError ? (
                    <tr><td colSpan="3" className="text-center p-4 text-red-500">Error: {itemsError}</td></tr>
                  ) : transactionItems.length > 0 ? (
                    transactionItems.map((item) => (
                      <React.Fragment key={item.trans_item_id}>
                        <tr className="hover:bg-gray-50">
                          <td className="p-3 text-sm text-gray-700">{item.prdct_name}</td>
                          <td className="p-3 text-sm text-gray-700 text-right">
                            ₱{(item.unit_price || 0).toFixed(2)}
                          </td>
                          <td className="p-3 text-sm text-gray-700 text-center">
                            {item.quantity}
                          </td>
                        </tr>
                        {item.addons_details && Array.isArray(item.addons_details) && item.addons_details.length > 0 && (
                          item.addons_details.map((addon, addonIndex) => (
                            <tr key={`${item.trans_item_id}-addon-${addonIndex}`} className="bg-gray-50 text-xs hover:bg-gray-100">
                              <td className="p-2 pl-6 italic text-gray-600">
                                • {addon.name}
                              </td>
                              <td className="p-2 italic text-gray-600 text-right">
                                {addon.price > 0 ? `₱${(addon.price || 0).toFixed(2)}` : 'Free'}
                              </td>
                              <td className="p-2 italic text-gray-600 text-center">
                                {addon.quantity}
                              </td>
                            </tr>
                          ))
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr><td colSpan="3" className="text-center p-4 text-gray-500">No items in this transaction.</td></tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr className="font-semibold text-gray-700">
                    <td className="p-3 text-right border-t border-gray-200" colSpan="2">Total Transaction Amount:</td>
                    <td className="p-3 text-right border-t border-gray-200">
                      ₱{(selectedTransaction?.total_amntdue || 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300 p-6">
            <div>
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-700">No transaction selected</h3>
              <p className="mt-1 text-sm text-gray-500">Select a transaction from the list to view its details.</p>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Hidden print section */}
    <div style={{ display: "none" }}>
      <div ref={printSectionRef}>
        {/* Content will be set by handlePrint */}
      </div>
    </div>
  </div>
);
};

export default TransactionList;