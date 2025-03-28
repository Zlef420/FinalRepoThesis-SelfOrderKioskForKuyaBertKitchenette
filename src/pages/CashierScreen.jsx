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

// ----- Printable Receipt Component (Adapted from OrderConfirmation) -----
const CashierPrintableReceipt = ({
  transaction,
  cashAmount,
  changeAmount,
  printRef,
}) => {
  if (!transaction) return null; // Don't render if no transaction selected

  const currentDate = new Date();
  // Display "Paid" status on the printed receipt regardless of original status
  const displayPaymentStatus = "PAID";

  // Calculate VAT details if needed (assuming 12% VAT included in TAmount)
  const subtotal = transaction.TAmount / 1.12;
  const vatAmount = transaction.TAmount - subtotal;

  return (
    <div
      ref={printRef}
      id="printable-cashier-receipt-area" // Unique ID for print styling
      className="absolute -left-full -top-full" // Keep off-screen visually
    >
      {/* Print-specific styles */}
      <style type="text/css" media="print">
        {`
      @page {
        size: 80mm auto; /* Adjust width as needed, auto height */
        margin: 2mm; /* Minimal margin */
      }
      @media print {
        /* Basic reset */
        body {
          margin: 0;
          padding: 0;
        }
        /* Hide everything except the receipt */
        body * {
          visibility: hidden; /* Hide everything by default */
        }
        #printable-cashier-receipt-area, #printable-cashier-receipt-area * {
          visibility: visible; /* Show only the receipt area */
        }
        #printable-cashier-receipt-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%; /* Use full printable width */
          font-size: 10pt; /* Adjust font size for thermal printers */
          font-family: 'Courier New', Courier, monospace; /* Monospaced font */
          background-color: white !important; /* Ensure white background */
          padding: 0;
          margin: 0;
          box-shadow: none; /* Remove any screen shadows */
          border: none; /* Remove any screen borders */
        }
        .no-print {
          display: none !important; /* Ensure no-print elements are hidden */
        }
        /* Receipt specific styles */
        #printable-cashier-receipt-area h1 {
          font-size: 14pt;
          font-weight: bold;
          margin-bottom: 2px;
          text-align: center;
        }
        #printable-cashier-receipt-area p,
        #printable-cashier-receipt-area span,
        #printable-cashier-receipt-area div:not(.receipt-item div):not(.receipt-totals div) { /* Avoid double applying flex to nested divs */
          font-size: 10pt;
          margin-bottom: 1px;
          line-height: 1.2;
        }
        #printable-cashier-receipt-area .receipt-header {
          text-align: center;
          margin-bottom: 8px;
        }
        #printable-cashier-receipt-area .receipt-header p {
          margin-bottom: 0; /* tighter spacing in header */
        }
        #printable-cashier-receipt-area .receipt-details p {
          margin-bottom: 2px;
        }
        #printable-cashier-receipt-area .receipt-items {
          border-top: 1px dashed black;
          border-bottom: 1px dashed black;
          padding-top: 5px;
          padding-bottom: 5px;
          margin-top: 5px;
          margin-bottom: 5px;
        }
        /* Styling for item lines and totals lines */
        #printable-cashier-receipt-area .receipt-item div,
        #printable-cashier-receipt-area .receipt-totals div {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px; /* Add space between lines */
        }
        /* Ensure item quantity/name and total are spaced */
        #printable-cashier-receipt-area .receipt-item div span:first-child {
          /* Allow item name to wrap if long */
          flex-shrink: 1;
          margin-right: 5px; /* Add space between name and price */
          word-break: break-word; /* Break long item names */
        }
        /* Right-align prices */
        #printable-cashier-receipt-area .receipt-item div span:last-child,
        #printable-cashier-receipt-area .receipt-totals div span:last-child {
          white-space: nowrap; /* Prevent price from wrapping */
          text-align: right;
          min-width: 50px; /* Ensure some space for alignment */
        }

         #printable-cashier-receipt-area .receipt-totals .total-due {
             font-weight: bold;
             margin-top: 5px;
         }
         /* Style for Change line */
         #printable-cashier-receipt-area .receipt-totals .change-line {
             font-weight: bold;
             border-top: 1px solid black; /* Add separator before change */
             padding-top: 3px;
             margin-top: 3px;
         }
         #printable-cashier-receipt-area .receipt-footer {
             text-align: center;
             margin-top: 8px;
             border-top: 1px dashed black;
             padding-top: 5px;
         }
      }
    `}
      </style>

      {/* Receipt Content */}
      <div className="bg-white p-1 w-full font-mono">
        {" "}
        {/* Simplified padding for print */}
        <div className="receipt-header">
          <h1>Kuya Bert's Kitchenette</h1>
          <p>Sergio Osmeña St, Atimonan, 4331 Quezon</p>
          <p>facebook.com/KuyaBertKitchenette</p>
          <p className="font-bold mt-1">OFFICIAL RECEIPT</p>
        </div>
        <div className="receipt-details text-sm mb-2">
          <p>Order #: {transaction.ORN}</p>
          <p>Ref #: {transaction.RefNum}</p>
          <p>Status: {displayPaymentStatus}</p> {/* Always show PAID here */}
          <p>
            Date: {currentDate.toLocaleDateString()} Time:{" "}
            {currentDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="receipt-items py-2 my-2">
          {transaction.items.map((item, index) => (
            <div key={index} className="receipt-item text-sm">
              <div>
                <span>
                  {item.quantity} {item.name}
                </span>
                <span>{item.total.toFixed(2)}</span>
              </div>
              {/* Optional: Show price per item if needed
             <div style={{ paddingLeft: '15px', fontSize: '9pt' }}>
                <span>@ {item.price.toFixed(2)}</span>
             </div>
            */}
            </div>
          ))}
        </div>
        <div className="receipt-totals text-sm">
          <div>
            <span>{transaction.items.length} Item(s)</span>
            {/* Show Subtotal before VAT details */}
            {/* <span>Subtotal ₱{subtotal.toFixed(2)}</span> */}
          </div>
          <div className="total-due">
            {" "}
            {/* Moved Total Due up */}
            <span>TOTAL DUE</span>
            <span>₱{transaction.TAmount.toFixed(2)}</span>
          </div>
          <div>
            <span>CASH</span>
            <span>₱{Number(cashAmount).toFixed(2)}</span>
          </div>
          <div className="change-line">
            {" "}
            {/* Added class for styling */}
            <span>CHANGE</span>
            <span>₱{changeAmount.toFixed(2)}</span>
          </div>
          {/* VAT Details */}
          <div className="mt-2 pt-1 border-t border-dashed border-black">
            {" "}
            {/* Optional separator */}
            <div>
              <span>VATable Sales</span>
              <span>{subtotal.toFixed(2)}</span>
            </div>
            <div>
              <span>VAT Amount (12%)</span>
              <span>{vatAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="receipt-footer mt-4 text-sm">
          THANK YOU, AND PLEASE COME AGAIN.
        </div>
      </div>
    </div>
  );
};
// ----- End Printable Receipt Component -----

const CashierScreen = () => {
  // ----- Add more dummy data for testing scrolling -----
  const [allTransactions, setAllTransactions] = useState([
    {
      ORN: "420",
      TAmount: 436.0,
      RefNum: "A7B9D2P",
      PaymentStat: "Pending",
      items: [
        { name: "Sisig", price: 99, quantity: 1, total: 99.0 },
        { name: "Carbonara", price: 99, quantity: 1, total: 99.0 },
        { name: "Halo-halo", price: 99, quantity: 1, total: 99.0 },
        { name: "Lemon Juice", price: 99, quantity: 1, total: 99.0 },
        { name: "Extra Rice", price: 20, quantity: 2, total: 40.0 },
      ],
    }, // Adjusted total
    {
      ORN: "419",
      TAmount: 123.0,
      RefNum: "B7B9D2P",
      PaymentStat: "Paid",
      items: [{ name: "Sisig", price: 123, quantity: 1, total: 123.0 }],
    },
    {
      ORN: "421",
      TAmount: 198.0,
      RefNum: "C8C0E3Q",
      PaymentStat: "Pending",
      items: [{ name: "Adobo", price: 99, quantity: 2, total: 198.0 }],
    },
    {
      ORN: "422",
      TAmount: 250.5,
      RefNum: "D9D1F4R",
      PaymentStat: "Pending",
      items: [
        { name: "Burger Steak", price: 120, quantity: 1, total: 120.0 },
        { name: "Fries", price: 80.5, quantity: 1, total: 80.5 },
        { name: "Coke", price: 50, quantity: 1, total: 50.0 },
      ],
    },
    {
      ORN: "423",
      TAmount: 99.0,
      RefNum: "E0E2G5S",
      PaymentStat: "Paid",
      items: [{ name: "Spaghetti", price: 99, quantity: 1, total: 99.0 }],
    },
    {
      ORN: "424",
      TAmount: 150.0,
      RefNum: "F1F3H6T",
      PaymentStat: "Pending",
      items: [{ name: "Pancit Canton", price: 75, quantity: 2, total: 150.0 }],
    },
    {
      ORN: "425",
      TAmount: 45.0,
      RefNum: "G2G4I7U",
      PaymentStat: "Paid",
      items: [{ name: "Coffee", price: 45, quantity: 1, total: 45.0 }],
    },
    {
      ORN: "426",
      TAmount: 330.0,
      RefNum: "H3H5J8V",
      PaymentStat: "Pending",
      items: [{ name: "Chicken Curry", price: 110, quantity: 3, total: 330.0 }],
    },
    {
      ORN: "427",
      TAmount: 180.0,
      RefNum: "I4I6K9W",
      PaymentStat: "Pending",
      items: [{ name: "Bicol Express", price: 90, quantity: 2, total: 180.0 }],
    },
    {
      ORN: "428",
      TAmount: 500.0,
      RefNum: "J5J7L0X",
      PaymentStat: "Paid",
      items: [{ name: "Lechon Kawali", price: 250, quantity: 2, total: 500.0 }],
    },
    {
      ORN: "429",
      TAmount: 75.0,
      RefNum: "K6K8M1Y",
      PaymentStat: "Pending",
      items: [{ name: "Siomai (4pcs)", price: 75, quantity: 1, total: 75.0 }],
    },
    {
      ORN: "430",
      TAmount: 220.0,
      RefNum: "L7L9N2Z",
      PaymentStat: "Pending",
      items: [{ name: "Beef Pares", price: 110, quantity: 2, total: 220.0 }],
    },
    // Add even more items to test scrolling robustly
    {
      ORN: "431",
      TAmount: 88.0,
      RefNum: "M8M0O3A",
      PaymentStat: "Pending",
      items: [{ name: "Lugaw w/ Egg", price: 88, quantity: 1, total: 88.0 }],
    },
    {
      ORN: "432",
      TAmount: 165.0,
      RefNum: "N9N1P4B",
      PaymentStat: "Paid",
      items: [
        { name: "Pork BBQ (3pcs)", price: 55, quantity: 3, total: 165.0 },
      ],
    },
    {
      ORN: "433",
      TAmount: 420.0,
      RefNum: "O0O2Q5C",
      PaymentStat: "Pending",
      items: [
        { name: "Bulalo Special", price: 420, quantity: 1, total: 420.0 },
      ],
    },
    {
      ORN: "434",
      TAmount: 95.0,
      RefNum: "P1P3R6D",
      PaymentStat: "Pending",
      items: [{ name: "Tokwa't Baboy", price: 95, quantity: 1, total: 95.0 }],
    },
    {
      ORN: "435",
      TAmount: 130.0,
      RefNum: "Q2Q4S7E",
      PaymentStat: "Paid",
      items: [{ name: "Silog Tapa", price: 130, quantity: 1, total: 130.0 }],
    },
  ]);
  // ----- End Dummy Data -----

  const [transactions, setTransactions] = useState(allTransactions);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [cashAmount, setCashAmount] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const printRef = useRef(); // Ref for the printable component

  const { logout, currentEmail } = useAuth();
  const navigate = useNavigate();

  // Effect for filtering transactions based on search query
  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase().trim();
    if (lowerCaseQuery === "") {
      setTransactions(allTransactions);
    } else {
      const filteredTransactions = allTransactions.filter(
        (transaction) =>
          transaction.ORN.toLowerCase().includes(lowerCaseQuery) ||
          transaction.RefNum.toLowerCase().includes(lowerCaseQuery) ||
          transaction.PaymentStat.toLowerCase().includes(lowerCaseQuery) ||
          transaction.TAmount.toFixed(2).includes(lowerCaseQuery) // Search formatted amount
      );
      setTransactions(filteredTransactions);
    }
  }, [searchQuery, allTransactions]); // Re-run filter when allTransactions changes too

  // Effect to update the displayed list and selected item when the master list changes
  useEffect(() => {
    // Update displayed transactions based on allTransactions (needed after status change)
    const lowerCaseQuery = searchQuery.toLowerCase().trim();
    const currentTransactions =
      lowerCaseQuery === ""
        ? allTransactions
        : allTransactions.filter(
            (transaction) =>
              transaction.ORN.toLowerCase().includes(lowerCaseQuery) ||
              transaction.RefNum.toLowerCase().includes(lowerCaseQuery) ||
              transaction.PaymentStat.toLowerCase().includes(lowerCaseQuery) ||
              transaction.TAmount.toFixed(2).includes(lowerCaseQuery)
          );
    setTransactions(currentTransactions);

    // Update selectedTransaction details if it's still selected after the update
    if (selectedTransaction) {
      const updatedSelected = allTransactions.find(
        (t) => t.ORN === selectedTransaction.ORN
      );
      setSelectedTransaction(updatedSelected || null); // Deselect if it was somehow removed
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTransactions, searchQuery]); // Rerun when master list or search query changes

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    // Pre-fill cash amount with the exact total due
    setCashAmount(transaction.TAmount.toFixed(2));
  };

  const calculateChange = () => {
    if (!selectedTransaction || !cashAmount || isNaN(Number(cashAmount)))
      return 0;
    const cash = Number(cashAmount);
    const total = selectedTransaction.TAmount;
    // Ensure change isn't negative if cash entered is less than total
    return cash >= total ? cash - total : 0;
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
    // In a real app, you might re-fetch data here instead of just resetting state
    // setAllTransactions(fetchData()); // Example if fetchData was defined
    setTransactions(allTransactions); // Reset filter view to full list
    setSelectedTransaction(null);
    setCashAmount("");
  };

  // Updated Print Handler
  const handlePrint = () => {
    if (!selectedTransaction) return;

    const isPending = selectedTransaction.PaymentStat === "Pending";

    // --- Trigger Print ---
    // Consider adding a small delay if render updates don't reflect immediately before print dialog
    // setTimeout(() => { window.print(); }, 100);
    window.print();

    // --- Simulate Payment Completion (Update State) ---
    // If the transaction was pending, update its status to 'Paid' in the master state list
    if (isPending) {
      setAllTransactions((prevAllTransactions) =>
        prevAllTransactions.map(
          (t) =>
            t.ORN === selectedTransaction.ORN
              ? { ...t, PaymentStat: "Paid" } // Create new object with updated status
              : t // Keep other transactions as they are
        )
      );
      // The useEffect hook watching `allTransactions` will automatically update
      // the `transactions` list shown on screen and the `selectedTransaction` details.

      // Optional: Clear cash amount or selection after successful payment/print
      // setCashAmount("");
      // setSelectedTransaction(null);
    }
  };

  // Calculate change once per render cycle for efficiency
  const change = calculateChange();
  // Determine if the print button should be enabled
  const canPrint =
    selectedTransaction &&
    cashAmount &&
    !isNaN(Number(cashAmount)) &&
    Number(cashAmount) >= selectedTransaction.TAmount;

  return (
    // --- Main container: Full screen height, flex column, relative for modal positioning, prevent body scroll ---
    <div className="h-screen flex flex-col relative overflow-hidden">
      <Header />

      {/* --- Render the hidden printable receipt component --- */}
      {/* It's positioned off-screen but available for the print CSS */}
      <CashierPrintableReceipt
        transaction={selectedTransaction}
        cashAmount={cashAmount}
        changeAmount={change}
        printRef={printRef}
      />

      {/* --- Content Area: Takes remaining space, flex column, prevents its own overflow --- */}
      <div className="flex-1 flex flex-col p-4 gap-4 bg-gray-100 print:hidden overflow-hidden">
        {" "}
        {/* Added overflow-hidden */}
        {/* --- Horizontal Layout: Takes remaining space in content area, uses flex row, prevents overflow --- */}
        <div className="flex gap-4 flex-1 overflow-hidden">
          {" "}
          {/* Added flex-1 and overflow-hidden */}
          {/* === Left Side - Transactions List === */}
          {/* --- Flex column, takes its width percentage, gap between children --- */}
          <div className="w-2/5 flex flex-col gap-4">
            {/* --- White Box (Transaction List): Takes available space, flex column, hides overflow --- */}
            <div className="bg-white rounded-lg shadow p-4 flex-1 flex flex-col overflow-hidden">
              {" "}
              {/* Added flex-1, flex-col, overflow-hidden */}
              {/* Search Bar (Fixed height) */}
              <div className="mb-4 relative shrink-0">
                {" "}
                {/* shrink-0 prevents shrinking */}
                <input
                  type="text"
                  placeholder="Search ORN, RefNum, Status, Amount"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 pl-2 pr-10 border rounded bg-gray-100 focus:outline-none focus:ring-1 focus:ring-customOrange"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
              </div>
              {/* --- Scrollable Table Container: Takes remaining space, enables vertical scroll --- */}
              <div className="flex-1 overflow-y-auto">
                {" "}
                {/* Added flex-1 and overflow-y-auto */}
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    {" "}
                    {/* Sticky header */}
                    <tr>
                      <th className="p-2 text-left font-semibold">ORN</th>
                      <th className="p-2 text-left font-semibold">Total</th>
                      <th className="p-2 text-left font-semibold">RefNum</th>
                      <th className="p-2 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length > 0 ? (
                      transactions.map((transaction) => (
                        <tr
                          key={transaction.ORN}
                          onClick={() => handleTransactionClick(transaction)}
                          className={`cursor-pointer hover:bg-gray-200 border-b border-gray-200 ${
                            selectedTransaction?.ORN === transaction.ORN
                              ? "bg-blue-100 font-medium" // Highlight selected row
                              : "hover:bg-gray-100"
                          }`}
                        >
                          <td className="p-2">{transaction.ORN}</td>
                          <td className="p-2">
                            ₱{transaction.TAmount.toFixed(2)}
                          </td>
                          <td className="p-2">{transaction.RefNum}</td>
                          <td
                            className={`p-2 font-medium ${
                              transaction.PaymentStat === "Paid"
                                ? "text-green-600"
                                : transaction.PaymentStat === "Pending"
                                ? "text-orange-500"
                                : "text-gray-500" // Fallback color
                            }`}
                          >
                            {transaction.PaymentStat}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="text-center text-gray-500 py-6"
                        >
                          No transactions found
                          {searchQuery ? ' matching "' + searchQuery + '"' : ""}
                          .
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Logout and Refresh Buttons (Fixed height) */}
            <div className="flex justify-between px-1 shrink-0">
              {" "}
              {/* shrink-0 prevents shrinking */}
              <button
                onClick={() => setShowLogoutModal(true)}
                className="bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded text-sm transition-colors duration-150"
              >
                Log-out
              </button>
              <button
                onClick={handleRefresh}
                className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center text-sm transition-colors duration-150"
              >
                <RefreshCw size={16} />
                <span className="ml-1">Refresh</span>
              </button>
            </div>
          </div>
          {/* === End Left Side === */}
          {/* === Right Side - Order Details and Payment === */}
          {/* --- Flex column, takes its width percentage, defines gap between children --- */}
          <div className="w-3/5 flex flex-col gap-4">
            {/* --- Order Details Box: Takes available space (flex-1), flex column, hides overflow --- */}
            <div className="bg-white rounded-lg shadow p-4 flex-1 flex flex-col overflow-hidden">
              {" "}
              {/* Added flex-1, flex-col, overflow-hidden */}
              <h3 className="text-lg font-semibold mb-2 border-b pb-2 shrink-0">
                Order Details
              </h3>{" "}
              {/* shrink-0 prevents shrinking */}
              {selectedTransaction ? (
                // --- Scrollable Item List: Takes remaining space, enables vertical scroll ---
                <div className="flex-1 overflow-y-auto">
                  {" "}
                  {/* Added flex-1 and overflow-y-auto */}
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white z-10">
                      {" "}
                      {/* Sticky header */}
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold">Name</th>
                        <th className="text-right p-2 font-semibold">Price</th>
                        <th className="text-center p-2 font-semibold">Qty</th>
                        <th className="text-right p-2 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTransaction.items.map((item, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-200 last:border-b-0"
                        >
                          <td className="p-2">{item.name}</td>
                          <td className="p-2 text-right">
                            ₱{item.price.toFixed(2)}
                          </td>
                          <td className="p-2 text-center">{item.quantity}</td>
                          <td className="p-2 text-right font-medium">
                            ₱{item.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                // --- Placeholder: Centers content vertically and horizontally ---
                <div className="flex-1 flex items-center justify-center text-center text-gray-500">
                  {" "}
                  {/* Added flex-1 */}
                  <div>
                    <p className="text-base mb-1">No order selected</p>
                    <p className="text-sm">
                      Click an order from the list to view details and process
                      payment.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* --- Payment Section Box (Reduced padding/spacing, fixed height) --- */}
            <div className="bg-white rounded-lg shadow p-3 shrink-0">
              {" "}
              {/* p-3, shrink-0 prevents shrinking */}
              {/* ***** PAYMENT HEADING REMOVED HERE ***** */}
              {/* Payment content starts immediately */}
              <div className="space-y-2">
                <div className="text-xl font-bold flex justify-between items-center">
                  <span>Total Due:</span>
                  <span>₱{(selectedTransaction?.TAmount || 0).toFixed(2)}</span>
                </div>
                {/* Cash Input Row */}
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="cashAmount"
                    className="flex items-center text-lg font-medium w-auto whitespace-nowrap shrink-0"
                  >
                    {" "}
                    {/* Label won't shrink */}
                    <DollarSign
                      size={20}
                      className="mr-1 text-green-600"
                    />{" "}
                    Cash:
                  </label>
                  <input
                    id="cashAmount"
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    disabled={!selectedTransaction} // Disable if no order selected
                    className={`border p-2 flex-grow rounded text-lg text-right ${
                      // Text aligned right
                      !selectedTransaction
                        ? "bg-gray-100 cursor-not-allowed"
                        : "focus:outline-none focus:ring-1 focus:ring-customOrange"
                    }`}
                    placeholder="0.00" // Placeholder
                    step="0.01" // Allow cents
                    min="0" // Minimum value
                  />
                </div>
                {/* Change Display Row */}
                <div className="flex items-center gap-3 text-xl font-bold">
                  <span className="flex items-center w-auto whitespace-nowrap shrink-0">
                    {" "}
                    {/* Label won't shrink */}
                    <ArrowLeftRight
                      size={20}
                      className="mr-1 text-blue-600"
                    />{" "}
                    Change:
                  </span>
                  <span
                    className={`flex-grow text-right ${
                      change > 0 ? "text-blue-700" : ""
                    }`}
                  >
                    {" "}
                    {/* Grow, align right, color change if positive */}₱
                    {change.toFixed(2)}
                  </span>
                </div>
                {/* Pay & Print Button */}
                <button
                  onClick={handlePrint}
                  disabled={!canPrint} // Use the calculated canPrint flag
                  className={`w-full p-3 rounded flex items-center justify-center text-white font-semibold mt-2 transition-colors duration-150 ${
                    // Added margin top
                    canPrint
                      ? "bg-customOrange hover:bg-orange-600 cursor-pointer"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Printer size={20} className="mr-2" /> Pay & Print Receipt
                </button>
              </div>
            </div>
          </div>
          {/* === End Right Side === */}
        </div>
      </div>
      {/* --- End Content Area --- */}

      <Footer />

      {/* --- Logout Confirmation Modal --- */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
          {" "}
          {/* Ensure modal is hidden on print */}
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
            <h3 className="text-lg font-medium mb-4">Confirm Logout</h3>
            <p className="mb-6">Are you sure you want to log out?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100 transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-150"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div> // End Main container
  );
};

export default CashierScreen;
