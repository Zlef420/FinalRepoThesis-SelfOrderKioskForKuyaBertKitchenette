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
  X,
} from "lucide-react";
import { CartContext } from "../context/CartContext";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

// OrderReview component: displays and manages the user's order before payment
const OrderReview = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Keep for potential future use, but preFetchedOrderNumber won't be used for setCurrentOrderNumber
  // Get user information from AuthContext at the top level
  const { currentEmail } = useAuth();
  const user_id = currentEmail || "guest"; // Use guest if not logged in
  
  // Get CartContext data - Adjust based on your actual context implementation
  const {
    cartItems,
    deleteItem,
    addToCart,
    removeItem, // Keep if needed
    updateItemQuantity, // Ideal function for context updates
    clearCart, // Ideal function for removing all
    items, // Assuming `items` is the local state for cart items derived from CartContext/localStorage
    setItems, // Make sure `items` and `setItems` are correctly defined and used as per your existing setup
  } = useContext(CartContext);

  // State for dining option
  const [selectedOption, setSelectedOption] = useState(() => {
    return localStorage.getItem("diningOption") || "Dine In";
  });

  // State for cart items - Initialize robustly
  const [localItems, setLocalItems] = useState(() => {
    const contextCartItems = Array.isArray(cartItems) ? cartItems : []; // cartItems from context
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
    return initialItems.map((item) => ({
      ...item,
      quantity: Math.max(1, Number(item.quantity) || 1),
      addons: Array.isArray(item.addons) ? item.addons : [],
      isExpanded: item.isExpanded || false,
      isSaved: item.isSaved !== undefined ? Boolean(item.isSaved) : true,
    }));
  });

  // State for selected payment method
  const [selectedPayment, setSelectedPayment] = useState(null);

  // State for modals
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Available addons for items (ensure prices are numbers)
  const availableAddons = [
    { id: 1, name: "Gravy", price: 20 },
    { id: 2, name: "Extra Sauce", price: 15 },
    { id: 3, name: "Cheese", price: 25 },
    { id: 4, name: "Extra Rice", price: 30 },
  ];

  // Ensure currentOrderNumber state is declared
  const [currentOrderNumber, setCurrentOrderNumber] = useState(null);
  
  // useEffect to fetch and set the order number
  useEffect(() => {
    const fetchOrderNumber = async () => {
      console.log("[ReviewOrder EFFECT] Triggered fetchOrderNumber. localItems.length:", localItems.length);
      if (localItems.length === 0) {
        console.log("[ReviewOrder EFFECT] No items in cart, skipping order number fetch.");
        // Optionally set to null or a placeholder if cart becomes empty
        // setCurrentOrderNumber(null); 
        return;
      }

      console.log("[ReviewOrder EFFECT] Calling supabase.rpc('get_next_daily_order_number')...");
      try {
        const { data: orderNumData, error: orderNumError } = await supabase.rpc('get_next_daily_order_number');
        
        if (orderNumError) {
          console.error("[ReviewOrder EFFECT] Error from supabase.rpc:", orderNumError);
          toast.error("Could not fetch order number. DB Error.");
          setCurrentOrderNumber(null); // Set to null or a specific error indicator
        } else {
          console.log("[ReviewOrder EFFECT] Successfully received from supabase.rpc. Data:", orderNumData);
          if (orderNumData === null || orderNumData === undefined) {
            console.error("[ReviewOrder EFFECT] RPC returned null/undefined. This is unexpected.");
            toast.error("Invalid order number from DB.");
            setCurrentOrderNumber(null);
          } else {
            console.log(`[ReviewOrder EFFECT] Setting currentOrderNumber to: ${orderNumData}`);
            setCurrentOrderNumber(orderNumData);
          }
        }
      } catch (error) {
        console.error("[ReviewOrder EFFECT] Exception during fetchOrderNumber:", error);
        toast.error("App error fetching order number.");
        setCurrentOrderNumber(null);
      }
    };

    fetchOrderNumber();

  }, [localItems.length]); // Dependency: re-run if the number of items changes.
                         // Supabase client instance is generally stable, so not always needed here unless it can change.

  console.log("[ReviewOrder RENDER] currentOrderNumber state:", currentOrderNumber);

  // Sync local `items` state changes back to localStorage
  useEffect(() => {
    const validItems = localItems.filter(
      (item) => item && item.id && item.quantity > 0
    );
    localStorage.setItem("cartItems", JSON.stringify(validItems));
  }, [localItems]);

  // Sync dining option with localStorage
  useEffect(() => {
    localStorage.setItem("diningOption", selectedOption);
  }, [selectedOption]);

  // *** FIXED: Minus button spam and quantity logic ***
  const updateQuantity = (e, id, increment) => {
    e.stopPropagation();

    const currentItem = localItems.find((item) => item.id === id);
    if (!currentItem) return;

    const currentQuantity = currentItem.quantity;

    // --- FIX: Check BEFORE state update if decrementing from 1 ---
    if (increment < 0 && currentQuantity === 1) {
      confirmDeleteItem(e, id); // Show modal, DO NOT change quantity
      return; // Stop processing this click
    }

    const newQuantity = Math.max(1, currentQuantity + increment);

    if (newQuantity !== currentQuantity) {
      setLocalItems((currentItems) =>
        currentItems.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );

      // Sync with context (Optional but recommended)
      if (typeof updateItemQuantity === "function") {
        updateItemQuantity(id, newQuantity);
      } else if (typeof addToCart === "function") {
        addToCart({ ...currentItem, quantity: newQuantity });
      }
    }
  };

  // Toggle item details expansion
  const toggleExpand = (id) => {
    setLocalItems(
      localItems.map((item) =>
        item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
      )
    );
  };

  // Update special instructions for an item
  const updateDescription = (id, description) => {
    setLocalItems(
      localItems.map((item) =>
        item.id === id
          ? { ...item, details: description, isSaved: false }
          : item
      )
    );
  };

  // Add or remove one instance of an addon
  const updateAddonQuantity = (itemId, addon, increment) => {
    setLocalItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          const currentAddons = Array.isArray(item.addons) ? item.addons : [];
          const existingAddonIndex = currentAddons.findIndex(
            (a) => a.id === addon.id
          );
          let newAddons = [...currentAddons];
          let changed = false;

          if (existingAddonIndex >= 0) {
            const existingAddon = currentAddons[existingAddonIndex];
            const currentQuantity = Number(existingAddon.quantity) || 0;
            const newQuantity = Math.max(0, currentQuantity + increment);

            if (newQuantity === 0) {
              if (currentQuantity > 0) {
                newAddons.splice(existingAddonIndex, 1);
                changed = true;
              }
            } else if (newQuantity !== currentQuantity) {
              newAddons[existingAddonIndex] = {
                ...existingAddon,
                quantity: newQuantity,
              };
              changed = true;
            }
          } else if (increment > 0) {
            newAddons.push({ ...addon, quantity: 1 });
            changed = true;
          }

          return changed
            ? { ...item, addons: newAddons, isSaved: false }
            : item;
        }
        return item;
      })
    );
  };

  // Get current quantity of a specific addon for an item
  const getAddonQuantity = (item, addonId) => {
    if (!Array.isArray(item.addons)) return 0;
    const addon = item.addons.find((a) => a.id === addonId);
    return addon ? Number(addon.quantity) || 0 : 0;
  };

  // Save item changes (instructions, addons) and collapse details
  const saveChanges = (e, id) => {
    e.stopPropagation();
    setLocalItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id === id && !item.isSaved) {
          if (typeof updateItemQuantity === "function") {
            updateItemQuantity(id, item.quantity, item.addons, item.details);
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

  // *** FIXED: Add-on Calculation Logic - Don't multiply add-ons by item quantity ***
  const calculateItemTotal = (item) => {
    const basePrice = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 0;

    if (quantity === 0) return 0;

    // Calculate total price of addons (NOT multiplied by item quantity)
    const addonsTotalPrice = (item.addons || []).reduce((sum, addon) => {
      const addonPrice = Number(addon.price) || 0;
      const addonQuantity = Number(addon.quantity) || 0;
      return sum + addonPrice * addonQuantity;
    }, 0);

    // Total cost = (Base Price * Item Quantity) + Addons Price
    const total = (basePrice * quantity) + addonsTotalPrice;
    return total;
  };

  // Calculate addon total for a single item (for display purposes)
  const calculateAddonTotal = (item) => {
    return (item.addons || []).reduce((sum, addon) => {
      const addonPrice = Number(addon.price) || 0;
      const addonQuantity = Number(addon.quantity) || 0;
      return sum + addonPrice * addonQuantity;
    }, 0);
  };

  // Calculate total cost of all items in the cart
  const calculateTotal = () => {
    return localItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  // Show delete item confirmation modal
  const confirmDeleteItem = (e, id) => {
    if (e) e.stopPropagation();
    setItemToDelete(id);
    setShowDeleteItemModal(true);
  };

  // Delete a single item from the cart (local state and context)
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

  // Show delete all items confirmation modal
  const confirmDeleteAllItems = () => {
    if (localItems.length === 0) return;
    setShowDeleteAllModal(true);
  };

  // Delete all items from the cart (local state and context)
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

  // Style for payment buttons based on selection
  const paymentButtonStyle = (
    isSelected // Original styling
  ) =>
    `border-2 p-3 rounded flex flex-col items-center transition-colors ${
      isSelected
        ? "bg-blue-100 border-blue-500"
        : "border-gray-300 hover:bg-gray-200"
    } ${localItems.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`;

  // Handle navigation to payment page
  const handlePayment = async () => {
    if (!selectedPayment || localItems.length === 0) {
      return;
    }

    if (currentOrderNumber === null || currentOrderNumber === undefined) {
      toast.error("Order number is not available. Please wait or try refreshing.");
      return;
    }
    const order_number = currentOrderNumber;

    try {
      // Generate ULID-like ref_number
      const generateUlidLike = () => {
        const timestampPart = new Date().getTime().toString(36).toUpperCase();
        // Generate a longer random part for better uniqueness, e.g., 7-10 characters
        const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase(); 
        return `${timestampPart}-${randomPart}`;
      };
      const ref_number = generateUlidLike();
      
      const payment_ref_id = Date.now() + Math.floor(Math.random() * 1000); // Keep this as is or could also be ULID-like if preferred

      // Determine payment method string for trans_table and payment_table
      const paymentMethodString = selectedPayment === "ewallet" ? "E-Wallet" : "Cash";

      // Determine payment status based on payment type
      const paymentStatus = selectedPayment === "ewallet" ? "Paid" : "Pending";
      
      const total_amount = calculateTotal();

      // 1. Insert into trans_table
      const { data: transData, error: transError } = await supabase
        .from('trans_table')
        .insert([
          {
            ref_number: ref_number, // New ULID-like ref_number
            order_number: order_number,
            order_type: selectedOption,
            trans_date: new Date().toISOString().split('T')[0],
            trans_time: new Date().toTimeString().split(' ')[0],
            order_status: 'Pending', // Initial order status is always Pending
            pymnt_status: paymentStatus, // Corrected payment status
            pymnt_method: paymentMethodString, // Corrected to insert string "Cash" or "E-Wallet"
            total_amntdue: total_amount,
            amount_paid: selectedPayment === "ewallet" ? total_amount : 0, // For e-wallet, amount_paid is total_amount
            user_id: user_id
          }
        ])
        .select();

      if (transError) {
        console.error("Transaction error:", transError);
        throw transError;
      }
      
      if (!transData || transData.length === 0) {
        throw new Error("No transaction data returned");
      }
      const trans_id = transData[0].trans_id;

      // 2. Insert items into trans_items_table (no changes needed here based on request)
      const itemsToInsert = localItems.map(item => {
        let order_notes = '';
        if (item.details) {
          order_notes += `Instructions: ${item.details}\n`;
        }
        if (item.addons && item.addons.length > 0) {
          order_notes += 'Add-ons: ' + item.addons.map(addon => 
            `${addon.name} (₱${addon.price})${addon.quantity > 1 ? ` x${addon.quantity}` : ''}`
          ).join(', ');
        }
        return {
          fk_trans_id: trans_id,
          fk_prod_id: String(item.id),
          prdct_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          item_subtotal: calculateItemTotal(item),
          order_notes: order_notes.trim()
        };
      });
      const { error: itemsError } = await supabase
        .from('trans_items_table')
        .insert(itemsToInsert);
      if (itemsError) {
        console.error("Items error:", itemsError);
        throw itemsError;
      }

      // 3. Insert into payment_table only for e-wallet payments
      if (selectedPayment === "ewallet") {
        const { error: paymentError } = await supabase
          .from('payment_table')
          .insert([
            {
              fk_trans_id: trans_id,
              pymnt_ref_id: payment_ref_id,
              order_number: order_number,
              pymnt_mthod: paymentMethodString, // Using "E-Wallet"
              pymnt_status: "Paid", // E-wallet is considered Paid immediately
              pymnt_amount: total_amount,
              pymnt_change: 0,
              pymnt_date: new Date().toISOString().split('T')[0],
              pymnt_time: new Date().toTimeString().split(' ')[0]
            }
          ]);
        if (paymentError) {
          console.error("Payment error:", paymentError);
          throw paymentError;
        }
      }

      // Prepare final order data for navigation
      const orderData = {
        trans_id: trans_id,
        ref_number: ref_number,
        order_number: order_number,
        items: localItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          details: item.details,
          addons: item.addons,
          itemTotal: calculateItemTotal(item),
        })),
        totalAmount: total_amount,
        diningOption: selectedOption,
        paymentMethod: selectedPayment, // This is 'cash' or 'ewallet'
      };

      if (typeof clearCart === "function") {
        clearCart();
      }
      toast.success("Order placed successfully!");

      // Navigate to appropriate page
      if (selectedPayment === "cash") {
        navigate("/order-conf", { state: { orderData } }); 
      } else if (selectedPayment === "ewallet") {
        // For e-wallet, pass the already determined 'Paid' status
        // The EWalletPayment page might not be strictly needed if payment is confirmed here
        // but if it is, ensure it handles this state correctly.
        // The OrderConfirmation page will use orderData.paymentMethod to show receipt.
        navigate("/ewallet-payment", { state: { orderData } }); // Or direct to order-conf if QR scan is simulated
      }

    } catch (error) {
      console.error("Error saving order:", error);
      toast.error("Failed to place order. Please try again.");
    }
  };

  // Modal component (Original structure)
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

  // --- Original JSX Structure ---
  return (
    // Fixed height outer div with no overflow
    <div className="min-h-screen flex flex-col bg-customBlack bg-cover bg-center overflow-hidden">
      <Header />
      {/* Main Content Section with fixed height - adjusted to prevent footer overlap */}
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
                // Empty cart display without redundant return button
                <div className="flex flex-col items-center justify-center h-40 text-white">
                  <p className="text-xl">Your cart is empty</p>
                </div>
              ) : (
                // Original item mapping structure
                <div className="space-y-4">
                  {localItems.map((item) => (
                    <div
                      key={item.id}
                      // Original item container styling
                      className="bg-gray-100 rounded-lg shadow-md cursor-pointer hover:bg-gray-200 transition-colors relative"
                      onClick={() => toggleExpand(item.id)} // Keep original toggle behavior
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
                                {(item.addons || []).length > 0 && (
                                  <div className="break-words">
                                    <span className="font-medium">
                                      Add-ons:{" "}
                                    </span>
                                    {item.addons.map((addon, idx) => (
                                      <span key={addon.id}>
                                        {addon.name} (₱{addon.price})
                                        {/* Show addon quantity if > 1 */}
                                        {Number(addon.quantity) > 1 &&
                                          ` x${addon.quantity}`}
                                        {idx < item.addons.length - 1
                                          ? ", "
                                          : ""}
                                      </span>
                                    ))}
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
                                className="text-xl px-2 hover:bg-gray-400 rounded-full w-8" // Kept original '+', size etc.
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
                            {item.addons && item.addons.length > 0 ? (
                              <div className="text-right">
                                <div>
                                  Base: ₱{item.price} × {item.quantity} = ₱
                                  {item.price * item.quantity}
                                </div>
                                <div>
                                  Add-ons: ₱{calculateAddonTotal(item)}
                                </div>
                                <div className="font-semibold">
                                  Total: ₱{calculateItemTotal(item)}
                                </div>
                              </div>
                            ) : (
                              <div>Total: ₱{calculateItemTotal(item)}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Item Customization Section - Contained within the scrollable area */}
                      {item.isExpanded && (
                        <div
                          className="border-t border-gray-200 p-4 space-y-2 bg-white overflow-visible"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Add-ons Section (Original structure) */}
                          <div className="space-y-2">
                            <h3 className="font-semibold">Add-ons</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {availableAddons.map((addon) => {
                                const quantity = getAddonQuantity(
                                  item,
                                  addon.id
                                );
                                return (
                                  // Original addon display structure
                                  <div
                                    key={addon.id}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                  >
                                    <span>
                                      {addon.name} - ₱{addon.price}
                                    </span>
                                    {/* Original addon quantity controls */}
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() =>
                                          updateAddonQuantity(
                                            item.id,
                                            addon,
                                            -1
                                          )
                                        }
                                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                          quantity > 0
                                            ? "bg-red-500 text-white" // Original colors
                                            : "bg-gray-300 text-gray-500"
                                        }`}
                                        disabled={quantity === 0}
                                      >
                                        -
                                      </button>
                                      <span className="w-6 text-center">
                                        {quantity}
                                      </span>
                                      <button
                                        onClick={() =>
                                          updateAddonQuantity(item.id, addon, 1)
                                        }
                                        className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center" // Original colors
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

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
                              className="w-full p-2 border rounded-md h-24" // Original styling
                            />
                          </div>

                          {/* Save Changes Button (Original structure) */}
                          <div className="flex justify-end pt-2">
                            <button
                              onClick={(e) => saveChanges(e, item.id)}
                              // Original styling, enable/disable logic added
                              className={`px-4 py-2 rounded transition-colors ${
                                item.isSaved
                                  ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                                  : "bg-blue-600 text-white hover:bg-blue-700"
                              }`}
                              disabled={item.isSaved}
                            >
                              {item.isSaved ? "Saved" : "Save Changes"}{" "}
                              {/* Adjusted label slightly */}
                            </button>
                          </div>
                        </div>
                      )}
                    </div> // End item container
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
                   flex items-center justify-center gap-2 border border-red-500 rounded hover:bg-red-600 transition" // Original styling
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
                          <div>₱{item.price} × {item.quantity}</div>
                        </div>
                        
                        {/* Improved add-ons display */}
                        {item.addons && item.addons.length > 0 && (
                          <div className="pl-4 mt-2 text-sm text-gray-600">
                            <div className="font-medium">Add-ons:</div>
                            {item.addons.map((addon) => (
                              <div key={addon.id} className="flex justify-between">
                                <div>
                                  • {addon.name} 
                                  {addon.quantity > 1 && ` (×${addon.quantity})`}
                                </div>
                                <div>₱{addon.price * addon.quantity}</div>
                              </div>
                            ))}
                            <div className="flex justify-between font-medium mt-2 text-black">
                              <div>Item Total:</div>
                              <div>₱{calculateItemTotal(item)}</div>
                            </div>
                          </div>
                        )}
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
                  selectedPayment && localItems.length > 0
                    ? "bg-red-500 hover:bg-red-600" // Original colors
                    : "bg-gray-400 cursor-not-allowed"
                }`}
                disabled={!selectedPayment || localItems.length === 0}
                onClick={handlePayment}
              >
                {/* Original button text logic */}
                {localItems.length === 0
                  ? "Cart is Empty"
                  : selectedPayment
                  ? "Proceed to Payment"
                  : "Select Payment Method"}
              </button>
            </div>
          </div>{" "}
          {/* End Payment Summary Section */}
        </div>{" "}
        {/* End Main Flex Container */}
      </main>{" "}
      {/* End Main Content Section */}
      <Footer className="mt-4" />
      {/* Modals (Original structure) */}
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
    </div> // End Root Div
  );
};

export default OrderReview;
