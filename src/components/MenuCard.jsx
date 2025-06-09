import React, { useState, useEffect, useRef } from "react";

function MenuCard({ product, onAddToCart }) {
  const { prdct_name: name, prdct_price: price, prdct_dscrpt: description, prdct_imgurl: image } = product;
  const isAvailable = product.is_available === true;
  const [isScaling, setIsScaling] = useState(false);
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);
  const modalRef = useRef(null);

  const handleAddToCartClick = (event) => {
    event.stopPropagation(); 
    setIsScaling(true);
    const itemToAdd = {
      id: product.product_id, // Map product_id to id
      name: name,             // Already mapped from prdct_name
      price: price,           // Already mapped from prdct_price
      image: image,           // Already mapped from prdct_imgurl
      description: description // Already mapped from prdct_dscrpt
    };
    onAddToCart(itemToAdd);

    setTimeout(() => {
      setIsScaling(false);
    }, 200);
  };

  const handleCardClick = () => {
    setIsDescriptionVisible(true);
  };

  const handleCloseModal = () => {
    setIsDescriptionVisible(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleCloseModal();
      }
    };

    if (isDescriptionVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDescriptionVisible]);

  return (
    <>
      <div
        className={`bg-yellow-50 rounded-lg shadow-md hover:shadow-lg p-4 text-center transition-all duration-200 cursor-pointer ${
          isScaling ? "scale-105" : "scale-100"
        }`}
        onClick={handleCardClick}
      >
        <div className="relative">
          <img
            src={image || "https://via.placeholder.com/150"}
            alt={name}
            className={`w-full h-32 object-cover rounded-md mb-4 ${!isAvailable ? 'opacity-50' : ''}`}
          />
          {!isAvailable && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md mb-4">
              <span className="text-white font-bold text-lg bg-red-600 px-4 py-2 rounded">SOLD OUT</span>
            </div>
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
        <p className="text-gray-600 mb-2">₱{typeof price === 'number' ? price.toFixed(2) : 'N/A'}</p>
        {isAvailable ? (
          <button
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
            onClick={handleAddToCartClick}
          >
            + Add to cart
          </button>
        ) : (
          <button
            className="bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed"
            disabled
          >
            Sold Out
          </button>
        )}
      </div>

      {isDescriptionVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={modalRef} className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl leading-none"
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-3 text-gray-800">{name}</h2>
            <div className="relative">
              <img 
                src={image || "https://via.placeholder.com/150"} 
                alt={name} 
                className={`w-full h-48 object-cover rounded-md mb-4 ${!isAvailable ? 'opacity-50' : ''}`} 
              />
              {!isAvailable && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md mb-4">
                  <span className="text-white font-bold text-lg bg-red-600 px-4 py-2 rounded">SOLD OUT</span>
                </div>
              )}
            </div>
            <p className="text-gray-700 mb-1 text-lg">Price: <span className="font-semibold">₱{typeof price === 'number' ? price.toFixed(2) : 'N/A'}</span></p>
            <p className="text-gray-600 text-sm mb-4">{description || "No description available."}</p>
            
            <div className="text-center mt-5">
              {isAvailable ? (
                <button
                  className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 transition w-full sm:w-auto"
                  onClick={(e) => { 
                    handleAddToCartClick(e); 
                    handleCloseModal(); 
                  }}
                >
                  + Add to Cart
                </button>
              ) : (
                <button
                  className="bg-gray-400 text-white px-6 py-2 rounded w-full sm:w-auto cursor-not-allowed"
                  disabled
                >
                  Sold Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MenuCard;
