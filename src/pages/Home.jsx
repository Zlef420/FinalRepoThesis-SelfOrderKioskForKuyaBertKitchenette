import React, { useState, useContext } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Navigation from "../components/Navigation";
import OrderSummary from "../components/OrderSummary";
import MenuCard from "../components/MenuCard";
import { CartContext } from "../context/CartContext";
import { Menu, ShoppingCart } from "lucide-react";

const menuItems = [
  { id: 1, name: "Sisig", price: 99 },
  { id: 2, name: "Fried Chicken", price: 99 },
  { id: 3, name: "Corn Soup", price: 50 },
  { id: 4, name: "Halo-halo", price: 89 },
  { id: 5, name: "Chaofan", price: 120 },
  { id: 6, name: "Tonkatsu", price: 99 },
];

function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const { cartItems, addToCart, deleteItem } = useContext(CartContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCartItems = cartItems.reduce(
    (total, item) => total + (item.quantity || 1),
    0
  );

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    if (isCartOpen) setIsCartOpen(false);
  };

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
    if (isSidebarOpen) setIsSidebarOpen(false);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />

      <div className="md:hidden flex justify-between items-center px-4 py-2 bg-gray-900 shadow-md">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md text-gray-100 hover:text-gray-300"
        >
          <Menu size={24} />
        </button>
        <button
          onClick={toggleCart}
          className="p-2 rounded-md text-gray-100 hover:text-gray-300 relative"
        >
          <ShoppingCart size={24} />
          {totalCartItems > 0 && (
            <span className="absolute -top-1 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {totalCartItems}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div
          className={`absolute md:relative md:block z-30 w-64 md:w-auto md:flex-shrink-0
             h-full transition-transform duration-300 transform ${
               isSidebarOpen
                 ? "translate-x-0"
                 : "-translate-x-full md:translate-x-0"
             }`}
        >
          <Navigation onItemClick={() => setIsSidebarOpen(false)} />
        </div>

        <div className="flex-1 overflow-y-scroll pb-4 bg-gray-100">
          <div className="sticky top-0 border rounded bg-gray-100 z-10 px-4 py-2 pt-2 shadow-md">
            <input
              type="text"
              placeholder="Search for food..."
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 mt-4 mb-2 px-4">
            Explore All Menu
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <MenuCard
                  key={item.id}
                  name={item.name}
                  price={item.price}
                  onAddToCart={() => addToCart(item)}
                />
              ))
            ) : (
              <p className="col-span-full text-gray-500 text-center">
                No items match your search.
              </p>
            )}
          </div>
        </div>

        <div
          className={`absolute md:relative md:block right-0 top-0 z-30 w-3/4 sm:w-2/3 md:w-auto md:flex-shrink-0 h-full transition-transform duration-300 transform ${
            isCartOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
          }`}
        >
          <OrderSummary
            cartItems={cartItems}
            orderNumber={1} // Example order number
            onDeleteItem={deleteItem}
            onCloseCart={() => setIsCartOpen(false)}
            isCartOpen={isCartOpen}
            controlledByParent={true}
          />
        </div>

        {(isSidebarOpen || isCartOpen) && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => {
              setIsSidebarOpen(false);
              setIsCartOpen(false);
            }}
          />
        )}
      </div>

      <Footer />
    </div>
  );
}

export default Home;
