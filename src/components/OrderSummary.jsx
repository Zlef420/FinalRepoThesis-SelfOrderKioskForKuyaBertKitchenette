import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Sub-components
const DeleteModal = ({ onClose, onConfirm, title, message }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
    <div className="relative bg-white rounded-lg p-6 max-w-sm w-full mx-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-600">{message}</p>
      <div className="flex justify-end space-x-3">
        <button
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600"
          onClick={onConfirm}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

const OrderItem = ({ item, onDeleteClick }) => (
  <li className="flex justify-between items-center mb-2 bg-white p-3 rounded">
    <div>
      <p className="font-bold text-black text-sm">
        {item.name} x {item.quantity}
      </p>
      <p className="text-xs text-gray-500">{item.details}</p>
    </div>
    <div className="flex items-center space-x-2">
      <span className="text-black text-sm font-bold">
        ₱{(item.price * item.quantity).toFixed(2)}
      </span>
      <button
        className="text-red-500 hover:text-red-600"
        onClick={() => onDeleteClick(item.id)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
          />
        </svg>
      </button>
    </div>
  </li>
);

const DiningOption = ({ option, selected, onClick }) => (
  <button
    className={`px-6 py-2 rounded text-white transition ${
      selected ? "bg-red-500" : "bg-gray-700 hover:bg-gray-600"
    }`}
    onClick={() => onClick(option)}
  >
    {option}
  </button>
);

function OrderSummary({ cartItems, orderNumber, onDeleteItem }) {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState("Dine In");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRemoveAllModal, setShowRemoveAllModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Event Handlers
  const handleDeleteClick = (itemId) => {
    setItemToDelete(itemId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      onDeleteItem(itemToDelete);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleRemoveAll = () => {
    cartItems.forEach((item) => onDeleteItem(item.id));
    setShowRemoveAllModal(false);
  };

  const handleGoToPayment = () => {
    // Save current cart items and dining option before navigating
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
    localStorage.setItem("diningOption", selectedOption);
    navigate("/review-order");
  };

  return (
    <div className="w-1/5 bg-gray-900 text-white px-4 flex flex-col h-full">
      {/* Order Header */}
      <div className="">
        <h2 className="text-lg font-bold text-center">Order #{orderNumber}</h2>
        <div className="flex justify-center space-x-2 mt-2">
          <DiningOption
            option="Dine In"
            selected={selectedOption === "Dine In"}
            onClick={setSelectedOption}
          />
          <DiningOption
            option="Take Out"
            selected={selectedOption === "Take Out"}
            onClick={setSelectedOption}
          />
        </div>
        <hr className="border-gray-700 my-4" />
      </div>

      {/* Order List */}
      <div className="overflow-y-auto flex-grow">
        <ul>
          {cartItems.map((item) => (
            <OrderItem
              key={item.id}
              item={item}
              onDeleteClick={handleDeleteClick}
            />
          ))}
        </ul>
      </div>

      {/* Remove All Button */}
      {cartItems.length > 0 && (
        <div className="mt-1">
          <button
            onClick={() => setShowRemoveAllModal(true)}
            className="w-full py-2 text-sm text-red-500 hover:text-red-400 flex items-center justify-center gap-2 border border-red-500 rounded hover:bg-red-500/10 transition"
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
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pb-3">
        <hr className="border-gray-700 my-4" />
        <div className="flex justify-between font-bold text-lg">
          <span>Total Amount:</span>
          <span>₱{subtotal.toFixed(2)}</span>
        </div>
        <button
          onClick={handleGoToPayment}
          className="bg-red-500 text-white w-full py-2 mt-4 rounded hover:bg-red-600 transition"
        >
          Review Order
        </button>
      </div>

      {/* Modals */}
      {showDeleteModal && (
        <DeleteModal
          title="Confirm Delete"
          message="Are you sure you want to remove this item from your order? This action cannot be undone."
          onClose={() => {
            setShowDeleteModal(false);
            setItemToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}

      {showRemoveAllModal && (
        <DeleteModal
          title="Remove All Items"
          message="Are you sure you want to remove all items from your order? This action cannot be undone."
          onClose={() => setShowRemoveAllModal(false)}
          onConfirm={handleRemoveAll}
        />
      )}
    </div>
  );
}

export default OrderSummary;
