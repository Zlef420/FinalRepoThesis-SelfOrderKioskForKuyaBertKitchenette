import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

function Navigation({ onItemClick }) {
  const [selectedItem, setSelectedItem] = useState("All Menu");
  const navRef = useRef(null);

  const menuItems = [
    "All Menu",
    "Affordable Meals",
    "Appetizers",
    "Beef",
    "Beverages",
    "Chicken",
    "Chicken Wings",
    "Dessert",
    "Milk Tea & Coffee",
    "Noodles",
    "Pasta & Sides",
    "Pork",
    "Rice",
    "Rice Meals",
    "Seafoods",
    "Sizzlers",
    "Soup",
    "Vegetables",
  ];

  const handleItemClick = (item) => {
    setSelectedItem(item);
    if (onItemClick) onItemClick(item);
  };

  return (
    <nav
      className="w-48 h-full bg-gray-800 text-white flex flex-col border-r border-gray-700"
      style={{
        backgroundColor: "#1F2937",
      }}
    >
      {/* Close button - mobile only */}
      <div className="md:hidden flex justify-end p-2">
        <button className="p-1 text-white" onClick={() => onItemClick && onItemClick()}>
          <X size={24} />
        </button>
      </div>
      {/* Menu items */}
      <div
        ref={navRef}
        className="flex-1 overflow-y-auto p-2"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#4B5563 #1F2937",
        }}
      >
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li
              key={item}
              onClick={() => handleItemClick(item)}
              className={`p-3 text-left cursor-pointer border border-gray-400 rounded text-sm sm:text-base transition ${
                selectedItem === item
                  ? "bg-red-600 text-white"
                  : "hover:bg-red-500 text-white"
              }`}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;
