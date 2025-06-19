import React, { useState, useEffect, useContext } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Trash2,
  Wallet,
  Smartphone,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  X
} from "lucide-react";
import { CartContext } from "../context/CartContext";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";


{/* OrderReview component */}
const OrderReview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  {/* Get user information */}
  const { currentEmail } = useAuth();
  const user_id = currentEmail || "guest";
  
  {/* Get CartContext data */}
  const {
    cartItems,
    deleteItem,
    addToCart,
    removeItem,
    updateItemQuantity,
    clearCart,
    items,
    setItems
  } = useContext(CartContext);

  {/* State for dining option */}
  const [selectedOption, setSelectedOption] = useState(() => {
    return localStorage.getItem("diningOption") || "Dine In";
  });

  {/* State for cart items */}
  const [localItems, setLocalItems] = useState(() => {
    const contextCartItems = Array.isArray(cartItems) ? cartItems : [];
    let initialItems = [];
    if (contextCartItems.length > 0) {
      initialItems = contextCartItems;
    } else {
      const savedItems = localStorage.getItem("cartItems");
      try {
        initialItems = savedItems ? JSON.parse(savedItems) : [];
        if (!Array.isArray(initialItems)) initialItems = [];
      } catch (e) {
        console.error("Failed to parse cartItems from localStorage for OrderReview items state", e);
        initialItems = [];
      }
    }
    return initialItems.map((item) => {
      const { addons, ...itemWithoutAddons } = item;
      return {
        ...itemWithoutAddons,
      quantity: Math.max(1, Number(item.quantity) || 1),
      isExpanded: item.isExpanded || false,
      isSaved: item.isSaved !== undefined ? Boolean(item.isSaved) : true,
      };
    });
  });

  {/* State for selected payment method */}
  const [selectedPayment, setSelectedPayment] = useState(null);

  {/* State for modals */}
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false); // State to handle payment processing

  {/* Order number state */}
  const [currentOrderNumber, setCurrentOrderNumber] = useState(null);
  
  {/* Fetch and set the order number */}
  useEffect(() => {
    const fetchOrderNumber = async () => {
      console.log("[ReviewOrder EFFECT] Triggered fetchOrderNumber. localItems.length:", localItems.length);
      if (localItems.length === 0) {
        console.log("[ReviewOrder EFFECT] No items in cart, skipping order number fetch.");
        setCurrentOrderNumber(null); 
        return;
      }

      console.log("[ReviewOrder EFFECT] Calling supabase.rpc('get_next_daily_order_number')...");
      try {
        const { data: orderNumData, error: orderNumError } = await supabase.rpc('get_next_daily_order_number');
        
        if (orderNumError) {
          console.error("[ReviewOrder EFFECT] Error from supabase.rpc:", orderNumError);
          toast.error("Could not fetch order number. DB Error.");
          setCurrentOrderNumber(null);
        } else {
          console.log(`[ReviewOrder EFFECT] Setting currentOrderNumber to: ${orderNumData}`);
          setCurrentOrderNumber(orderNumData);
        }
      } catch (error) {
        console.error("[ReviewOrder EFFECT] Exception during fetchOrderNumber:", error);
        toast.error("App error fetching order number.");
        setCurrentOrderNumber(null);
      }
    };

    fetchOrderNumber();

  }, [localItems.length]);

  console.log("[ReviewOrder RENDER] currentOrderNumber state:", currentOrderNumber);

  {/* Sync items to localStorage */}
  useEffect(() => {
    const validItems = localItems.filter(
      (item) => item && item.id && item.quantity > 0
    );
    localStorage.setItem("cartItems", JSON.stringify(validItems));
  }, [localItems]);

  {/* Sync dining option to localStorage */}
  useEffect(() => {
    localStorage.setItem("diningOption", selectedOption);
  }, [selectedOption]);

  {/* Update item quantity handler */}
  const updateQuantity = (e, id, increment) => {
    e.stopPropagation();

    const currentItem = localItems.find((item) => item.id === id);
    if (!currentItem) return;

    const currentQuantity = currentItem.quantity;

    {/* Check before decrementing from 1 */}
    if (increment < 0 && currentQuantity === 1) {
      confirmDeleteItem(e, id);
      return;
    }

    const newQuantity = Math.max(1, currentQuantity + increment);

    if (newQuantity !== currentQuantity) {
      setLocalItems((currentItems) =>
        currentItems.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );

      {/* Sync with context */}
      if (typeof updateItemQuantity === "function") {
        updateItemQuantity(id, newQuantity);
      } else if (typeof addToCart === "function") {
        addToCart({ ...currentItem, quantity: newQuantity });
      }
    }
  };

  {/* Toggle item details expansion */}
  const toggleExpand = (id) => {
    setLocalItems(
      localItems.map((item) =>
        item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
      )
    );
  };

  {/* Update special instructions */}
  const updateDescription = (id, description) => {
    setLocalItems(
      localItems.map((item) =>
        item.id === id
          ? { ...item, details: description, isSaved: false }
          : item
      )
    );
  };

  {/* Save item changes and collapse details */}
  const saveChanges = (e, id) => {
    e.stopPropagation();
    setLocalItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id === id && !item.isSaved) {
          if (typeof updateItemQuantity === "function") {
            updateItemQuantity(id, item.quantity, undefined, item.details);
          } else if (typeof addToCart === "function") {
            addToCart(item);
          }
          return { ...item, isExpanded: false, isSaved: true };
        }
        if (item.id === id && item.isSaved) {
          return { ...item, isExpanded: false };
        }
        return item;
      })
    );
  };

  {/* Calculate item total */}
  const calculateItemTotal = (item) => {
    const basePrice = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 0;

    if (quantity === 0) return 0;


    const total = (basePrice * quantity);
    return total;
  };

  {/* Calculate total cost */}
  const calculateTotal = () => {
    return localItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };


  const confirmDeleteItem = (e, id) => {
    if (e) e.stopPropagation();
    setItemToDelete(id);
    setShowDeleteItemModal(true);
  };


  const deleteItemLocal = () => {
    if (itemToDelete !== null) {
      const updatedItems = localItems.filter((item) => item.id !== itemToDelete);
      setLocalItems(updatedItems);

      if (typeof deleteItem === "function") {
        deleteItem(itemToDelete);
      } else {
        console.warn("CartContext missing deleteItem function");
      }

      setShowDeleteItemModal(false);
      setItemToDelete(null);
    }
  };


  const confirmDeleteAllItems = () => {
    if (localItems.length === 0) return;
    setShowDeleteAllModal(true);
  };


  const deleteAllItems = () => {
    const itemIds = localItems.map((item) => item.id);
    setLocalItems([]);

    if (typeof clearCart === "function") {
      clearCart();
    } else if (typeof deleteItem === "function") {
      itemIds.forEach((id) => deleteItem(id));
    } else {
      console.warn("CartContext missing clearCart or deleteItem function");
    }

    setShowDeleteAllModal(false);
  };

  {/* Style for payment buttons */}
  const paymentButtonStyle = (
    isSelected
  ) =>
    `border-2 p-3 rounded flex flex-col items-center transition-colors ${
      isSelected
        ? "bg-blue-100 border-blue-500"
        : "border-gray-300 hover:bg-gray-200"
    } ${localItems.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`;

  {/* Handle navigation to payment page */}
  const handlePayment = async () => {
    // Guard clause to prevent multiple submissions
    if (isProcessing) return;

    // Check for required selections
    if (!selectedPayment || localItems.length === 0) {
      toast.error("Please select a payment method.");
      return;
    }
    if (currentOrderNumber === null || currentOrderNumber === undefined) {
      toast.error("Order number is not available. Please wait or try refreshing.");
      return;
    }

    setIsProcessing(true); // Disable the button

    try {
      const order_number = currentOrderNumber;
      const total_amount = calculateTotal();
      const paymentMethodString = selectedPayment === "ewallet" ? "E-Wallet" : "Cash";

      // Generate a unique reference number
      const generateUlidLike = () => {
        const timestamp = new Date().getTime().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 10).toUpperCase();
        return `${timestamp}-${random}`;
      };
      const ref_number = generateUlidLike();

      // Create PayMongo source if e-wallet is selected
      let paymentSource = null;
      if (selectedPayment === "ewallet") {
        const createPayMongoSource = async (amount) => {
          const secretKey = import.meta.env.VITE_PAYMONGO_SECRET_KEY;
          if (!secretKey) throw new Error("PayMongo secret key is not set.");
          
          const options = {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Basic ${btoa(secretKey)}` },
            body: JSON.stringify({
              data: {
                attributes: {
                  amount: amount * 100, // Amount in centavos
                  redirect: {
                    success: `${window.location.origin}/order-conf`,
                    failed: `${window.location.origin}/payment-failed`,
                  },
                  type: 'gcash',
                  currency: 'PHP',
                },
              },
            }),
          };
          const response = await fetch('https://api.paymongo.com/v1/sources', options);
          if (!response.ok) {
            const err = await response.json().catch(() => ({ message: 'Unknown PayMongo API error' }));
            throw new Error(`PayMongo API Error: ${JSON.stringify(err)}`);
          }
          return response.json();
        };
        
        try {
          paymentSource = await createPayMongoSource(total_amount);
        } catch (err) {
          console.error("PayMongo payment source creation failed:", err);
          toast.error("Could not connect to payment provider. Please try again later.");
          // Exit the function but the finally block will still run
          return; 
        }
      }

      // Insert transaction into the database
      const { data: transData, error: transError } = await supabase
        .from('trans_table')
        .insert({
          ref_number,
          order_number,
          order_type: selectedOption,
          trans_date: new Date().toISOString().split('T')[0],
          trans_time: new Date().toISOString().split('T')[1].substring(0, 8),
          order_status: 'Pending',
          pymnt_status: 'Pending',
          pymnt_method: selectedPayment === "ewallet" ? 1 : 0,
          total_amntdue: total_amount,
          amount_paid: selectedPayment === "cash" ? 0 : total_amount,
          user_id,
        })
        .select()
        .single();

      if (transError) throw transError;
      const trans_id = transData.trans_id;

      // Insert order items
      const itemsToInsert = localItems.map((item) => ({
        fk_trans_id: trans_id,
        fk_prod_id: String(item.id),
        prdct_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        item_subtotal: calculateItemTotal(item),
        order_notes: item.details ? `Instructions: ${item.details}`.trim() : '',
      }));
      const { error: itemsError } = await supabase.from('trans_items_table').insert(itemsToInsert);
      if (itemsError) throw itemsError;

      // Insert payment record
      const { error: paymentError } = await supabase.from('payment_table').insert({
        fk_trans_id: trans_id,
        pymnt_ref_id: paymentSource ? paymentSource.data.id : `cash_${ref_number}`,
        order_number,
        pymnt_mthod: paymentMethodString,
        pymnt_status: 'Pending',
        pymnt_amount: total_amount,
        pymnt_change: 0,
      });
      if (paymentError) throw paymentError;

      // Prepare data for navigation
      const orderData = {
        trans_id,
        ref_number,
        order_number,
        items: localItems,
        totalAmount: total_amount,
        diningOption: selectedOption,
        paymentMethod: selectedPayment,
      };

      toast.success("Order placed successfully!");
      if (typeof clearCart === "function") clearCart();

      // Navigate to the correct next screen
      if (selectedPayment === 'ewallet') {
        navigate('/ewallet-payment', { state: { orderData, paymentSource } });
      } else {
        navigate('/order-conf', { state: { orderData, paymentStatus: 'completed' } });
      }

    } catch (error) {
      console.error("Payment handling failed:", error);
      toast.error(`An error occurred: ${error.message}. Please try again.`);
    } finally {
      setIsProcessing(false); // Re-enable button in both success and error cases
    }  
  };

  {/* Modal component */}
  const ConfirmationModal = ({ show, title, message, onConfirm, onCancel }) => {
    if (!show) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <AlertCircle className="text-red-500 mr-2 size-5" />
              <h3 className="text-lg font-bold">{title}</h3>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="size-5" />
            </button>
          </div>

          <p className="mb-6">{message}</p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };


  return (

    <div className="min-h-screen flex flex-col bg-customBlack bg-cover bg-center overflow-hidden">
      <Header />
      {/* Main Content Section */}
      <main className="flex-1 container mx-auto px-4 py-2 max-w-[1400px] h-[calc(100vh-180px)] overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between gap-6 h-full overflow-hidden">
          {/* Order List Section (Original structure) */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
            {/* Order Header (Original structure) */}
            <div className="mb-4 text-white">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Review your Order</h1>
                {/* Display currentOrderNumber */}
                {currentOrderNumber !== null && (
                  <span className="text-xl font-bold text-white">Order #{currentOrderNumber}</span>
                )}
              </div>
            </div>
            {/* Order Items List with fixed height - ensure content stays within scrollable area */}
            <div className="flex-1 overflow-y-auto pr-1 -mr-1 h-[calc(100vh-400px)] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-700">
              {localItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-white">
                  <p className="text-xl">Your cart is empty</p>
                </div>
                              ) : (
                <div className="space-y-4">
                  {localItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-100 rounded-lg shadow-md cursor-pointer hover:bg-gray-200 transition-colors relative"
                      onClick={() => toggleExpand(item.id)}
                    >
                      {/* Original expand/collapse button */}
                      <div className="mt-5 absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 rounded-full p-1 text-white">
                        {item.isExpanded ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </div>

                      {/* Original item top section */}
                      <div className="p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                          {/* Original item name/price display */}
                          <div className="space-y-2 flex-1 min-w-0 mb-3 sm:mb-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                              <span className="font-semibold text-lg truncate">
                                {item.name}
                              </span>
                              <span className="text-gray-600 whitespace-nowrap">
                                ₱{item.price}
                              </span>
                            </div>
                            {/* Original saved details display */}
                            {item.isSaved && (
                              <div className="text-sm text-gray-600 space-y-1">
                                {item.details && (
                                  <div className="break-words">
                                    <span className="font-medium">
                                      Instructions:{" "}
                                    </span>
                                    {item.details}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Original Quantity Control & Delete */}
                          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-normal">
                            {/* Original quantity buttons */}
                            <div className="bg-gray-300 rounded-full flex items-center px-3 py-1">
                              <button
                                onClick={(e) => updateQuantity(e, item.id, -1)}
                                className="text-lg px-1 hover:bg-gray-400 rounded-full w-6"
                              >
                                -
                              </button>
                              <span className="mx-3">{item.quantity}</span>
                              <button
                                onClick={(e) => updateQuantity(e, item.id, 1)}
                                className="text-xl px-2 hover:bg-gray-400 rounded-full w-8"
                              >
                                +
                              </button>
                            </div>
                            {/* Original delete button */}
                            <button
                              className="text-red-500 hover:text-red-700"
                              onClick={(e) => confirmDeleteItem(e, item.id)}
                            >
                              <Trash2 className="size-5" />
                            </button>
                          </div>
                        </div>
                        {/* Item Total Price display with breakdown */}
                        <div className="flex justify-end items-center mt-2">
                          <div className="text-gray-600">
                              <div>Total: ₱{calculateItemTotal(item)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Item Customization Section - Contained within the scrollable area */}
                      {item.isExpanded && (
                        <div
                          className="border-t border-gray-200 p-4 space-y-2 bg-white overflow-visible"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Special Instructions Section (Original structure) */}
                          <div>
                            <h3 className="font-semibold mb-2">
                              Special Instructions
                            </h3>
                            <textarea
                              value={item.details || ""}
                              onChange={(e) =>
                                updateDescription(item.id, e.target.value)
                              }
                              placeholder="Add any special instructions..."
                              className="w-full p-2 border rounded-md h-24"
                            />
                          </div>

                          {/* Save Changes Button (Original structure) */}
                          <div className="flex justify-end pt-2">
                            <button
                              onClick={(e) => saveChanges(e, item.id)}
  
                              className={`px-4 py-2 rounded transition-colors ${
                                item.isSaved
                                  ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                                  : "bg-blue-600 text-white hover:bg-blue-700"
                              }`}
                              disabled={item.isSaved}
                            >
                                                            {item.isSaved ? "Saved" : "Save Changes"}
                            </button>
                          </div>
                        </div>
                      )}
                                          </div>
                  ))}
                  {/* End item map */}
                </div>
              )}
            </div>{" "}
            {/* End Order Items List scroll container */}
            {/* Order Actions Section (Original structure) */}
            <div className="mt-4 flex justify-between items-center pt-4 border-t border-gray-700">
              {/* Original Return button */}
              <button
                onClick={() => navigate("/home")}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded"
              >
                Return
              </button>
              {/* Original Remove All button */}
              {localItems.length > 0 && (
                <button
                  onClick={confirmDeleteAllItems}
                  className="py-2 px-2 text-sm text-red-500 hover:text-white
                   flex items-center justify-center gap-2 border border-red-500 rounded hover:bg-red-600 transition"
                >
                  <Trash2 className="size-4" />
                  <span className="hidden sm:inline">Remove all items</span>
                  <span className="sm:hidden">Remove all</span>
                </button>
              )}
            </div>
          </div>{" "}
          {/* End Order List Section */}
          {/* Payment Summary Section (Original structure) */}
          <div className="w-full lg:w-80 bg-white rounded-lg p-4 mb-4 lg:mb-0 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-5">Total Cost</h2>
              {/* Cart Summary with improved formatting */}
              <div className="overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 h-[calc(100vh-500px)]">
                {localItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-2">
                    No items in cart
                  </p>
                ) : (
                  <div className="space-y-4">
                    {localItems.map((item) => (
                      <div key={item.id} className="border-b pb-3 last:border-b-0">
                        <div className="flex justify-between text-base">
                          <div className="font-medium">{item.name}</div>
                          <div>₱{item.price * item.quantity}</div>
                        </div>
                              </div>
                            ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-auto">
              {/* Total Amount (Original structure) */}
              <div className="border-t border-b py-3 my-4">
                <div className="flex justify-between font-bold">
                  <span>Total Amount:</span>
                  <span>₱{calculateTotal()}</span>
                </div>
              </div>
              {/* Payment Options Section (Original structure) */}
              <div className="mb-5">
                <div className="flex justify-between mb-3">
                  <span>Dining choice</span>
                  <span>{selectedOption}</span>
                </div>

                <div className="font-bold mb-3">Select Payment Method:</div>
                {/* Original payment buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedPayment("cash")}
                    className={paymentButtonStyle(selectedPayment === "cash")}
                    disabled={localItems.length === 0}
                  >
                    <Wallet className="size-6 mb-2" />
                    <span>Cash</span>
                  </button>
                  <button
                    onClick={() => setSelectedPayment("ewallet")}
                    className={paymentButtonStyle(selectedPayment === "ewallet")}
                    disabled={localItems.length === 0}
                  >
                    <Smartphone className="size-6 mb-2" />
                    <span>E-wallet</span>
                  </button>
                </div>
              </div>
              {/* Proceed to Payment Button (Original structure) */}
              <button
                className={`w-full py-3 text-white rounded text-center font-bold ${
                  selectedPayment && localItems.length > 0 && !isProcessing
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
                disabled={!selectedPayment || localItems.length === 0 || isProcessing}
                onClick={handlePayment}
              >
                {/* Original button text logic */}
                {isProcessing
                  ? "Processing..."
                  : localItems.length === 0
                  ? "Cart is Empty"
                  : selectedPayment
                  ? "Proceed to Payment"
                  : "Select Payment Method"}
              </button>
            </div>
                      </div>
          </div>
        </main>
        <Footer className="mt-4" />
        {/* Confirmation Modals */}
      <ConfirmationModal
        show={showDeleteItemModal}
        title="Remove Item"
        message="Are you sure you want to remove this item from your cart?"
        onConfirm={deleteItemLocal}
        onCancel={() => setShowDeleteItemModal(false)}
      />
      <ConfirmationModal
        show={showDeleteAllModal}
        title="Remove All Items"
        message="Are you sure you want to remove all items from your cart?"
        onConfirm={deleteAllItems}
        onCancel={() => setShowDeleteAllModal(false)}
      />
          </div>
  );
};

export default OrderReview;