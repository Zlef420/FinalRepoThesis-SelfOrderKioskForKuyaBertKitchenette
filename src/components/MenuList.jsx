import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../supabaseClient"; // Import Supabase client

const MenuList = ({ searchTerm, setSearchTerm }) => {
  const BUCKET_NAME = 'product-images';
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [menuForm, setMenuForm] = useState({
    id: null,
    name: "",
    price: "",
    category: "",
    image: null,
    imagePreview: null,
    isAvailable: true,
  });
  const fileInputRef = useRef(null);

  const [menuItems, setMenuItems] = useState([]); // Correctly initialized as empty, will be fetched from Supabase

  // Fetch menu items from Supabase
  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('product_details')
        .select('product_id, prdct_name, prdct_price, prdct_categ, is_available, prdct_imgurl');

      if (error) {
        console.error('Error fetching menu items:', error);
        alert('Failed to fetch menu items.');
        setMenuItems([]);
        return;
      }
      // Map Supabase columns to component state structure
      const formattedData = data.map(item => ({
        id: item.product_id,
        name: item.prdct_name,
        price: item.prdct_price,
        category: item.prdct_categ,
        isAvailable: item.is_available,
        image: item.prdct_imgurl, // This will be the Supabase storage URL
      }));
      setMenuItems(formattedData);
    } catch (err) {
      console.error('Unexpected error fetching menu items:', err);
      alert('An unexpected error occurred while fetching menu items.');
      setMenuItems([]);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Effect for cleaning up blob URLs
  useEffect(() => {
    return () => {
      if (menuForm.imagePreview && menuForm.imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(menuForm.imagePreview);
      }
    };
  }, [menuForm.imagePreview]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if the file is an image
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPEG, PNG, GIF, etc.)');
        return;
      }
      
      if (menuForm.imagePreview && menuForm.imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(menuForm.imagePreview);
      }
      const imagePreview = URL.createObjectURL(file);
      setMenuForm((prev) => ({
        ...prev,
        image: file,
        imagePreview: imagePreview,
      }));
    }
  };

  const handleEdit = (item) => {
    if (menuForm.imagePreview && menuForm.imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(menuForm.imagePreview);
    }
    setMenuForm({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      image: null,
      imagePreview: item.image,
      isAvailable: item.isAvailable,
    });
    setIsEditing(true);
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };
  const handleAvailabilityToggle = (item) => {
    setSelectedItem(item);
    setShowAvailabilityModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;

    try {
      // 1. Delete image from Supabase Storage if it exists
      if (selectedItem.image) {
        try {
            // Extract file name from URL. Assumes URL is like: .../bucket_name/file_name.jpg?token=...
            // Or .../bucket_name/file_name.jpg (if no token for public URLs)
            const urlParts = selectedItem.image.split('/');
            let fileNameWithPotentialQuery = urlParts[urlParts.length - 1];
            const fileName = fileNameWithPotentialQuery.split('?')[0]; // Remove query parameters if any
            
            if (fileName) {
                console.log(`Attempting to delete from storage: ${BUCKET_NAME}/${fileName}`);
                const { error: storageError } = await supabase.storage
                .from(BUCKET_NAME)
                .remove([fileName]);
                if (storageError) {
                // Log storage error but don't necessarily block DB deletion if it's just a cleanup step
                console.error('Error deleting image from storage:', storageError);
                // alert(`Could not delete image from storage: ${storageError.message}. Proceeding with DB deletion.`);
                }
            } else {
                console.warn('Could not extract filename from image URL:', selectedItem.image);
            }
        } catch (e) {
            console.error('Error parsing image URL for deletion:', e);
        }
      }

      // 2. Delete item from the database
      const { error: dbError } = await supabase
        .from('product_details')
        .delete()
        .eq('product_id', selectedItem.id);

      if (dbError) {
        console.error('Error deleting item from database:', dbError);
        alert(`Failed to delete ${selectedItem.name} from database: ${dbError.message}`);
        setShowDeleteModal(false);
        setSelectedItem(null);
        return;
      }

      alert(`${selectedItem.name} deleted successfully!`);
      fetchMenuItems(); // Refresh list
    } catch (deleteError) {
      console.error('Unexpected error during deletion process:', deleteError);
      alert(`An unexpected error occurred while deleting ${selectedItem.name}.`);
    }
    setShowDeleteModal(false);
    setSelectedItem(null);
  };

  const confirmAvailabilityToggle = async () => {
    if (!selectedItem) return;
    const newAvailability = !selectedItem.isAvailable;
    try {
      const { error } = await supabase
        .from('product_details')
        .update({ is_available: newAvailability })
        .eq('product_id', selectedItem.id);

      if (error) {
        console.error('Error updating availability:', error);
        alert(`Failed to update availability for ${selectedItem.name}: ${error.message}`);
        setShowAvailabilityModal(false);
        setSelectedItem(null);
        return;
      }

      alert(
        `${selectedItem.name} marked as ${newAvailability ? "Available" : "Sold Out"}.`
      );
      fetchMenuItems(); // Refresh list
    } catch (availabilityError) {
      console.error('Unexpected error updating availability:', availabilityError);
      alert(`An unexpected error occurred while updating availability for ${selectedItem.name}.`);
    }
    setShowAvailabilityModal(false);
    setSelectedItem(null);
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    let imageUrlForDb = null;

    // 1. Handle Image Upload if a new image file is selected
    if (menuForm.image && typeof menuForm.image !== 'string') { // menuForm.image is a File object
      const file = menuForm.image;
      // Sanitize file name: replace spaces with underscores, and ensure uniqueness
      const sanitizedFileName = file.name.replace(/\s+/g, '_');
      const fileName = `${Date.now()}-${sanitizedFileName}`;
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false, // Set to true if you want to overwrite, false to error if exists
          });

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          alert(`Image upload failed: ${uploadError.message}`);
          return;
        }

        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(fileName);
        imageUrlForDb = urlData.publicUrl;

      } catch (uploadCatchError) {
        console.error('Unexpected error during image upload process:', uploadCatchError);
        alert('An unexpected error occurred during image upload.');
        return;
      }
    } else if (isEditing && typeof menuForm.imagePreview === 'string') {
      // If editing and imagePreview is a string, it's an existing Supabase URL. Retain it if no new file.
      imageUrlForDb = menuForm.imagePreview;
    }
    // If not editing and no new file, imageUrlForDb remains null, which is correct.

    // 2. Prepare Product Data for Supabase
    const productData = {
      prdct_name: menuForm.name,
      prdct_price: parseFloat(menuForm.price) || 0,
      prdct_categ: menuForm.category,
      is_available: menuForm.isAvailable,
      prdct_imgurl: imageUrlForDb,
      // prdct_dscrpt: menuForm.description, // Uncomment and use if you add description to your form and DB
    };

    try {
      if (isEditing) {
        // Update existing item in Supabase
        const { data, error } = await supabase
          .from('product_details')
          .update(productData)
          .eq('product_id', menuForm.id)
          .select(); // .select() is optional here but can be useful for getting updated data

        if (error) {
          console.error('Error updating menu item:', error);
          alert(`Failed to update menu item: ${error.message}`);
          return;
        }
        alert("Menu item updated successfully!");
      } else {
        // Add new item to Supabase
        // For insert, Supabase typically auto-generates product_id if it's a serial key
        const { data, error } = await supabase
          .from('product_details')
          .insert([productData])
          .select();

        if (error) {
          console.error('Error adding menu item:', error);
          alert(`Failed to add menu item: ${error.message}`);
          return;
        }
        alert("Menu item added successfully!");
      }
      fetchMenuItems(); // Refresh the list from Supabase
      resetForm(); // Reset form fields
    } catch (dbError) {
      console.error('Unexpected database error:', dbError);
      alert('An unexpected database error occurred.');
    }
  };

  const resetForm = () => {
    if (menuForm.imagePreview && menuForm.imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(menuForm.imagePreview);
    }
    setMenuForm({
      id: null,
      name: "",
      price: "",
      category: "",
      image: null,
      imagePreview: null,
      isAvailable: true,
    });
    setIsEditing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const filteredMenuItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col md:flex-row h-full overflow-hidden bg-gray-100">
        <div className="w-full md:flex-1 p-4 flex flex-col overflow-hidden">
          <div className="mb-4 shrink-0">
            <input
              type="text"
              placeholder="Search menu items..."
              className="w-full p-2 bg-white rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-2 pr-2">
            {filteredMenuItems.length > 0 ? (
              filteredMenuItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white border rounded-lg shadow flex flex-col ${
                    item.isAvailable ? "border-gray-200" : "border-red-300"
                  }`}
                >
                  <div className="relative h-36 md:h-40 shrink-0 bg-gray-200 rounded-t-lg overflow-hidden group">
                    <img
                      src={item.image || `/placeholder-image.png`}
                      alt={item.name}
                      loading="lazy"
                      className={`w-full h-full object-cover transition-opacity duration-300 ${
                        !item.isAvailable ? "opacity-60" : ""
                      }`}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `/placeholder-image.png`;
                      }}
                    />
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-t-lg pointer-events-none">
                        <span className="text-white text-base font-semibold px-3 py-1 bg-red-600 rounded shadow">
                          SOLD OUT
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex-grow flex flex-col justify-between">
                    <div className="mb-2">
                      <h3
                        className="font-semibold text-md lg:text-lg truncate"
                        title={item.name}
                      >
                        {item.name}
                      </h3>
                      <p className="text-orange-600 font-medium text-sm">
                        ₱{Number(item.price).toFixed(2)}
                      </p>
                      <p
                        className="text-xs text-gray-500 truncate"
                        title={item.category}
                      >
                        {item.category}
                      </p>
                    </div>
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      <button
                        className={`py-1 px-2.5 text-xs font-medium rounded transition-colors ${
                          item.isAvailable
                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            : "bg-green-100 text-green-800 hover:bg-green-200"
                        }`}
                        onClick={() => handleAvailabilityToggle(item)}
                        title={
                          item.isAvailable
                            ? "Mark as Sold Out"
                            : "Mark as Available"
                        }
                      >
                        {item.isAvailable ? "Set Sold Out" : "Set Available"}
                      </button>
                      <button
                        className="py-1 px-2.5 text-xs font-medium text-blue-800 bg-blue-100 hover:bg-blue-200 rounded transition-colors"
                        onClick={() => handleEdit(item)}
                        title="Edit Item"
                      >
                        Edit
                      </button>
                      <button
                        className="py-1 px-2.5 text-xs font-medium text-red-800 bg-red-100 hover:bg-red-200 rounded transition-colors"
                        onClick={() => handleDelete(item)}
                        title="Delete Item"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 p-8 italic">
                No menu items found matching your search.
              </div>
            )}
          </div>
        </div>
        <div
          id="menu-form-section"
          className="w-full md:w-auto md:max-w-sm lg:max-w-md flex flex-col mt-6 md:mt-0 border-t md:border-t-0 md:border-l border-gray-300 bg-white shadow-lg"
        >
          <h2 className="text-lg font-semibold p-4 shrink-0 border-b">
            {isEditing ? "Edit Menu Item" : "Add New Menu Item"}
          </h2>
          <div className="flex-1 overflow-y-auto p-4">
            <form onSubmit={handleMenuSubmit} id="menu-item-form">
              <div className="mb-4">
                <label
                  htmlFor="menu-item-image"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
                  Image:
                </label>
                <div
                  className="mb-2 relative h-32 w-full bg-gray-100 rounded border border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {menuForm.imagePreview ? (
                    <img
                      src={menuForm.imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover rounded"
                    />
                  ) : (
                    <span className="text-center text-gray-400 px-2 text-sm">
                      Click to select image
                    </span>
                  )}
                </div>
                <input
                  id="menu-item-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  ref={fileInputRef}
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="menu-item-name"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
                  Product Name:
                </label>
                <input
                  id="menu-item-name"
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={menuForm.name}
                  onChange={(e) =>
                    setMenuForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="menu-item-category"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
                  Category:
                </label>
                <input
                  id="menu-item-category"
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={menuForm.category}
                  onChange={(e) =>
                    setMenuForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="menu-item-price"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
                  Price (₱):
                </label>
                <input
                  id="menu-item-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={menuForm.price}
                  onChange={(e) =>
                    setMenuForm((prev) => ({ ...prev, price: e.target.value }))
                  }
                  required
                />
              </div>
            </form>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 p-4 border-t bg-gray-50 shrink-0">
            <button
              type="submit"
              form="menu-item-form"
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 transition-colors"
            >
              {isEditing ? "Save Changes" : "Add Item"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          {" "}
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm border">
            {" "}
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Confirm Delete
            </h3>{" "}
            <p className="mb-6 text-gray-600 text-sm">
              {" "}
              Are you sure you want to delete{" "}
              <span className="font-medium">{selectedItem?.name}</span>?{" "}
            </p>{" "}
            <div className="flex justify-end gap-3">
              {" "}
              <button
                className="px-4 py-2 border rounded text-sm hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>{" "}
              <button
                className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                onClick={confirmDelete}
              >
                Delete
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}
      {showAvailabilityModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          {" "}
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm border">
            {" "}
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Confirm Status Change
            </h3>{" "}
            <p className="mb-6 text-gray-600 text-sm">
              {" "}
              Mark <span className="font-medium">
                {selectedItem.name}
              </span> as{" "}
              {selectedItem.isAvailable ? '"Sold Out"' : '"Available"'}?{" "}
            </p>{" "}
            <div className="flex justify-end gap-3">
              {" "}
              <button
                className="px-4 py-2 border rounded text-sm hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                onClick={() => setShowAvailabilityModal(false)}
              >
                Cancel
              </button>{" "}
              <button
                className={`px-4 py-2 text-white text-sm rounded transition-colors focus:outline-none focus:ring-offset-1 ${
                  selectedItem.isAvailable
                    ? "bg-yellow-500 hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-500"
                    : "bg-green-500 hover:bg-green-600 focus:ring-2 focus:ring-green-500"
                }`}
                onClick={confirmAvailabilityToggle}
              >
                {" "}
                {selectedItem.isAvailable
                  ? "Mark Sold Out"
                  : "Mark Available"}{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}
    </>
  );
};

export default MenuList;
