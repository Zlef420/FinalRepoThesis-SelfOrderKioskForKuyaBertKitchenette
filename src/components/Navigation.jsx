import React, { useState } from "react";

function Navigation() {
  // State to track the selected menu item
  const [selectedItem, setSelectedItem] = useState("All Menu"); // "All Menu" active by default

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

  return (
    <nav className="w-1/6 bg-gray-800 text-white pt-1.5">
      <ul className="space-y-1.5 p-0">
        {menuItems.map((item) => (
          <li
            key={item}
            onClick={() => setSelectedItem(item)} // Update selected item on click
            className={`p-4 text-left cursor-pointer border border-white rounded ${
              selectedItem === item
                ? "bg-red-600 text-white" // Active item background red
                : "hover:bg-red-500 text-white" // Hover dark red
            }`}
          >
            {item}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Navigation;
