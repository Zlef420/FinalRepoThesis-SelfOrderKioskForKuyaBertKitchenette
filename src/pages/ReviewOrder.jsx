import React, { useState, useEffect, useContext } from "react";
import Header from "../components/Header"; // Assuming these exist
import Footer from "../components/Footer"; // Assuming these exist
import { useNavigate } from "react-router-dom";
import {
  Trash2,
  Wallet,
  Smartphone,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  X,
} from "lucide-react";
import { CartContext } from "../context/CartContext"; // Assuming you have this context setup

// OrderReview component: displays and manages the user's order before payment
const OrderReview = () => {
  const navigate = useNavigate();
  // Get CartContext data - Adjust based on your actual context implementation
  const {
    cartItems,
    deleteItem,
    addToCart,
    removeItem, // Keep if needed
    updateItemQuantity, // Ideal function for context updates
    clearCart, // Ideal function for removing all
  } = useContext(CartContext);

  // State for dining option
  const [selectedOption, setSelectedOption] = useState(() => {
    return localStorage.getItem("diningOption") || "Dine In";
  });

  // State for cart items - Initialize robustly
  const [items, setItems] = useState(() => {
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
        console.error("Failed to parse cartItems from localStorage", e);
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

  // Sync local `items` state changes back to localStorage
  useEffect(() => {
    const validItems = items.filter(
      (item) => item && item.id && item.quantity > 0
    );
    localStorage.setItem("cartItems", JSON.stringify(validItems));
  }, [items]);

  // Sync dining option with localStorage
  useEffect(() => {
    localStorage.setItem("diningOption", selectedOption);
  }, [selectedOption]);

  // Sync with CartContext state if it changes externally (optional)
  // useEffect(() => {
  //    // Logic here if needed
  // }, [cartItems]);

  // *** FIXED: Minus button spam and quantity logic ***
  const updateQuantity = (e, id, increment) => {
    e.stopPropagation();

    const currentItem = items.find((item) => item.id === id);
    if (!currentItem) return;

    const currentQuantity = currentItem.quantity;

    // --- FIX: Check BEFORE state update if decrementing from 1 ---
    if (increment < 0 && currentQuantity === 1) {
      confirmDeleteItem(e, id); // Show modal, DO NOT change quantity
      return; // Stop processing this click
    }

    const newQuantity = Math.max(1, currentQuantity + increment);

    if (newQuantity !== currentQuantity) {
      setItems((currentItems) =>
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
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
      )
    );
  };

  // Update special instructions for an item
  const updateDescription = (id, description) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? { ...item, details: description, isSaved: false }
          : item
      )
    );
  };

  // Add or remove one instance of an addon
  const updateAddonQuantity = (itemId, addon, increment) => {
    setItems((prevItems) =>
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
    setItems((currentItems) =>
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
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
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
      const updatedItems = items.filter((item) => item.id !== itemToDelete);
      setItems(updatedItems);

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
    if (items.length === 0) return;
    setShowDeleteAllModal(true);
  };

  // Delete all items from the cart (local state and context)
  const deleteAllItems = () => {
    const itemIds = items.map((item) => item.id);
    setItems([]);

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
    } ${items.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`;

  // Handle navigation to payment page
  const handlePayment = () => {
    if (!selectedPayment || items.length === 0) {
      return;
    }

    // Prepare final order data (using original structure)
    const orderData = {
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        details: item.details,
        addons: item.addons,
        itemTotal: calculateItemTotal(item),
      })),
      totalAmount: calculateTotal(),
      diningOption: selectedOption,
      paymentMethod: selectedPayment,
    };

    const destination =
      selectedPayment === "ewallet" ? "/ewallet-payment" : "/order-conf";
    navigate(destination, { state: { orderData } });
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
    // Original outer div styling
    <div className="min-h-screen flex flex-col bg-customBlack bg-cover bg-center overflow-hidden">
      <Header />
      {/* Main Content Section (Original structure) */}
      <main className="flex-1 container mx-auto px-4 py-2 max-w-[1400px] overflow-y-auto">
        <div className="flex flex-col lg:flex-row justify-between gap-6">
          {/* Order List Section (Original structure) */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Order Header (Original structure) */}
            <div className="mb-4 text-white">
              <h2 className="text-2xl font-bold -mb-1 -mt-2">
                <span>Order</span>
                <span className="ml-2">#420</span>{" "}
                {/* Keep static as per original */}
              </h2>
              <div className="flex justify-between items-center border-b border-gray-600 pb-2">
                <p className="text-lg">Review your Order</p>
                <div>{items.length} Items in your cart</div>
              </div>
            </div>
            {/* Order Items List (Original structure) */}
            {/* Added scrollbar styling from previous version as it's helpful */}
            <div className="flex-1 overflow-y-auto pr-1 -mr-1 max-h-[55vh] lg:max-h-[calc(100vh-250px)] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-700">
              {items.length === 0 ? (
                // Original empty cart display
                <div className="flex flex-col items-center justify-center h-40 text-white">
                  <p className="text-xl mb-4">Your cart is empty</p>
                  <button
                    onClick={() => navigate("/home")}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded"
                  >
                    Return to Menu
                  </button>
                </div>
              ) : (
                // Original item mapping structure
                <div className="space-y-4">
                  {items.map((item) => (
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

                      {/* Item Customization Section (Original structure) */}
                      {item.isExpanded && (
                        <div
                          className="border-t border-gray-200 p-4 space-y-2 bg-white"
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
              {items.length > 0 && (
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
              <div className="overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 lg:max-h-[calc(100vh-400px)]">
                {items.length === 0 ? (
                  <p className="text-gray-500 text-center py-2">
                    No items in cart
                  </p>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
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
                    disabled={items.length === 0}
                  >
                    <Wallet className="size-6 mb-2" />
                    <span>Cash</span>
                  </button>
                  <button
                    onClick={() => setSelectedPayment("ewallet")}
                    className={paymentButtonStyle(selectedPayment === "ewallet")}
                    disabled={items.length === 0}
                  >
                    <Smartphone className="size-6 mb-2" />
                    <span>E-wallet</span>
                  </button>
                </div>
              </div>
              {/* Proceed to Payment Button (Original structure) */}
              <button
                className={`w-full py-3 text-white rounded text-center font-bold ${
                  selectedPayment && items.length > 0
                    ? "bg-red-500 hover:bg-red-600" // Original colors
                    : "bg-gray-400 cursor-not-allowed"
                }`}
                disabled={!selectedPayment || items.length === 0}
                onClick={handlePayment}
              >
                {/* Original button text logic */}
                {items.length === 0
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
      <Footer />
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
