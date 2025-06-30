import React, { useState, useRef, useEffect } from "react";
import { toast } from 'react-hot-toast';
import { supabase } from "../supabaseClient";

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
    description: "",
    image: null,
    imagePreview: null,
    isAvailable: true,
  });
  const fileInputRef = useRef(null);

  const [menuItems, setMenuItems] = useState([]);

  {/* Fetch menu items from Supabase */}
  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('product_details')
        .select('product_id, prdct_name, prdct_price, prdct_categ, is_available, prdct_imgurl, prdct_dscrpt');

      if (error) {
        console.error('Error fetching menu items:', error);
        toast.error('Failed to fetch menu items.');
        setMenuItems([]);
        return;
      }
      // Map Supabase columns to component state structure
      const formattedData = data.map(item => ({
        id: item.product_id,
        name: item.prdct_name,
        price: item.prdct_price,
        category: item.prdct_categ,
        description: item.prdct_dscrpt || '',
        isAvailable: item.is_available === true,
        image: item.prdct_imgurl,
      }));
      setMenuItems(formattedData);
    } catch (err) {
      console.error('Unexpected error fetching menu items:', err);
      toast.error('An unexpected error occurred while fetching menu items.');
      setMenuItems([]);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  {/* Effect for cleaning up blob URLs */}
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
      {/* Check if the file is an image */}
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file (JPEG, PNG, GIF, etc.)');
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
      description: item.description || '',
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
      {/* Delete image from Supabase Storage if it exists */}
      if (selectedItem.image) {
        try {
            {/* Extract file name from URL */}
            const urlParts = selectedItem.image.split('/');
            let fileNameWithPotentialQuery = urlParts[urlParts.length - 1];
            const fileName = fileNameWithPotentialQuery.split('?')[0];
            
            if (fileName) {
                console.log(`Attempting to delete from storage: ${BUCKET_NAME}/${fileName}`);
                const { error: storageError } = await supabase.storage
                .from(BUCKET_NAME)
                .remove([fileName]);
                if (storageError) {
                console.error('Error deleting image from storage:', storageError);
                }
            } else {
                console.warn('Could not extract filename from image URL:', selectedItem.image);
            }
        } catch (e) {
            console.error('Error parsing image URL for deletion:', e);
        }
      }

      {/* Delete item from the database */}
      console.log('[Delete] Attempting to delete item from DB. ID:', selectedItem.id);
      const { error: dbError } = await supabase
        .from('product_details')
        .delete()
        .eq('product_id', selectedItem.id);
      console.log('[Delete] Supabase delete call completed. DB Error:', dbError);

      if (dbError) {
        console.error('Error deleting item from database:', dbError);
        toast.error(`Failed to delete ${selectedItem.name} from database: ${dbError.message}`);
        setShowDeleteModal(false);
        setSelectedItem(null);
        return;
      }

      toast.success(`${selectedItem.name} deleted successfully!`);
      fetchMenuItems(); // Refresh list
    } catch (deleteError) {
      console.error('Unexpected error during deletion process:', deleteError);
      toast.error(`An unexpected error occurred while deleting ${selectedItem.name}.`);
    }
    setShowDeleteModal(false);
    setSelectedItem(null);
  };

  const confirmAvailabilityToggle = async () => {
    if (!selectedItem) return;
    const newAvailability = !selectedItem.isAvailable;

    try {
      console.log('[AvailabilityToggle] Attempting to update item ID:', selectedItem.id, 'to isAvailable:', newAvailability);
      const { error } = await supabase
        .from('product_details')
        .update({ is_available: newAvailability })
        .eq('product_id', selectedItem.id);
      console.log('[AvailabilityToggle] Supabase update call completed. Error:', error);

      if (error) {
        console.error('Error updating availability:', error);
        toast.error(`Failed to update availability for ${selectedItem.name}: ${error.message}`);
        setShowAvailabilityModal(false);
        setSelectedItem(null);
        return;
      }

      toast.success(
        `${selectedItem.name} marked as ${newAvailability ? "Available" : "Sold Out"}.`
      );
      fetchMenuItems(); // Refresh list
    } catch (availabilityError) {
      console.error('Unexpected error updating availability:', availabilityError);
      toast.error(`An unexpected error occurred while updating availability for ${selectedItem.name}.`);
    }
    setShowAvailabilityModal(false);
    setSelectedItem(null);
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();

    // Simple validation
    if (!isEditing && !menuForm.image) {
      toast.error('Please select an image for the new item.');
      return;
    }
    if (!menuForm.name.trim() || !menuForm.category.trim() || !menuForm.price) {
        toast.error('Please fill out all required fields.');
        return;
    }

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
          toast.error(`Image upload failed: ${uploadError.message}`);
          return;
        }

        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(fileName);
        imageUrlForDb = urlData.publicUrl;

      } catch (uploadCatchError) {
        console.error('Unexpected error during image upload process:', uploadCatchError);
        toast.error('An unexpected error occurred during image upload.');
        return;
      }
    } else if (isEditing && typeof menuForm.imagePreview === 'string') {
      // Retain existing image URL if no new file selected
      imageUrlForDb = menuForm.imagePreview;
    }

    // Prepare product data for Supabase
    const productData = {
      prdct_name: menuForm.name,
      prdct_price: parseFloat(menuForm.price) || 0,
      prdct_categ: menuForm.category,
      prdct_dscrpt: menuForm.description,
      is_available: menuForm.isAvailable,
      prdct_imgurl: imageUrlForDb,
    };

    try {
      if (isEditing) {
        console.log('[SubmitEdit] Attempting to update item ID:', menuForm.id, 'Data:', productData);
        const { error } = await supabase
          .from('product_details')
          .update(productData)
          .eq('product_id', menuForm.id);
        console.log('[SubmitEdit] Supabase update call completed. Error:', error);

        if (error) {
          console.error('Error updating menu item:', error);
          toast.error(`Failed to update menu item: ${error.message}`);
          return;
        }
        toast.success('Menu item updated successfully!');
      } else {
        console.log('[SubmitNew] Attempting to insert new item. Data:', productData);
        const { error } = await supabase
          .from('product_details')
          .insert([productData]);
        console.log('[SubmitNew] Supabase insert call completed. Error:', error);

        if (error) {
          console.error('Error adding menu item:', error);
          toast.error(`Failed to add menu item: ${error.message}`);
          return;
        }
        toast.success('Menu item added successfully!');
      }

      fetchMenuItems();
      resetForm();
    } catch (dbError) {
      console.error('Unexpected database error:', dbError);
      toast.error('An unexpected database error occurred.');
    }
  };

  const resetForm = () => {
    if (menuForm.imagePreview && menuForm.imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(menuForm.imagePreview);
    }
    setMenuForm({
      id: null,
      name: '',
      price: '',
      category: '',
      description: '',
      image: null,
      imagePreview: null,
      isAvailable: true,
    });
    setIsEditing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Apply search filter
  const filteredMenuItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 p-4 h-full">
        {/* Menu Items List Section */}
        <div className="flex-grow lg:w-2/3 bg-white p-4 rounded-lg shadow flex flex-col">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Menu Items</h2>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search items by name or category..."
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex-grow overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMenuItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 border rounded-lg shadow-sm flex flex-col justify-between ${
                    item.isAvailable ? "bg-white" : "bg-gray-200"
                  }`}
                >
                  <div className="relative">
                    <img
                      src={item.image || 'https://via.placeholder.com/150?text=No+Image'}
                      alt={item.name}
                      className={`w-full h-32 object-cover rounded-md mb-3 ${!item.isAvailable ? 'opacity-40' : ''}`}
                      onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/150?text=No+Image'; }}
                    />
                    {!item.isAvailable && (
                      <div className="absolute inset-0 flex items-center justify-center mb-3 bg-black bg-opacity-30 rounded-md">
                        <span className="bg-red-600 text-white font-bold py-2 px-4 rounded">SOLD OUT</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700">{item.name}</h3>
                    <p className="text-sm text-gray-500 mb-1">{item.category}</p>
                    <p className="text-xs text-gray-500 mb-2 h-10 overflow-y-auto">{item.description || 'No description available.'}</p>
                    <p className="text-lg font-bold text-orange-600 mb-2">₱{parseFloat(item.price).toFixed(2)}</p>
                    <p className={`text-xs font-medium ${item.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                      {item.isAvailable ? "Available" : "Sold Out"}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <button
                      className="flex-1 px-3 py-1.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                      onClick={() => handleEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="flex-1 px-3 py-1.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                      onClick={() => handleDelete(item)}
                    >
                      Delete
                    </button>
                    <button
                      className={`flex-1 px-3 py-1.5 text-white text-xs rounded transition-colors ${
                        item.isAvailable
                          ? "bg-yellow-500 hover:bg-yellow-600"
                          : "bg-green-500 hover:bg-green-600"
                      }`}
                      onClick={() => handleAvailabilityToggle(item)}
                    >
                      {item.isAvailable ? "Set Sold Out" : "Set Available"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Add/Edit Item Form Section */}
        <div className="lg:w-1/3 bg-white p-4 rounded-lg shadow flex flex-col h-full max-h-[calc(100vh-4rem)]"> {/* Adjust max-h as needed */}
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            {isEditing ? "Edit Menu Item" : "Add New Item"}
          </h2>
          <div className="overflow-y-auto flex-grow pr-2"> {/* Added pr-2 for scrollbar spacing */}
            <form onSubmit={handleMenuSubmit} id="menu-item-form">
              <div className="mb-4">
                <label
                  htmlFor="menu-item-image"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
                  Product Image:
                </label>
                {menuForm.imagePreview && (
                  <div className="mb-2">
                    <img
                      src={menuForm.imagePreview}
                      alt="Preview"
                      className="w-full h-40 object-cover rounded border"
                    />
                  </div>
                )}
                <input
                  id="menu-item-image"
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  onChange={handleImageChange}
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
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only letters and spaces
                    if (/^[a-zA-Z\s]*$/.test(value)) {
                        setMenuForm((prev) => ({ ...prev, name: value }))
                    }
                  }}
                  required
                />
              </div>
               <div className="mb-4">
                <label
                  htmlFor="menu-item-description"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
                  Description:
                </label>
                <textarea
                  id="menu-item-description"
                  rows={3} // Adjusted rows for better fit
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={menuForm.description}
                  onChange={(e) =>
                    setMenuForm((prev) => ({ ...prev, description: e.target.value }))
                  }
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
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only letters and spaces
                    if (/^[a-zA-Z\s]*$/.test(value)) {
                        setMenuForm((prev) => ({
                          ...prev,
                          category: value,
                        }))
                    }
                  }}
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
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={menuForm.price}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only non-negative numbers and a single decimal point
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      setMenuForm((prev) => ({ ...prev, price: value }));
                    }
                  }}
                  required
                />
              </div>
              {/* Availability Toggle */}
              <div className="mb-4">
                <label htmlFor="menu-item-available" className="flex items-center cursor-pointer">
                  <input
                    id="menu-item-available"
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                    checked={menuForm.isAvailable}
                    onChange={(e) =>
                      setMenuForm((prev) => ({ ...prev, isAvailable: e.target.checked }))
                    }
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Available for Ordering</span>
                </label>
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