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
  Plus,
} from "lucide-react";
import AddOrderModal from "../components/AddOrderModal";

const generateRefNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const suffix = Array(2)
    .fill(null)
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");

  return `${year}${month}${day}-${hours}${minutes}-${suffix}`;
};

const AdminConfirmationModal = ({ onConfirm, onCancel, orderORN, title, actionText }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !password) {
      toast.error("Please enter admin email and password");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('account_table')
        .select('role')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data && data.role.toLowerCase() === 'admin') {
        toast.success("Admin confirmed.");
        onConfirm();
      } else {
        toast.error("Invalid admin credentials or not an admin.");
      }
    } catch (err) {
      console.error("Admin confirmation error:", err);
      toast.error("An error occurred during confirmation.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-2">{title}</h2>
        <p className="text-center text-gray-600 mb-6">
          Please provide admin credentials to continue for order #{orderORN}.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField("")}
              className="w-full px-4 py-3 border-2 text-black rounded-lg outline-none transition-all peer"
              required
            />
            <label
              htmlFor="email"
              className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                focusedField === "email" || email
                  ? "-top-2 text-xs bg-white px-2 text-customOrange"
                  : "top-3 text-gray-500"
              }`}
            >
              Admin Email
            </label>
          </div>
          <div className="relative">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField("")}
              className="w-full px-4 py-3 text-black border-2 rounded-lg outline-none transition-all peer"
              required
            />
            <label
              htmlFor="password"
              className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                focusedField === "password" || password
                  ? "-top-2 text-xs bg-white px-2 text-customOrange"
                  : "top-3 text-gray-500"
              }`}
            >
              Password
            </label>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-customOrange text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors flex justify-center items-center disabled:bg-orange-300 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : actionText}
          </button>
        </form>
        <button
          onClick={onCancel}
          className="mt-6 w-full text-center text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

{/* Printable Receipt Component */}
const CashierPrintableReceipt = ({ transaction, printRef, employeeEmail }) => {
  if (!transaction) return null;

  const formatDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return "N/A";
    const dateTime = new Date(`${dateStr}T${timeStr}`);
    if (isNaN(dateTime)) return "Invalid Date";
    return dateTime.toLocaleString("en-US", {
      timeZone: "Asia/Manila",
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div
      ref={printRef}
      id="printable-cashier-receipt-area"
      className="absolute -left-full -top-full"
    >
      <style type="text/css" media="print">
        {`
          @page {
            size: 80mm auto;
            margin: 3mm;
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
              font-family: 'monospace', 'Courier New';
              font-size: 9pt;
              color: #000;
            }
          }
        `}
      </style>

      <div id="printable-receipt" className="bg-white p-1 w-full">
        <div className="text-center mb-1">
          <img src="/images/photos/kuyabertlogo.jpg" alt="Logo" className="w-20 h-20 mx-auto" />
          <p className="text-xs font-bold leading-none">|</p>
          <p className="text-xs leading-tight">Zone 2 Osmena St. Atimonan, Quezon</p>
          <p className="text-xs leading-tight">Contact No. 0907-321-6764</p>
          <p className="text-xs leading-tight">Like us on FB: KuyaBertKitchenette</p>
        </div>
        
        <div className="border-t border-dashed border-black my-2"></div>

        <div className="text-xs">
          <div className="flex justify-between"><span>Employee:</span><span>{employeeEmail || 'N/A'}</span></div>
          <div className="flex justify-between"><span>Dining Option:</span><span>{transaction.order_type}</span></div>
          <div className="flex justify-between"><span>Payment Method:</span><span>Cash</span></div>
          <div className="flex justify-between"><span>Order Number:</span><span>#{transaction.ORN}</span></div>
          <p>{formatDateTime(new Date().toISOString().split('T')[0], new Date().toTimeString().split(' ')[0])}</p>
          <p>Reference Number: {transaction.RefNum}</p>
        </div>

        <div className="border-t border-dashed border-black my-2"></div>
        
        {transaction.items.map((item, index) => (
          <div key={index} className="text-xs mb-1">
            <div className="flex justify-between">
              <span>{item.name}</span>
              <span>₱{item.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-start">
              <span>{item.quantity}x ₱{item.price.toFixed(2)}</span>
            </div>
          </div>
        ))}

        <div className="border-t border-dashed border-black my-2"></div>

        <div className="text-xs">
          <div className="flex justify-between font-bold">
            <span>Amount due</span>
            <span>₱{transaction.TAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        <div className="text-center text-xs mt-2">
          <p>Thank you so much for Dining with us!</p>
          <p>See you again Ka-Berts ❤️</p>
          <p className="mt-2">Customer Care Hotline</p>
          <p>(TNT) 0907-321-6764</p>
        </div>
      </div>
    </div>
  );
};
{/* End Printable Receipt Component */}

const CashierScreen = () => {
  const { user } = useAuth();
  {/* State for storing transactions */}
  const [allTransactions, setAllTransactions] = useState([]);
  {/* Loading indicator */}
  const [isLoading, setIsLoading] = useState(true);
  {/* Last update time for refresh functionality */}
  const [lastUpdated, setLastUpdated] = useState(new Date());

  {/* State for transactions, search, and selection */}
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [cashAmount, setCashAmount] = useState("");
  const printRef = useRef(null);

  {/* State and methods for logout modal */}
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { currentEmail, logout } = useAuth();
  const navigate = useNavigate();

  {/* State for cancel order modal */}
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [orderToReactivate, setOrderToReactivate] = useState(null);

  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [checkedItems, setCheckedItems] = useState(new Set());

  {/* Load transactions from Supabase */}
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
            trans_item_id: item.trans_item_id,
            id: item.fk_prod_id,
            name: item.prdct_name,
            price: parseFloat(item.unit_price),
            quantity: item.quantity,
            total: parseFloat(item.item_subtotal),
            details: item.order_notes || "",
            is_prepared: item.is_prepared,
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
        (t) => t.trans_id === selectedTransaction.trans_id
      );
      setSelectedTransaction(updatedSelected || null);
    }
  }, [allTransactions, searchQuery]);

  const handleTransactionClick = (transaction) => {
    if (transaction.OrderStatus?.toLowerCase() === 'cancelled') {
      setOrderToReactivate(transaction);
      setShowReactivateModal(true);
    } else {
      setSelectedTransaction(transaction);
      setCashAmount(transaction.TAmount.toFixed(2));
      setCheckedItems(new Set()); // Reset local checkboxes on new selection
    }
  };

  const handleCheckboxToggle = (transItemId) => {
    setCheckedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(transItemId)) {
            newSet.delete(transItemId);
        } else {
            newSet.add(transItemId);
        }
        return newSet;
    });
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

    if (isPending) {
      const newRefNumber = generateRefNumber();

      try {
        const { error: transError } = await supabase
          .from("trans_table")
          .update({
            pymnt_status: "Paid",
            amount_paid: selectedTransaction.TAmount,
            ref_number: newRefNumber,
          })
          .eq("trans_id", selectedTransaction.trans_id);

        if (transError) throw transError;

        const currentDate = new Date();
        const paymentData = {
          fk_trans_id: Number(selectedTransaction.trans_id),
          pymnt_ref_id: `${Date.now()}`,
          order_number: Number(selectedTransaction.ORN),
          pymnt_mthod: "Cash",
          pymnt_status: "Paid",
          pymnt_amount: selectedTransaction.TAmount,
          pymnt_change: change,
          pymnt_date: currentDate.toISOString().split("T")[0],
          pymnt_time: currentDate.toTimeString().split(" ")[0],
        };

        const { error: paymentError } = await supabase
          .from("payment_table")
          .insert([paymentData]);

        if (paymentError) throw paymentError;

        toast.success("Payment completed and recorded successfully");

        const updatedTransactionForState = {
          ...selectedTransaction,
          PaymentStat: "Paid",
          RefNum: newRefNumber,
        };

        setSelectedTransaction(updatedTransactionForState);
        setAllTransactions((prev) =>
          prev.map((t) =>
            t.trans_id === selectedTransaction.trans_id
              ? updatedTransactionForState
              : t
          )
        );

        setTimeout(() => {
          window.print();
          setSelectedTransaction(null);
          setCashAmount("");
        }, 300);
      } catch (error) {
        console.error("Error processing payment:", error);
        toast.error(`Payment processing failed: ${error.message}`);
      }
    } else {
      toast.info("Transaction already processed. Printing receipt only.");
      window.print();
    }
  };

  const handleOrderStatusChange = async (orn, newStatus) => {
    // Find the transaction to update
    const transactionToUpdate = allTransactions.find((t) => t.ORN === orn);
    if (!transactionToUpdate || transactionToUpdate.OrderStatus?.toLowerCase() === 'cancelled') return;

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
        // Update the order status to 'Cancelled' in Supabase
        const { error } = await supabase
          .from("trans_table")
          .update({ order_status: "Cancelled", pymnt_status: "Cancelled" })
          .eq("trans_id", orderToCancel.trans_id);

        if (error) {
          console.error("Error cancelling order:", error);
          toast.error("Failed to cancel order");
          return;
        }

        // Update local state
        setAllTransactions((prevTransactions) =>
          prevTransactions.map((t) =>
            t.ORN === orderToCancel.ORN
              ? { ...t, OrderStatus: "Cancelled", PaymentStat: "Cancelled" }
              : t
          )
        );

        // If the canceled order was selected, clear the selection
        if (
          selectedTransaction &&
          selectedTransaction.ORN === orderToCancel.ORN
        ) {
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

  const confirmReactivateOrder = async () => {
    if (!orderToReactivate) return;

    try {
      const { error } = await supabase
        .from("trans_table")
        .update({ order_status: "Waiting", pymnt_status: "Pending" }) // Reactivating
        .eq("trans_id", orderToReactivate.trans_id);

      if (error) throw error;

      setAllTransactions((prev) =>
        prev.map((t) =>
          t.trans_id === orderToReactivate.trans_id
            ? { ...t, OrderStatus: "Waiting", PaymentStat: "Pending" }
            : t
        )
      );
      toast.success(`Order #${orderToReactivate.ORN} has been reactivated.`);
    } catch (error) {
      console.error("Error reactivating order:", error);
      toast.error("Failed to reactivate order.");
    } finally {
      setShowReactivateModal(false);
      setOrderToReactivate(null);
    }
  };

  const handleTogglePreparedStatus = async (transItemId, currentState) => {
    try {
      const { error } = await supabase
        .from('trans_items_table')
        .update({ is_prepared: !currentState })
        .eq('trans_item_id', transItemId);

      if (error) throw error;

      // Update local state to reflect the change immediately
      const updatedTransactions = allTransactions.map(trans => {
        if (trans.trans_id === selectedTransaction.trans_id) {
          const updatedItems = trans.items.map(item => {
            if (item.trans_item_id === transItemId) {
              return { ...item, is_prepared: !currentState };
            }
            return item;
          });
          return { ...trans, items: updatedItems };
        }
        return trans;
      });
      setAllTransactions(updatedTransactions);
      // We need to update the selectedTransaction as well for the modal to re-render correctly
      const updatedSelected = updatedTransactions.find(t => t.trans_id === selectedTransaction.trans_id);
      setSelectedTransaction(updatedSelected);

      toast.success('Item status updated!');
    } catch (error) {
      console.error('Error updating item status:', error);
      toast.error('Failed to update item status.');
    }
  };

  const handleAddMoreOrder = async (newItems, newGrandTotal) => {
    if (!selectedTransaction || newItems.length === 0) {
      toast.error("No transaction selected or no new items to add.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Insert new items into trans_items_table
      const itemsToInsert = newItems.map(item => ({
        fk_trans_id: selectedTransaction.trans_id,
        fk_prod_id: item.id,
        prdct_name: item.name,
        unit_price: item.price,
        quantity: item.quantity,
        item_subtotal: item.price * item.quantity,
      }));

      const { error: insertError } = await supabase
        .from('trans_items_table')
        .insert(itemsToInsert);

      if (insertError) {
        throw insertError;
      }

      // 2. Update the total amount and payment status in trans_table
      const updatePayload = { total_amntdue: newGrandTotal };
      if (selectedTransaction.PaymentStat === 'Paid') {
          updatePayload.pymnt_status = 'Pending';
      }
      
      const { error: updateError } = await supabase
        .from('trans_table')
        .update(updatePayload)
        .eq('trans_id', selectedTransaction.trans_id);

      if (updateError) {
        throw updateError;
      }
      
      toast.success("Successfully added new items to the order!");
      
      // 3. Refresh data
      setShowAddOrderModal(false);
      await fetchTransactions(); // This will refetch all data and update the view
      setCashAmount(""); // Clear cash amount
      setCheckedItems(new Set()); // Reset checkboxes

    } catch (error) {
      console.error("Error adding more items to order:", error);
      toast.error("Failed to add items. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const change = calculateChange();

  // Determine if the buttons should be enabled
  const isPaid = selectedTransaction?.PaymentStat?.toLowerCase() === 'paid';
  const canAddMoreOrder = selectedTransaction && !isPaid;
  const canPrint =
    selectedTransaction &&
    !isPaid &&
    cashAmount &&
    Number(cashAmount) >= selectedTransaction.TAmount;

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      <Header />

      <CashierPrintableReceipt
  transaction={selectedTransaction}
  printRef={printRef}
  employeeEmail={currentEmail || user?.email}
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
                          const isCancelled = transaction.OrderStatus?.toLowerCase() === 'cancelled';
                          return (
                            <tr
                              key={transaction.trans_id}
                              onClick={() => handleTransactionClick(transaction)}
                              className={`border-b border-gray-200 ${
                                isCancelled 
                                  ? 'bg-red-50 text-gray-500 line-through cursor-pointer hover:bg-red-100'
                                  : `cursor-pointer hover:bg-gray-200 ${
                                      selectedTransaction?.trans_id === transaction.trans_id
                                        ? "bg-blue-100 font-medium"
                                        : "hover:bg-gray-100"
                                    }`
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
                                  disabled={isCancelled}
                                  className={`w-full p-1 rounded border ${
                                    isCancelled
                                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                      : (transaction.OrderStatus?.toLowerCase() === "waiting" || transaction.OrderStatus?.toLowerCase() === "pending")
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
                                  {isCancelled && <option value="Cancelled">Cancelled</option>}
                                </select>
                              </td>
                              <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleCancelOrder(transaction.ORN)}
                                  disabled={isCancelled}
                                  className={`p-1 rounded ${ isCancelled ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:text-red-700 hover:bg-red-100'}`}
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
                          <td className="p-2">
                            <div className="flex items-center">
                                <input 
                                    type="checkbox" 
                                    className="h-4 w-4 rounded border-gray-300 text-customOrange focus:ring-customOrange mr-3 cursor-pointer"
                                    checked={checkedItems.has(item.trans_item_id)}
                                    onChange={() => handleCheckboxToggle(item.trans_item_id)}
                                    // Use a unique key for the checkbox, like the item's unique ID from the database
                                    id={`item-${item.trans_item_id}`}
                                />
                                <label 
                                  htmlFor={`item-${item.trans_item_id}`}
                                  className={`cursor-pointer ${checkedItems.has(item.trans_item_id) ? 'line-through text-gray-500' : ''}`}
                                >
                                    {item.name}
                                </label>
                            </div>
                          </td>
                          <td className={`p-2 text-right ${checkedItems.has(item.trans_item_id) ? 'line-through text-gray-500' : ''}`}>
                            ₱{item.price.toFixed(2)}
                          </td>
                          <td className={`p-2 text-center ${checkedItems.has(item.trans_item_id) ? 'line-through text-gray-500' : ''}`}>{item.quantity}</td>
                          <td className={`p-2 text-right font-medium ${checkedItems.has(item.trans_item_id) ? 'line-through text-gray-500' : ''}`}>
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
                    disabled={!selectedTransaction || isPaid}
                    className={`border p-2 flex-grow rounded text-lg text-right ${
                      !selectedTransaction || isPaid
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
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setShowAddOrderModal(true)}
                    disabled={!canAddMoreOrder}
                    className={`w-full p-3 rounded flex items-center justify-center text-white font-semibold transition-colors duration-150 ${
                      canAddMoreOrder
                        ? "bg-blue-500 hover:bg-blue-600 cursor-pointer"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <Plus size={20} className="mr-2" /> Add More Order
                  </button>
                  <button
                    onClick={handlePrint}
                    disabled={!canPrint}
                    className={`w-full p-3 rounded flex items-center justify-center text-white font-semibold transition-colors duration-150 ${
                      canPrint
                        ? "bg-customOrange hover:bg-orange-600 cursor-pointer"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <Printer size={20} className="mr-2" /> Pay & Print
                  </button>
                </div>
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

      {showReactivateModal && (
        <AdminConfirmationModal
          orderORN={orderToReactivate?.ORN}
          onConfirm={confirmReactivateOrder}
          onCancel={() => {
            setShowReactivateModal(false);
            setOrderToReactivate(null);
          }}
          title="Reactivate Order"
          actionText="Confirm & Reactivate"
        />
      )}

      {showAddOrderModal && selectedTransaction && (
        <AddOrderModal
          transaction={selectedTransaction}
          onClose={() => setShowAddOrderModal(false)}
          onConfirm={handleAddMoreOrder}
        />
      )}
    </div>
  );
};

export default CashierScreen;