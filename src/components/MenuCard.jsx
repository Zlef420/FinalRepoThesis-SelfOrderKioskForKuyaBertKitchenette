import React, { useState, useEffect, useRef } from "react";
import { Delete } from "lucide-react";

function MenuCard({ product, onAddToCart }) {
  const { prdct_name: name, prdct_price: price, prdct_dscrpt: description, prdct_imgurl: image } = product;
  const isAvailable = product.is_available === true;
  const [isScaling, setIsScaling] = useState(false);
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);
  const [isQuantityModalVisible, setIsQuantityModalVisible] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const modalRef = useRef(null);
  const quantityModalRef = useRef(null);

  const handleAddToCartClick = (event) => {
    event.stopPropagation(); 
    setIsScaling(true);
    const itemToAdd = {
      id: product.product_id,
      name: name,
      price: price,
      image: image,
      description: description,
      quantity: 1
    };
    onAddToCart(itemToAdd);

    setTimeout(() => {
      setIsScaling(false);
    }, 200);
  };

  const handleAddWithQuantityClick = (event) => {
    event.stopPropagation();
    setQuantity("");
    setIsQuantityModalVisible(true);
  };

  const handleSubmitQuantity = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const parsedQuantity = parseInt(quantity, 10);
    if (!isNaN(parsedQuantity) && parsedQuantity > 0 && parsedQuantity <= 1000) {
      const itemToAdd = {
        id: product.product_id,
        name: name,
        price: price,
        image: image,
        description: description,
        quantity: parsedQuantity
      };
      onAddToCart(itemToAdd);
      setIsQuantityModalVisible(false);
      setQuantity("1");
    }
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) { // only allow digits
      if (value === "") {
        setQuantity("");
        return;
      }
      const numValue = parseInt(value, 10);
      if (numValue <= 1000) {
        setQuantity(value);
      }
    }
  };

  const handleDigitClick = (digit) => {
    setQuantity(prevQuantity => {
      const newQuantityStr = (prevQuantity === "" || prevQuantity === "0") ? digit.toString() : prevQuantity + digit.toString();
      const newQuantityNum = parseInt(newQuantityStr, 10);

      if (newQuantityNum <= 1000) {
        return newQuantityStr;
      } else {
        return prevQuantity;
      }
    });
  };

  const handleClearQuantity = () => {
    setQuantity("");
  };

  const handleBackspace = () => {
    setQuantity(prev => prev.slice(0, -1));
  };

  const handleCardClick = () => {
    setIsDescriptionVisible(true);
  };

  const handleCloseModal = () => {
    setIsDescriptionVisible(false);
  };

  const handleCloseQuantityModal = () => {
    setIsQuantityModalVisible(false);
    setQuantity("1");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleCloseModal();
      }
      if (quantityModalRef.current && !quantityModalRef.current.contains(event.target)) {
        handleCloseQuantityModal();
      }
    };

    if (isDescriptionVisible || isQuantityModalVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDescriptionVisible, isQuantityModalVisible]);

  const parsedQuantity = parseInt(quantity, 10);
  const isQuantityValid = !isNaN(parsedQuantity) && parsedQuantity >= 1 && parsedQuantity <= 1000;

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
          <div className="flex space-x-2">
            <button
              className="bg-red-500 text-white px-2 py-2 rounded hover:bg-red-600 transition flex-1 text-sm"
              onClick={handleAddToCartClick}
            >
              + Add
            </button>
            <button
              className="bg-blue-500 text-white px-2 py-2 rounded hover:bg-blue-600 transition flex-1 text-sm"
              onClick={handleAddWithQuantityClick}
            >
              Set Qty
            </button>
          </div>
        ) : (
          <button
            className="bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed w-full"
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
            
            <div className="text-center mt-5 flex space-x-2">
              {isAvailable ? (
                <>
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition flex-1"
                    onClick={(e) => { 
                      handleAddToCartClick(e); 
                      handleCloseModal(); 
                    }}
                  >
                    + Add to Cart
                  </button>
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseModal();
                      setQuantity("");
                      setIsQuantityModalVisible(true);
                    }}
                  >
                    Set Quantity
                  </button>
                </>
              ) : (
                <button
                  className="bg-gray-400 text-white px-6 py-2 rounded w-full cursor-not-allowed"
                  disabled
                >
                  Sold Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {isQuantityModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={quantityModalRef} className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full relative">
            <button
              onClick={handleCloseQuantityModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl leading-none"
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4 text-gray-800">Set Quantity for {name}</h3>
            
            <form onSubmit={handleSubmitQuantity}>
              <div className="mb-4">
                <input
                  type="text"
                  inputMode="numeric"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-full p-2 border border-gray-300 rounded text-center text-2xl font-bold bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1 text-center">Maximum quantity: 1000</p>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleDigitClick(num.toString())}
                    className="p-3 border bg-gray-100 rounded hover:bg-blue-100 transition text-xl font-medium"
                  >
                    {num}
                  </button>
                ))}
                 <button
                    type="button"
                    onClick={() => handleDigitClick("0")}
                    className="p-3 border bg-gray-100 rounded hover:bg-blue-100 transition text-xl font-medium col-span-1"
                  >
                    0
                  </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="p-3 border bg-yellow-100 rounded hover:bg-yellow-200 transition text-xl font-medium flex justify-center items-center"
                >
                  <Delete className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={handleClearQuantity}
                  className="p-3 border bg-red-100 rounded hover:bg-red-200 transition text-sm font-medium"
                >
                  Clear
                </button>
              </div>
              
              <button
                type="submit"
                className={`w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition ${
                  !isQuantityValid ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={!isQuantityValid}
              >
                Add to Cart
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default MenuCard;
