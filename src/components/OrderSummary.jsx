import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash, ShoppingCart, X } from "lucide-react";

// Sub-components
const DeleteModal = ({ onClose, onConfirm, title, message }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
    <div className="relative bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full mx-4 space-y-4">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-gray-600">{message}</p>
      <div className="flex justify-end space-x-3">
        <button
          className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm text-white bg-red-500 rounded hover:bg-red-600"
          onClick={onConfirm}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

const OrderItem = ({ item, onDeleteClick }) => (
  <li className="flex justify-between items-center mb-2 bg-white p-2 sm:p-3 rounded">
    <div>
      <p className="font-bold text-black text-xs sm:text-sm">
        {item.name} x {item.quantity}
      </p>
      <p className="text-xs text-gray-500">{item.details}</p>
    </div>
    <div className="flex items-center space-x-2">
      <span className="text-black text-xs sm:text-sm font-bold">
        ₱{(item.price * item.quantity).toFixed(2)}
      </span>
      <button
        className="text-red-500 hover:text-red-600"
        onClick={() => onDeleteClick(item.id)}
      >
        <Trash className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </div>
  </li>
);

const DiningOption = ({ option, selected, onClick }) => (
  <button
    className={`
      w-full 
      px-2 
      sm:px-3 
      md:px-4 
      py-1 
      sm:py-1.5 
      md:py-2 
      rounded 
      text-white 
      transition 
      text-[0.6rem] 
      xs:text-xs 
      sm:text-sm 
      leading-none 
      flex 
      items-center 
      justify-center
      ${selected ? "bg-red-500" : "bg-gray-700 hover:bg-gray-600"}`}
    onClick={() => onClick(option)}
  >
    {option}
  </button>
);

function OrderSummary({
  cartItems,
  orderNumber,
  onDeleteItem,
  onCloseCart,
  isCartOpen,
  controlledByParent = false,
}) {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState("Dine In");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRemoveAllModal, setShowRemoveAllModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  // Only use internal state when not controlled by parent
  const [internalCartOpen, setInternalCartOpen] = useState(false);

  // Use the appropriate cart open state
  const effectiveCartOpen = controlledByParent ? isCartOpen : internalCartOpen;

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const totalItems = cartItems.reduce(
    (count, item) => count + item.quantity,
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

  const handleCloseCart = () => {
    if (controlledByParent && onCloseCart) {
      onCloseCart();
    } else {
      setInternalCartOpen(false);
    }
  };

  // Only render the mobile cart button if not controlled by parent
  const renderMobileCartButton = !controlledByParent;

  return (
    <>
      {/* Mobile Cart Button - Only show when NOT controlled by parent component */}
      {renderMobileCartButton && (
        <button
          className="fixed top-4 right-4 z-50 p-2 rounded-md bg-red-600 text-white md:hidden flex items-center justify-center"
          onClick={() => setInternalCartOpen(!internalCartOpen)}
        >
          <ShoppingCart size={24} />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-white text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {totalItems}
            </span>
          )}
        </button>
      )}

      {/* Order Summary Panel */}
      <div
        className={`fixed md:static top-0 right-0 z-40 w-3/4 sm:w-2/3 md:w-1/5 min-w-[250px] bg-gray-900 text-white px-2 sm:px-3 md:px-4 flex flex-col h-full transition-transform duration-300 transform ${
          effectiveCartOpen
            ? "translate-x-0"
            : "translate-x-full md:translate-x-0"
        }`}
      >
        {/* Close button for mobile */}
        <button
          className="absolute top-2 right-6 p-0 text-white md:hidden rounded bg-red-500 hover:bg-red-600"
          onClick={handleCloseCart}
        >
          <X size={20} />
        </button>

        {/* Order Header */}
        <div className="pt-6 md:pt-0">
          <h2 className="text-base sm:text-lg font-bold text-center pt-2">
            Order #{orderNumber}
          </h2>
          <div className="flex justify-center space-x-2 mt-2 overflow-auto">
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
          <hr className="border-gray-700 my-3 sm:my-4" />
        </div>

        {/* Order List or Empty Cart Message */}
        <div className="overflow-y-auto flex-grow -mt-2">
          {cartItems.length > 0 ? (
            <ul>
              {cartItems.map((item) => (
                <OrderItem
                  key={item.id}
                  item={item}
                  onDeleteClick={handleDeleteClick}
                />
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-6">
              <ShoppingCart className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-base font-medium">Your Cart Is Empty</p>
              <p className="text-xs text-gray-400 mt-1">
                Add items to get started
              </p>
            </div>
          )}
        </div>

        {/* Remove All Button */}
        {cartItems.length > 0 && (
          <div className="mt-1 -mb-2">
            <button
              onClick={() => setShowRemoveAllModal(true)}
              className="w-full py-1.5 sm:py-2 text-xs sm:text-sm text-red-500 hover:text-red-600 flex 
              items-center justify-center gap-1 sm:gap-2 border border-red-500 rounded hover:bg-red-500/10 transition"
            >
              <Trash className="w-3 h-3 sm:w-4 sm:h-4" />
              Remove all items
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pb-2 sm:pb-3">
          <hr className="border-gray-700 my-3 sm:my-4" />
          <div className="flex justify-between font-bold text-base sm:text-lg">
            <span>Total Amount:</span>
            <span>₱{subtotal.toFixed(2)}</span>
          </div>
          <button
            onClick={handleGoToPayment}
            disabled={cartItems.length === 0}
            className={`w-full py-1.5 sm:py-2 mt-3 sm:mt-4 rounded text-sm sm:text-base transition ${
              cartItems.length > 0
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-gray-500 cursor-not-allowed text-gray-300"
            }`}
          >
            Review Order
          </button>
        </div>
      </div>

      {/* Overlay for mobile - Only add when NOT controlled by parent */}
      {!controlledByParent && effectiveCartOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setInternalCartOpen(false)}
        />
      )}

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
    </>
  );
}

export default OrderSummary;
