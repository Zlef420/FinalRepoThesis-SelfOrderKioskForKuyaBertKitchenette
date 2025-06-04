import React, { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cartItems");
    const initialCart = savedCart ? JSON.parse(savedCart) : [];
    return initialCart.map(item => {
      const itemId = item.id || item.product_id; // Ensure 'id' is consistently mapped
      const itemName = (typeof item.name === 'string' && item.name.trim() !== '') ? item.name : 
                       (typeof item.prdct_name === 'string' ? item.prdct_name.trim() : 'Unknown Item');
      const itemPrice = !isNaN(parseFloat(item.price)) ? parseFloat(item.price) : 
                        (!isNaN(parseFloat(item.prdct_price)) ? parseFloat(item.prdct_price) : 0);
      const itemQuantity = parseInt(item.quantity) || 1;
      const itemImage = item.image || item.prdct_imgurl;
      const itemDescription = item.description || item.prdct_dscrpt;

      return { // Construct a new object with only the properties we care about
        id: itemId,
        name: itemName,
        price: itemPrice,
        quantity: itemQuantity,
        image: itemImage,
        description: itemDescription
      };
    });
  });

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item) => {
    setCartItems((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        // 'item' here is from MenuCard, already structured with id, name, price, image, description
        return [...prevCart, {
          id: item.id,
          name: String(item.name || 'Unknown Item').trim(), // Ensure name is a non-empty string
          price: parseFloat(item.price) || 0,           // Ensure price is a number
          quantity: 1,                                  // New items always start with quantity 1
          image: item.image,                            // Pass through image
          description: item.description                 // Pass through description
        }];
      }
    });
  };

  const deleteItem = (id) => {
    setCartItems((prevCart) =>
      prevCart.filter((cartItem) => cartItem.id !== id)
    );
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, deleteItem }}>
      {children}
    </CartContext.Provider>
  );
};
