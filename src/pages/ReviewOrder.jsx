import React, { useState, useEffect, useContext } from "react"; // ADDED: useContext
import Header from "../components/Header";
import Footer from "../components/Footer";
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
// ADDED: Import CartContext
import { CartContext } from "../context/CartContext";

// OrderReview component: displays and manages the user's order before payment
const OrderReview = () => {
  const navigate = useNavigate();
  // ADDED: Get CartContext data
  const { cartItems, deleteItem, addToCart } = useContext(CartContext);

  // State for dining option (e.g., "Dine In" or "Take Out")
  const [selectedOption, setSelectedOption] = useState(() => {
    return localStorage.getItem("diningOption") || "Dine In";
  });

  // State for cart items
  const [items, setItems] = useState(() => {
    const savedItems = localStorage.getItem("cartItems");
    return savedItems ? JSON.parse(savedItems) : [];
  });

  // State for selected payment method
  const [selectedPayment, setSelectedPayment] = useState(null);

  // State for modals
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Available addons for items
  const availableAddons = [
    { id: 1, name: "Gravy", price: 20 },
    { id: 2, name: "Extra Sauce", price: 15 },
    { id: 3, name: "Cheese", price: 25 },
    { id: 4, name: "Extra Rice", price: 30 },
  ];

  // Sync cart items and dining option with localStorage
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(items));
    localStorage.setItem("diningOption", selectedOption);
  }, [items, selectedOption]);

  // ADDED: Sync local items with CartContext cartItems on mount and when cartItems changes
  useEffect(() => {
    setItems(cartItems);
  }, [cartItems]);

  // Update item quantity
  const updateQuantity = (e, id, increment) => {
    e.stopPropagation();
    setItems(
      items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + increment) }
          : item
      )
    );
    // ADDED: Sync with CartContext
    if (increment > 0) {
      const item = items.find((i) => i.id === id);
      addToCart({ ...item, quantity: 1 });
    } else {
      deleteItem(id); // Remove one instance
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

  // Toggle addon selection for an item
  const toggleAddon = (itemId, addon) => {
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          const hasAddon = item.addons?.some((a) => a.id === addon.id);
          const newAddons = hasAddon
            ? item.addons.filter((a) => a.id !== addon.id)
            : [...(item.addons || []), addon];
          return { ...item, addons: newAddons, isSaved: false };
        }
        return item;
      })
    );
  };

  // Save item changes and collapse details
  const saveChanges = (e, id) => {
    e.stopPropagation();
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, isExpanded: false, isSaved: true } : item
      )
    );
  };

  // Calculate total price for a single item including addons
  const calculateItemTotal = (item) => {
    const addonsTotal = (item.addons || []).reduce(
      (sum, addon) => sum + addon.price,
      0
    );
    return (item.price + addonsTotal) * item.quantity;
  };

  // Calculate total cost of all items
  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  // Show delete item confirmation modal
  const confirmDeleteItem = (e, id) => {
    e.stopPropagation();
    setItemToDelete(id);
    setShowDeleteItemModal(true);
  };

  // Delete a single item from the cart
  const deleteItemLocal = () => {
    // Renamed to avoid conflict with CartContext deleteItem
    if (itemToDelete !== null) {
      setItems(items.filter((item) => item.id !== itemToDelete));
      deleteItem(itemToDelete); // ADDED: Sync with CartContext
      setShowDeleteItemModal(false);
      setItemToDelete(null);
    }
  };

  // Show delete all items confirmation modal
  const confirmDeleteAllItems = () => {
    setShowDeleteAllModal(true);
  };

  // Delete all items from the cart
  const deleteAllItems = () => {
    setItems([]);
    cartItems.forEach((item) => deleteItem(item.id)); // ADDED: Sync with CartContext
    setShowDeleteAllModal(false);
  };

  // Style for payment buttons based on selection
  const paymentButtonStyle = (isSelected) =>
    `border-2 p-3 rounded flex flex-col items-center transition-colors ${
      isSelected
        ? "bg-blue-100 border-blue-500"
        : "border-gray-300 hover:bg-gray-200"
    }`;

  // Handle payment navigation based on method
  const handlePayment = () => {
    if (items.length === 0) {
      return; // Prevent proceeding if cart is empty
    }

    if (selectedPayment === "ewallet") {
      navigate("/ewallet-payment", {
        state: { paymentMethod: selectedPayment },
      });
    } else {
      navigate("/order-conf", { state: { paymentMethod: selectedPayment } });
    }
  };

  // Modal component for confirmation dialogs
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
    <div className="min-h-screen flex flex-col bg-customBlack bg-cover bg-center">
      <Header />

      {/* Main Content Section */}
      <main className="flex-1 container mx-auto px-4 py-3 max-w-[1600px]">
        <div className="flex flex-col lg:flex-row justify-between gap-6 h-[calc(100vh-115px)]">
          {/* Order List Section */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Order Header */}
            <div className="mb-4 text-white">
              <h2 className="text-2xl font-bold -mb-1 -mt-2">
                <span>Order</span>
                <span className="ml-2">#420</span>
              </h2>
              <div className="flex justify-between items-center border-b border-gray-600 pb-2">
                <p className="text-lg">Review your Order</p>
                <div>{items.length} Items in your cart</div>
              </div>
            </div>

            {/* Order Items List */}
            <div className="flex-1 overflow-y-auto pr-2 -mr-2 max-h-[calc(100vh-220px)]">
              {items.length === 0 ? (
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
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-100 rounded-lg shadow-md cursor-pointer hover:bg-gray-200 transition-colors relative"
                      onClick={() => toggleExpand(item.id)}
                    >
                      <div className="mt-5 absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 rounded-full p-1 text-white">
                        {item.isExpanded ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </div>

                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex items-center gap-4">
                              <span className="font-semibold text-lg truncate">
                                {item.name}
                              </span>
                              <span className="text-gray-600 whitespace-nowrap">
                                ₱{item.price}
                              </span>
                            </div>

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

                          <div className="flex items-center gap-4 ml-4">
                            <div className="bg-gray-300 rounded-full flex items-center px-4 py-1">
                              <button
                                onClick={(e) => updateQuantity(e, item.id, -1)}
                                className="text-xl px-2 hover:bg-gray-400 rounded-full w-8"
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
                            <button
                              className="text-red-500 hover:text-red-700"
                              onClick={(e) => confirmDeleteItem(e, item.id)}
                            >
                              <Trash2 className="size-5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-end items-center mt-2">
                          <div className="text-gray-600">
                            Total: ₱{calculateItemTotal(item)}
                          </div>
                        </div>
                      </div>

                      {/* Item Customization Section */}
                      {item.isExpanded && (
                        <div
                          className="border-t border-gray-200 p-4 space-y-2 bg-white"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="space-y-2">
                            <h3 className="font-semibold">Add-ons</h3>
                            <div className="grid grid-cols-2 gap-2">
                              {availableAddons.map((addon) => (
                                <label
                                  key={addon.id}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                >
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={(item.addons || []).some(
                                        (a) => a.id === addon.id
                                      )}
                                      onChange={() =>
                                        toggleAddon(item.id, addon)
                                      }
                                      className="rounded cursor-pointer"
                                    />
                                    <span>{addon.name}</span>
                                  </div>
                                  <span className="text-gray-600">
                                    ₱{addon.price}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>

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

                          <div className="flex justify-end pt-2">
                            <button
                              onClick={(e) => saveChanges(e, item.id)}
                              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Actions Section */}
            <div className="mt-4 flex justify-between items-center pt-4 border-t border-gray-700">
              <button
                onClick={() => navigate("/home")}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded"
              >
                Return
              </button>
              {items.length > 0 && (
                <button
                  onClick={confirmDeleteAllItems}
                  className="py-2 px-2 text-sm text-red-500 hover:text-white
                   flex items-center justify-center gap-2 border border-red-500 rounded hover:bg-red-600 transition"
                >
                  <Trash2 className="size-4" />
                  Remove all items
                </button>
              )}
            </div>
          </div>

          {/* Payment Summary Section */}
          <div className="w-full lg:w-80 bg-white rounded-lg p-4 lg:sticky lg:top-6">
            <h2 className="text-2xl font-bold mb-5">Total Cost</h2>

            {/* Cart Summary */}
            <div className="overflow-y-auto max-h-[100px] mb-5 pr-2">
              {items.length === 0 ? (
                <p className="text-gray-500 text-center py-2">
                  No items in cart
                </p>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-base"
                    >
                      <div>
                        <span className="mr-4">{item.name}</span>
                        <span>{item.quantity}x</span>
                      </div>
                      <div>₱{calculateItemTotal(item)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total Amount */}
            <div className="border-t border-b py-3 mb-5">
              <div className="flex justify-between font-bold">
                <span>Total Amount:</span>
                <span>₱{calculateTotal()}</span>
              </div>
            </div>

            {/* Payment Options Section */}
            <div className="mb-5">
              <div className="flex justify-between mb-3">
                <span>Dining choice</span>
                <span>{selectedOption}</span>
              </div>

              <div className="font-bold mb-3">Select Payment Method:</div>
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

            {/* Proceed to Payment Button */}
            <button
              className={`w-full py-3 text-white rounded text-center font-bold ${
                selectedPayment && items.length > 0
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              disabled={!selectedPayment || items.length === 0}
              onClick={handlePayment}
            >
              {items.length === 0
                ? "Cart is Empty"
                : selectedPayment
                ? "Proceed to Payment"
                : "Select Payment Method"}
            </button>
          </div>
        </div>
      </main>

      <Footer />

      {/* Delete Item Confirmation Modal */}
      <ConfirmationModal
        show={showDeleteItemModal}
        title="Remove Item"
        message="Are you sure you want to remove this item from your cart?"
        onConfirm={deleteItemLocal} // Updated to use local function name
        onCancel={() => setShowDeleteItemModal(false)}
      />

      {/* Delete All Items Confirmation Modal */}
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
