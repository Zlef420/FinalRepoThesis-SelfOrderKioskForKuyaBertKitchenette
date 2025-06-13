import React, { useState, useEffect, useContext } from "react";
import { supabase } from "../supabaseClient";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Navigation from "../components/Navigation";
import OrderSummary from "../components/OrderSummary";
import MenuCard from "../components/MenuCard";
import { CartContext } from "../context/CartContext";
import { Menu, ShoppingCart } from "lucide-react";



function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { cartItems, addToCart, deleteItem } = useContext(CartContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Menu");

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
    if (category) {
      setSelectedCategory(category);
    }
    setIsSidebarOpen(false);
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
          <Navigation onItemClick={handleCategorySelect} />
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
            {selectedCategory}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
            {loading && <p className="col-span-full text-gray-500 text-center">Loading menu...</p>}
            {error && <p className="col-span-full text-red-500 text-center">Error: {error}</p>}
            {!loading && !error && filteredItems.length > 0 ? (
              filteredItems.map((product) => (
                <MenuCard
                  key={product.product_id}
                  product={product}
                  onAddToCart={addToCart}
                />
              ))
            ) : !loading && !error && (
              /* No items matching search */
              <p className="col-span-full text-gray-500 text-center">
                No items match your search or no products available.
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
