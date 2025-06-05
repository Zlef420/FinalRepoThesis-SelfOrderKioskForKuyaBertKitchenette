import React, { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";
import {
  Search,
  RefreshCw,
  DollarSign,
  ArrowLeftRight,
  Printer,
  X,
  Loader2,
} from "lucide-react";

// ----- Printable Receipt Component (Compact Format) -----
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
            size: 80mm 297mm;
            margin: 0;
          }
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-cashier-receipt-area, #printable-cashier-receipt-area * {
              visibility: visible;
            }
            #printable-cashier-receipt-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              font-family: 'Courier New', monospace;
            }
            .no-print {
              display: none !important;
            }
            .addon-info, .instruction-info {
              font-size: 8pt !important;
              margin-left: 10px !important;
            }
          }
        `}
      </style>

      {/* Receipt Content */}
      <div id="printable-receipt" className="text-center bg-white p-1 w-full font-mono">
        <div className="mb-4">
          <h1 className="font-bold text-lg">Kuya Bert's Kitchenette</h1>
          <p className="text-sm">Sergio Osmeña St, Atimonan, 4331 Quezon</p>
          <p className="text-sm">facebook.com/KuyaBertKitchenette</p>
          <p className="font-bold mt-2">SALES INVOICE</p>
        </div>

        <div className="text-sm mb-2">
          <p>Order Number: {transaction.ORN}</p>
          <p>Reference Number: {transaction.RefNum}</p>
          <p>Payment Method: CASH</p>
          <p>Status: {displayPaymentStatus}</p>
          <p>
            Date: {currentDate.toLocaleDateString()} Time:{" "}
            {currentDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="border-t border-b border-black py-2 my-2">
          {transaction.items.map((item, index) => (
            <div key={index} className="mb-2">
              <div className="flex justify-between">
                <span>
                  {item.quantity} {item.name}
                </span>
                <span>{item.total.toFixed(2)}</span>
              </div>
              {/* Add-ons section */}
              {item.addons && item.addons.length > 0 && (
                <div className="text-xs text-left ml-4 addon-info">
                  <span className="font-semibold">Add-ons: </span>
                  {item.addons.map((addon, idx) => (
                    <span key={idx}>
                      {addon.name}{addon.quantity > 1 && ` x${addon.quantity}`}
                      {idx < item.addons.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </div>
              )}
              {/* Special instructions section */}
              {(item.details || item.instructions) && (
                <div className="text-xs text-left ml-4 instruction-info">
                  <span className="font-semibold">Instructions: </span>
                  <span>{item.details || item.instructions}</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="text-sm">
          <div className="flex justify-between">
            <span>{transaction.items.length} Item(s)</span>
            <span>Subtotal {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>TOTAL DUE</span>
            <span>₱{transaction.TAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>CASH</span>
            <span>₱{Number(cashAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>CHANGE</span>
            <span>₱{changeAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>VATable Sales</span>
            <span>{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>VAT Amount</span>
            <span>{vatAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="text-center mt-4 text-sm">
          <div className="border-t border-black pt-2">
            THANK YOU, AND PLEASE COME AGAIN.
          </div>
        </div>
      </div>
    </div>
  );
};
// ----- End Printable Receipt Component -----

const CashierScreen = () => {
  // State for storing the transactions from Supabase
  const [allTransactions, setAllTransactions] = useState([]);
  // State for loading indicator
  const [isLoading, setIsLoading] = useState(true);
  // State for tracking last update time for refresh functionality
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // State for transactions, search, and selection
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [cashAmount, setCashAmount] = useState("");
  const printRef = useRef(null);

  // State and methods for logout modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { currentEmail, logout } = useAuth();
  const navigate = useNavigate();

  // State for cancel order modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  // State will be initialized with proper computed values later

  // Load transactions from Supabase
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      // First, fetch all transactions from trans_table
      const { data: transData, error: transError } = await supabase
        .from("trans_table")
        .select("*")
        .order("trans_id", { ascending: false });

      if (transError) {
        console.error("Error fetching transactions:", transError);
        toast.error("Failed to load transactions");
        setIsLoading(false);
        return;
      }

      // For each transaction, fetch its items from trans_items_table
      const transactionsWithItems = await Promise.all(
        transData.map(async (transaction) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from("trans_items_table")
            .select("*")
            .eq("fk_trans_id", transaction.trans_id);

          if (itemsError) {
            console.error(
              `Error fetching items for transaction ${transaction.trans_id}:`,
              itemsError
            );
            return {
              ORN: transaction.order_number.toString(),
              TAmount: parseFloat(transaction.total_amntdue),
              RefNum: transaction.ref_number,
              PaymentStat: transaction.pymnt_status,
              OrderStatus: transaction.order_status,
              trans_id: transaction.trans_id,
              items: [],
            };
          }

          // Transform item data to match the expected format
          const formattedItems = itemsData.map((item) => ({
            id: item.fk_prod_id,
            name: item.prdct_name,
            price: parseFloat(item.unit_price),
            quantity: item.quantity,
            total: parseFloat(item.item_subtotal),
            details: item.order_notes || "",
          }));

          // Return the transaction with its items in the expected format
          return {
            ORN: transaction.order_number.toString(),
            TAmount: parseFloat(transaction.total_amntdue),
            RefNum: transaction.ref_number,
            PaymentStat: transaction.pymnt_status,
            OrderStatus: transaction.order_status,
            trans_id: transaction.trans_id,
            items: formattedItems,
          };
        })
      );

      setAllTransactions(transactionsWithItems);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Unexpected error fetching transactions:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Functions are defined later in the component

  // Fetch transactions on component mount and when lastUpdated changes
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Initialize transactions list based on search
  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const currentTransactions =
      lowerCaseQuery === ""
        ? allTransactions
        : allTransactions.filter(
            (transaction) =>
              (transaction.ORN &&
                transaction.ORN.toLowerCase().includes(lowerCaseQuery)) ||
              (transaction.RefNum &&
                transaction.RefNum.toLowerCase().includes(lowerCaseQuery)) ||
              (transaction.PaymentStat &&
                transaction.PaymentStat.toLowerCase().includes(lowerCaseQuery)) ||
              (transaction.OrderStatus &&
                transaction.OrderStatus.toLowerCase().includes(lowerCaseQuery)) ||
              (transaction.TAmount &&
                transaction.TAmount.toFixed(2).includes(lowerCaseQuery))
          );
    setTransactions(currentTransactions);

    if (selectedTransaction) {
      const updatedSelected = allTransactions.find(
        (t) => t.ORN === selectedTransaction.ORN
      );
      setSelectedTransaction(updatedSelected || null);
    }
  }, [allTransactions, searchQuery]);

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setCashAmount(transaction.TAmount.toFixed(2));
  };

  const calculateChange = () => {
    if (!selectedTransaction || !cashAmount || isNaN(Number(cashAmount)))
      return 0;
    const cash = Number(cashAmount);
    const total = selectedTransaction.TAmount;
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
    setSelectedTransaction(null);
    setCashAmount("");
    fetchTransactions();
    toast.success("Refreshed transactions");
  };

  const handlePrint = async () => {
    if (!selectedTransaction) return;

    const isPending = selectedTransaction.PaymentStat === "Pending";

    // Print the receipt
    window.print();

    // If payment status was pending, update it to paid in Supabase
    if (isPending) {
      try {
        const { error } = await supabase
          .from("trans_table")
          .update({ pymnt_status: "Paid", amount_paid: selectedTransaction.TAmount })
          .eq("trans_id", selectedTransaction.trans_id);

        if (error) {
          console.error("Error updating payment status:", error);
          toast.error("Failed to update payment status");
          return;
        }

        // Attempt to insert into payment_table
        const payment_ref_id = Date.now(); // Simple unique ID for payment reference
        const currentDate = new Date();
        const paymentData = {
          fk_trans_id: Number(selectedTransaction.trans_id),
          pymnt_ref_id: payment_ref_id,
          order_number: Number(selectedTransaction.ORN), 
          pymnt_mthod: "Cash",
          pymnt_status: "Paid",
          pymnt_amount: selectedTransaction.TAmount,
          pymnt_change: change, // Assuming 'change' is available in this scope
          pymnt_date: currentDate.toISOString().split('T')[0],
          pymnt_time: currentDate.toTimeString().split(' ')[0],
        };

        console.log("Attempting to insert into payment_table with data:", paymentData);
      const { error: paymentError } = await supabase
          .from("payment_table")
          .insert([paymentData]);

        if (paymentError) {
          console.error("Error inserting into payment_table:", paymentError);
          toast.error("Failed to record payment details. Please check manually.");
          // Note: The main transaction is already marked as Paid.
          // Consider how to handle this inconsistency if payment_table insert fails.
        } else {
          toast.success("Payment completed and recorded successfully");
        }

        // Update local state for trans_table
        setAllTransactions((prevAllTransactions) =>
          prevAllTransactions.map(
            (t) =>
              t.ORN === selectedTransaction.ORN
                ? { ...t, PaymentStat: "Paid" }
                : t
          )
        );
        setSelectedTransaction(null);
        setCashAmount("");
      } catch (error) {
        console.error("Unexpected error updating payment:", error);
        toast.error("An error occurred while updating payment");
      }
    } else {
      if (selectedTransaction) { 
        console.log(`handlePrint: Transaction ORN ${selectedTransaction.ORN} has PaymentStat '${selectedTransaction.PaymentStat}'. Not 'Pending'. Skipping database operations for payment_table.`);
        toast.info("Transaction already processed. Printing receipt only.");
      } else {
        console.log("handlePrint: No selected transaction, or transaction is not pending. Skipping database operations.");
      }
    }
  };

  const handleOrderStatusChange = async (orn, newStatus) => {
    // Find the transaction to update
    const transactionToUpdate = allTransactions.find((t) => t.ORN === orn);
    if (!transactionToUpdate) return;

    try {
      // Update the order status in Supabase
      const { error } = await supabase
        .from("trans_table")
        .update({ order_status: newStatus })
        .eq("trans_id", transactionToUpdate.trans_id);

      if (error) {
        console.error("Error updating order status:", error);
        toast.error("Failed to update order status");
        return;
      }

      // Update local state
      setAllTransactions((prevTransactions) =>
        prevTransactions.map((t) =>
          t.ORN === orn ? { ...t, OrderStatus: newStatus } : t
        )
      );

      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Unexpected error updating order status:", error);
      toast.error("An error occurred while updating order status");
    }
  };

  const handleCancelOrder = (orn) => {
    // Set the order to cancel and show the modal
    const orderToCancel = allTransactions.find((t) => t.ORN === orn);
    setOrderToCancel(orderToCancel);
    setShowCancelModal(true);
  };

  // Function to confirm the order cancellation
  const confirmCancelOrder = async () => {
    if (orderToCancel) {
      try {
        // First delete the related items from trans_items_table
        const { error: itemsError } = await supabase
          .from("trans_items_table")
          .delete()
          .eq("fk_trans_id", orderToCancel.trans_id);

        if (itemsError) {
          console.error("Error deleting order items:", itemsError);
          toast.error("Failed to cancel order items");
          return;
        }

        // Then delete the transaction from trans_table
        const { error: transError } = await supabase
          .from("trans_table")
          .delete()
          .eq("trans_id", orderToCancel.trans_id);

        if (transError) {
          console.error("Error deleting transaction:", transError);
          toast.error("Failed to cancel order");
          return;
        }

        // Update local state
        setAllTransactions((prevTransactions) =>
          prevTransactions.filter((t) => t.ORN !== orderToCancel.ORN)
        );

        // If the canceled order was selected, clear the selection
        if (selectedTransaction && selectedTransaction.ORN === orderToCancel.ORN) {
          setSelectedTransaction(null);
          setCashAmount("");
        }

        toast.success("Order cancelled successfully");
      } catch (error) {
        console.error("Unexpected error cancelling order:", error);
        toast.error("An error occurred while cancelling the order");
      }
    }

    // Close the modal and reset the orderToCancel
    setShowCancelModal(false);
    setOrderToCancel(null);
  };

  // Function to close the cancel modal without canceling the order
  const closeCancelModal = () => {
    setShowCancelModal(false);
    setOrderToCancel(null);
  };

  const change = calculateChange();
  const canPrint = selectedTransaction && 
    (selectedTransaction.PaymentStat === "Paid" || 
    (selectedTransaction.PaymentStat === "Pending" && 
     cashAmount && 
     !isNaN(Number(cashAmount)) && 
     Number(cashAmount) >= selectedTransaction.TAmount));

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      <Header />

      <CashierPrintableReceipt
        transaction={selectedTransaction}
        cashAmount={cashAmount}
        changeAmount={change}
        printRef={printRef}
      />

      <div className="flex-1 flex flex-col p-4 gap-4 bg-gray-100 print:hidden overflow-hidden">
        <div className="flex gap-4 flex-1 overflow-hidden">
          <div className="w-1/2 flex flex-col gap-4">
            <div className="bg-white rounded-lg shadow p-4 flex-1 flex flex-col overflow-hidden">
              <div className="mb-4 relative shrink-0">
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
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-customOrange" />
                    <span className="ml-2 text-gray-600">Loading transactions...</span>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                      <tr>
                        <th className="p-2 text-left font-semibold">ORN</th>
                        <th className="p-2 text-left font-semibold">Total</th>
                        <th className="p-2 text-left font-semibold">RefNum</th>
                        <th className="p-2 text-left font-semibold">Payment</th>
                        <th className="p-2 text-left font-semibold">Order Status</th>
                        <th className="p-2 text-center font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length > 0 ? (
                        transactions.map((transaction) => {
                          console.log(`Rendering transaction ORN: ${transaction.ORN}, OrderStatus: '${transaction.OrderStatus}' (Type: ${typeof transaction.OrderStatus})`);
                          return (
                            <tr
                              key={transaction.trans_id}
                              onClick={() => handleTransactionClick(transaction)}
                              className={`cursor-pointer hover:bg-gray-200 border-b border-gray-200 ${
                                selectedTransaction?.ORN === transaction.ORN
                                  ? "bg-blue-100 font-medium"
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
                                    : "text-gray-500"
                                }`}
                              >
                                {transaction.PaymentStat}
                              </td>
                              <td className="p-2" onClick={(e) => e.stopPropagation()}>
                                <select
                                  value={transaction.OrderStatus}
                                  onChange={(e) =>
                                    handleOrderStatusChange(transaction.ORN, e.target.value)
                                  }
                                  className={`w-full p-1 rounded border ${
                                    (transaction.OrderStatus?.toLowerCase() === "waiting" || transaction.OrderStatus?.toLowerCase() === "pending")
                                      ? "text-yellow-600 border-yellow-300 bg-yellow-50"
                                      : transaction.OrderStatus?.toLowerCase() === "in progress"
                                      ? "text-blue-600 border-blue-300 bg-blue-50"
                                      : transaction.OrderStatus?.toLowerCase() === "done"
                                      ? "text-green-600 border-green-300 bg-green-50"
                                      : "text-gray-700 border-gray-300 bg-gray-50"
                                  }`}
                                >
                                  <option value="Waiting">Waiting</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Done">Done</option>
                                </select>
                              </td>
                              <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleCancelOrder(transaction.ORN)}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                                  title="Cancel Order"
                                >
                                  <X size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
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
                )}
              </div>
            </div>

            <div className="flex justify-between px-1 shrink-0">
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
          <div className="w-1/2 flex flex-col gap-4">
            {/* --- Order Details Box: Takes available space (flex-1), flex column, hides overflow --- */}
            <div className="bg-white rounded-lg shadow p-4 flex-1 flex flex-col overflow-hidden">
              <h3 className="text-lg font-semibold mb-2 border-b pb-2 shrink-0">
                Order Details
              </h3>
              {selectedTransaction ? (
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white z-10">
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
                <div className="flex-1 flex items-center justify-center text-center text-gray-500">
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
              <div className="space-y-2">
                <div className="text-xl font-bold flex justify-between items-center">
                  <span>Total Due:</span>
                  <span>₱{(selectedTransaction?.TAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="cashAmount"
                    className="flex items-center text-lg font-medium w-auto whitespace-nowrap shrink-0"
                  >
                    <DollarSign size={20} className="mr-1 text-green-600" />{" "}
                    Cash:
                  </label>
                  <input
                    id="cashAmount"
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    disabled={!selectedTransaction}
                    className={`border p-2 flex-grow rounded text-lg text-right ${
                      !selectedTransaction
                        ? "bg-gray-100 cursor-not-allowed"
                        : "focus:outline-none focus:ring-1 focus:ring-customOrange"
                    }`}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="flex items-center gap-3 text-xl font-bold">
                  <span className="flex items-center w-auto whitespace-nowrap shrink-0">
                    <ArrowLeftRight size={20} className="mr-1 text-blue-600" />{" "}
                    Change:
                  </span>
                  <span
                    className={`flex-grow text-right ${
                      change > 0 ? "text-blue-700" : ""
                    }`}
                  >
                    ₱{change.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={handlePrint}
                  disabled={!canPrint}
                  className={`w-full p-3 rounded flex items-center justify-center text-white font-semibold mt-2 transition-colors duration-150 ${
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
        </div>
      </div>

      <Footer />

      {/* --- Logout Confirmation Modal --- */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
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

      {/* --- Cancel Order Confirmation Modal --- */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
            <h3 className="text-lg font-medium mb-4">Confirm Order Cancellation</h3>
            <p className="mb-6">
              Are you sure you want to cancel order #{orderToCancel?.ORN}?
              {orderToCancel && (
                <span className="block mt-2 text-sm text-gray-600">
                  Total: ₱{orderToCancel.TAmount.toFixed(2)}
                </span>
              )}
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={closeCancelModal}
                className="px-4 py-2 border rounded hover:bg-gray-100 transition-colors duration-150"
              >
                No, Keep Order
              </button>
              <button
                onClick={confirmCancelOrder}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-150"
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierScreen;