import React, { useState, useEffect, useContext } from "react";
import { supabase } from "../supabaseClient";
import MenuCard from "./MenuCard";
import Navigation from "./Navigation";
import { X, Search } from "lucide-react";

const AddOrderModal = ({ transaction, onClose, onConfirm, onTogglePrepared }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Menu");
  const [newItems, setNewItems] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data, error: dbError } = await supabase
          .from('product_details')
          .select('*')
          .order('prdct_name', { ascending: true });

        if (dbError) throw dbError;
        setProducts(data || []);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.message || 'Failed to fetch products.');
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const addToCart = (item) => {
    setNewItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);
      if (existingItem) {
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prevItems, item];
    });
  };

  const updateItemQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      deleteItem(itemId);
      return;
    }
    setNewItems(newItems.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item));
  };

  const deleteItem = (itemId) => {
    setNewItems(newItems.filter(item => item.id !== itemId));
  };

  const filteredItems = products
    .filter(
      (product) =>
        selectedCategory === "All Menu" ||
        (product.prdct_categ &&
          product.prdct_categ.toLowerCase() === selectedCategory.toLowerCase())
    )
    .filter(
      (product) =>
        product.prdct_name &&
        product.prdct_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const newItemsTotal = newItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const originalTotal = transaction.TAmount;
  const newGrandTotal = originalTotal + newItemsTotal;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-gray-100 rounded-lg shadow-xl w-[95%] h-[90%] flex flex-col">
        <div className="flex justify-between items-center p-4 bg-white rounded-t-lg border-b">
          <h2 className="text-2xl font-bold text-gray-800">Add More Items to Order #{transaction.ORN}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={28} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Menu */}
          <div className="w-2/3 flex flex-col p-4 overflow-hidden">
            <div className="flex gap-4 flex-1 overflow-hidden">
                <div className="w-48 overflow-y-auto pr-2">
                    <Navigation onItemClick={handleCategorySelect} />
                </div>
                <div className="flex-1 flex flex-col gap-4">
                    <div className="relative shrink-0">
                        <input
                        type="text"
                        placeholder="Search for food..."
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2 px-1">
                            {selectedCategory}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {loading && <p className="col-span-full text-center">Loading...</p>}
                        {error && <p className="col-span-full text-center text-red-500">{error}</p>}
                        {!loading && !error && filteredItems.length > 0 ? (
                            filteredItems.map((product) => (
                            <MenuCard
                                key={product.product_id}
                                product={product}
                                onAddToCart={addToCart}
                            />
                            ))
                        ) : (
                            <p className="col-span-full text-center text-gray-500">No items found.</p>
                        )}
                        </div>
                    </div>
                </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="w-1/3 bg-white flex flex-col p-4 border-l">
            <div className="flex-1 overflow-y-auto">
              {/* Existing Items */}
              <div>
                <h3 className="text-lg font-semibold mb-2 border-b pb-2">Existing Items</h3>
                <ul className="text-sm space-y-2">
                  {transaction.items.map((item, index) => (
                    <li key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-gray-600"> (x{item.quantity})</span>
                        </div>
                        <span className="font-semibold">
                          ₱{(item.total).toFixed(2)}
                        </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* New Items */}
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2 border-b pb-2">New Items</h3>
                {newItems.length > 0 ? (
                  <ul className="text-sm space-y-2">
                    {newItems.map((item) => (
                      <li key={item.id} className="flex justify-between items-center">
                        <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <button onClick={() => updateItemQuantity(item.id, item.quantity - 1)} className="px-2 py-0.5 border rounded">-</button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <button onClick={() => updateItemQuantity(item.id, item.quantity + 1)} className="px-2 py-0.5 border rounded">+</button>
                                <button onClick={() => deleteItem(item.id)} className="ml-2 text-red-500 hover:text-red-700">Remove</button>
                            </div>
                        </div>
                        <span className="font-semibold">₱{(item.price * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-center py-4">No new items added yet.</p>
                )}
              </div>
            </div>

            {/* Footer with Totals and Actions */}
            <div className="border-t pt-4 mt-4 space-y-3">
               <div className="flex justify-between text-sm">
                <span>Original Total:</span>
                <span>₱{originalTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-blue-600">
                <span>Additional Total:</span>
                <span>₱{newItemsTotal.toFixed(2)}</span>
              </div>
               <div className="flex justify-between text-xl font-bold">
                <span>New Grand Total:</span>
                <span>₱{newGrandTotal.toFixed(2)}</span>
              </div>
              <button
                onClick={() => onConfirm(newItems, newGrandTotal)}
                disabled={newItems.length === 0}
                className="w-full bg-customOrange text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Confirm & Update Order
              </button>
              <button
                onClick={onClose}
                className="w-full text-center text-gray-600 hover:text-gray-800 mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddOrderModal; 