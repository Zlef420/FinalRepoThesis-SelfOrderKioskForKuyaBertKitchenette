import React, { useState } from "react";

const MenuList = ({ searchTerm, setSearchTerm }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [menuForm, setMenuForm] = useState({
    name: "",
    price: "",
    category: "",
    image: null,
    imagePreview: null,
  });

  // Sample menu data
  const [menuItems, setMenuItems] = useState([
    {
      id: 1,
      name: "Sisig",
      price: 99,
      image: "/placeholder.jpg",
      category: "Main Dish",
    },
    {
      id: 2,
      name: "Carbonara",
      price: 99,
      image: "/placeholder.jpg",
      category: "Pasta",
    },
  ]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMenuForm({
        ...menuForm,
        image: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  const handleEdit = (item) => {
    setMenuForm({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      image: item.image,
      imagePreview: item.image,
    });
    setIsEditing(true);
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setMenuItems(menuItems.filter((item) => item.id !== selectedItem.id));
    setShowDeleteModal(false);
    setSelectedItem(null);
  };

  const handleMenuSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      setMenuItems(
        menuItems.map((item) =>
          item.id === menuForm.id ? { ...menuForm } : item
        )
      );
    } else {
      const newItem = {
        id: menuItems.length + 1,
        ...menuForm,
      };
      setMenuItems([...menuItems, newItem]);
    }
    resetForm();
  };

  const resetForm = () => {
    setMenuForm({
      name: "",
      price: "",
      category: "",
      image: null,
      imagePreview: null,
    });
    setIsEditing(false);
  };

  const filteredMenuItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="flex h-[calc(100vh-160px)]">
        {/* Scrollable menu list */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search menu items..."
              className="w-full p-2 bg-gray-200 rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 overflow-y-auto h-full">
            {filteredMenuItems.map((item) => (
              <div key={item.id} className="bg-gray-200 p-4 rounded">
                <div className="h-40 bg-gray-300 mb-2">
                  <img
                    src={item.image || "/api/placeholder/400/320"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div>₱{item.price}</div>
                    <div className="text-sm text-gray-600">{item.category}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="p-1 text-blue-600"
                      onClick={() => handleEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="p-1 text-red-600"
                      onClick={() => handleDelete(item)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Permanent Add/Edit Menu Panel */}
        <div className="max-w-md mx-auto border-l border-gray-200 bg-white">
          <div className="sticky top-0 p-4">
            <h2 className="text-xl font-semibold mb-2">
              {isEditing ? "Edit Menu Item" : "Add New Menu Item"}
            </h2>
            <form onSubmit={handleMenuSubmit}>
              <div className="mb-4">
                <div
                  className="mb-2 relative h-32 w-full bg-gray-100 rounded flex items-center justify-center cursor-pointer"
                  onClick={() => document.getElementById("imageInput").click()}
                >
                  {menuForm.imagePreview ? (
                    <img
                      src={menuForm.imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover rounded"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="text-gray-400">Click to select image</div>
                    </div>
                  )}
                </div>
                <input
                  id="imageInput"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium">
                  Product Name:
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={menuForm.name}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium">
                  Category:
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={menuForm.category}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, category: e.target.value })
                  }
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium">Price:</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={menuForm.price}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, price: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {isEditing ? "Save Changes" : "Add Item"}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg w-80">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete {selectedItem?.name}?
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuList;
