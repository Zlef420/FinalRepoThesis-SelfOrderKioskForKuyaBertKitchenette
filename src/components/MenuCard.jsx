import React, { useState } from "react";

function MenuCard({ name, price, onAddToCart }) {
  const [isScaling, setIsScaling] = useState(false);

  const handleClick = () => {
    setIsScaling(true);
    onAddToCart();

    // Reset the animation after it completes
    setTimeout(() => {
      setIsScaling(false);
    }, 200); // Match this with the animation duration
  };

  return (
    <div
      className={`bg-yellow-50 rounded-lg shadow-md hover:shadow-lg p-4 text-center transition-all duration-200 ${
        isScaling ? "scale-105" : "scale-100"
      }`}
    >
      <img
        src="https://via.placeholder.com/150"
        alt={name}
        className="w-full h-32 object-cover rounded-md mb-4"
      />
      <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
      <p className="text-gray-600 mb-2">₱{price.toFixed(2)}</p>
      <button
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        onClick={handleClick}
      >
        + Add to cart
      </button>
    </div>
  );
}

export default MenuCard;
