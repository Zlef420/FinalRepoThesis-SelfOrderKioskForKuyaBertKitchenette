import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

const OrderReview = () => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState(() => {
    return localStorage.getItem("diningOption") || "Dine In";
  });
  const [items, setItems] = useState(() => {
    const savedItems = localStorage.getItem("cartItems");
    return savedItems ? JSON.parse(savedItems) : [];
  });
  const [selectedPayment, setSelectedPayment] = useState(null);

  const availableAddons = [
    { id: 1, name: "Gravy", price: 20 },
    { id: 2, name: "Extra Sauce", price: 15 },
    { id: 3, name: "Cheese", price: 25 },
    { id: 4, name: "Extra Rice", price: 30 },
  ];

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(items));
    localStorage.setItem("diningOption", selectedOption);
  }, [items, selectedOption]);

  const updateQuantity = (e, id, increment) => {
    e.stopPropagation();
    setItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.max(1, item.quantity + increment),
            }
          : item
      )
    );
  };

  const toggleExpand = (id) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
      )
    );
  };

  const updateDescription = (id, description) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? { ...item, details: description, isSaved: false }
          : item
      )
    );
  };

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

  const saveChanges = (e, id) => {
    e.stopPropagation();
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, isExpanded: false, isSaved: true } : item
      )
    );
  };

  const calculateItemTotal = (item) => {
    const addonsTotal = (item.addons || []).reduce(
      (sum, addon) => sum + addon.price,
      0
    );
    return (item.price + addonsTotal) * item.quantity;
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const deleteItem = (e, id) => {
    e.stopPropagation();
    setItems(items.filter((item) => item.id !== id));
  };

  const deleteAllItems = () => {
    setItems([]);
  };

  const paymentButtonStyle = (isSelected) =>
    `border-2 p-3 rounded flex flex-col items-center transition-colors ${
      isSelected
        ? "bg-blue-100 border-blue-500"
        : "border-gray-300 hover:bg-gray-200"
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-[url('../../public/images/photos/bgblack.jpg')] bg-cover bg-center">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-[1600px]">
        <div className="flex flex-col lg:flex-row justify-between gap-6 h-[calc(100vh-115px)]">
          {/* Left side - Order Items */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <div className="mb-4 text-white">
              <h2 className="text-2xl font-bold mb-2">Order #420</h2>
              <div className="flex justify-between items-center">
                <p className="text-lg">Review your Order</p>
                <div>{items.length} Items in your cart</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 -mr-2 max-h-[calc(100vh-220px)]">
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-100 rounded-lg shadow-md cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleExpand(item.id)}
                  >
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
                                  <span className="font-medium">Add-ons: </span>
                                  {item.addons.map((addon, idx) => (
                                    <span key={addon.id}>
                                      {addon.name} (₱{addon.price})
                                      {idx < item.addons.length - 1 ? ", " : ""}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 ml-4">
                          <div className="bg-white rounded-full flex items-center px-4 py-1">
                            <button
                              onClick={(e) => updateQuantity(e, item.id, -1)}
                              className="text-xl px-2"
                            >
                              -
                            </button>
                            <span className="mx-3">{item.quantity}</span>
                            <button
                              onClick={(e) => updateQuantity(e, item.id, 1)}
                              className="text-xl px-2"
                            >
                              +
                            </button>
                          </div>
                          <button
                            className="text-red-500 hover:text-red-700"
                            onClick={(e) => deleteItem(e, item.id)}
                          >
                            🗑
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 text-right text-gray-600">
                        Total: ₱{calculateItemTotal(item)}
                      </div>
                    </div>

                    {item.isExpanded && (
                      <div
                        className="border-t border-gray-200 p-4 space-y-4 bg-white"
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
                                    onChange={() => toggleAddon(item.id, addon)}
                                    className="rounded"
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
            </div>

            <div className="mt-4 flex justify-between items-center pt-4 border-t border-gray-700">
              <button
                onClick={() => navigate("/home")}
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded"
              >
                Return
              </button>
              {items.length > 0 && (
                <button
                  onClick={deleteAllItems}
                  className="py-2 px-2 text-sm text-red-500 hover:text-red-400 flex items-center justify-center gap-2 border border-red-500 rounded hover:bg-red-500/10 transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                  Remove all items
                </button>
              )}
            </div>
          </div>

          {/* Right side - Total and Payment */}
          <div className="w-full lg:w-80 bg-white rounded-lg p-4 lg:sticky lg:top-6">
            <h2 className="text-2xl font-bold mb-5">Total Cost</h2>

            <div className="overflow-y-auto max-h-[100px] mb-5 pr-2">
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-base">
                    <div>
                      <span className="mr-4">{item.name}</span>
                      <span>{item.quantity}x</span>
                    </div>
                    <div>₱{calculateItemTotal(item)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-b py-3 mb-5">
              <div className="flex justify-between font-bold">
                <span>Total Amount:</span>
                <span>₱{calculateTotal()}</span>
              </div>
            </div>

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
                >
                  <span className="text-xl mb-2">💵</span>
                  <span>Cash</span>
                </button>
                <button
                  onClick={() => setSelectedPayment("ewallet")}
                  className={paymentButtonStyle(selectedPayment === "ewallet")}
                >
                  <span className="text-xl mb-2">📱</span>
                  <span>E-wallet</span>
                </button>
              </div>
            </div>

            <button
              className={`w-full py-3 text-white rounded text-center font-bold ${
                selectedPayment
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              disabled={!selectedPayment}
            >
              {selectedPayment ? "Pay for Order" : "Select Payment Method"}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderReview;
