import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

function Navigation({ onItemClick }) {
  // State to track the selected menu item
  const [selectedItem, setSelectedItem] = useState("All Menu"); // "All Menu" active by default
  const navRef = useRef(null);

  // Menu items
  const menuItems = [
    "All Menu",
    "Affordameals",
    "Rice Meals",
    "Sizzlers",
    "Rice",
    "Beverage",
    "Soup",
    "Group Meals",
  ];

  // Handle item selection
  const handleItemClick = (item) => {
    setSelectedItem(item);
    if (onItemClick) onItemClick();
  };

  return (
    <nav className="w-full h-full bg-gray-800 text-white flex flex-col">
      {/* Close button - mobile only */}
      <div className="md:hidden flex justify-end p-2">
        <button className="p-1 text-white" onClick={onItemClick}>
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
        <ul className="max-w-sm sm:max-w-md md:max-w-lg w-full mx-auto space-y-2">
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
