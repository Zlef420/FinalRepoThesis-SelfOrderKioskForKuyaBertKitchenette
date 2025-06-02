import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient"; // Supabase client
import { Toaster, toast } from 'react-hot-toast';


const Settings = () => {

  const [accountForm, setAccountForm] = useState({
    email: "", // Changed from username to email
    role: "Cashier", // Default role to Cashier
    password: "",
    confirmPassword: "",
    securityQuestion: "What was your first pet's name?",
    securityAnswer: "",
  });

  const [accounts, setAccounts] = useState([]); // Initialize as empty, will be fetched
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // State for Ad Deletion Modal
  const [showAdDeleteModal, setShowAdDeleteModal] = useState(false);
  const [adSlotToRemove, setAdSlotToRemove] = useState(null);

  // State for Intro Advertisement Images
  const [uploadedImages, setUploadedImages] = useState([]); // For the 3 intro ad slots
  const [isProcessingIntroAd, setIsProcessingIntroAd] = useState(false); // General loading state for intro ads
  const [introAdError, setIntroAdError] = useState('');
  const NUMBER_OF_AD_SLOTS = 3;
  const INTRO_AD_BUCKET_NAME = 'intro-advertisement-images'; // Bucket for intro ads

  // Fetch accounts from Supabase
  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('account_table')
        .select('id, email, role'); // Fetch necessary fields
      if (error) {
        console.error('Error fetching accounts:', error);
        alert(`Failed to fetch accounts: ${error.message}`);
        setAccounts([]); // Set to empty array on error
      } else {
        setAccounts(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching accounts:', err);
      alert('An unexpected error occurred while fetching accounts.');
      setAccounts([]);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchIntroAds(); // Fetch intro advertisement images on mount
  }, []); // Fetch on component mount

  const createUniqueFilename = (file) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.substring(file.name.lastIndexOf('.'));
    return `intro_ad_${timestamp}_${randomString}${extension}`;
  };

  // Functions for Intro Advertisement Images
  const fetchIntroAds = async () => {
    setIntroAdError('');
    setIsProcessingIntroAd(true); // General loading for fetching all ads
    try {
      const { data: dbAds, error } = await supabase
        .from('intro_advertisements')
        .select('slot_id, image_url, image_name')
        .order('slot_id', { ascending: true });

      if (error) {
        if (error.message.includes("relation \"intro_advertisements\" does not exist")) {
            console.warn("fetchIntroAds: 'intro_advertisements' table does not exist. Proceeding with empty slots.");
            setIntroAdError("Advertisement table not found. Please set up 'intro_advertisements' table in Supabase.");
        } else {
            throw error;
        }
      }

      const initialSlots = [];
      for (let i = 1; i <= NUMBER_OF_AD_SLOTS; i++) {
        const dbAd = dbAds?.find(ad => ad.slot_id === i);
        initialSlots.push({
          id: i,
          image: dbAd ? dbAd.image_url : null,
          file: null,
          dbImageUrl: dbAd ? dbAd.image_url : null,
          dbImageName: dbAd ? dbAd.image_name : null,
          isUploading: false, // Add isUploading state for each slot
        });
      }
      setUploadedImages(initialSlots);
    } catch (error) {
      console.error('Error fetching intro ads:', error);
      if (!introAdError) {
        setIntroAdError(`Failed to fetch intro ads: ${error.message}`);
      }
      if (uploadedImages.length === 0) {
        const errorSlots = [];
        for (let i = 1; i <= NUMBER_OF_AD_SLOTS; i++) {
            errorSlots.push({ id: i, image: null, file: null, dbImageUrl: null, dbImageName: null, isUploading: false });
        }
        setUploadedImages(errorSlots);
      }
    } finally {
      setIsProcessingIntroAd(false);
    }
  };

  const handleImageChange = async (event, slotId) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      event.target.value = null; // Reset file input
      setUploadedImages(prev => prev.map(img => 
        img.id === slotId ? { ...img, image: null, file: null, dbImageUrl: null, dbImageName: null, isUploading: false } : img
      ));
      setIntroAdError(''); // Clear any previous error
      toast.error('Invalid file type. Please select an image.');
      return;
    }

    setUploadedImages(prev => prev.map(slot =>
      slot.id === slotId ? { ...slot, isUploading: true, image: URL.createObjectURL(file) } : slot
    ));
    setIntroAdError('');

    const selectedSlot = uploadedImages.find(s => s.id === slotId);

    try {
      // 1. If there's an existing image in DB for this slot, remove it from storage
      if (selectedSlot && selectedSlot.dbImageName) {
        const { error: removeError } = await supabase.storage
          .from(INTRO_AD_BUCKET_NAME)
          .remove([selectedSlot.dbImageName]);
        if (removeError) {
          // Log warning but proceed, as we are replacing it.
          console.warn(`Could not remove old image ${selectedSlot.dbImageName} from storage:`, removeError.message);
        }
      }

      // 2. Create a unique filename and upload the new file
      const uniqueFileName = createUniqueFilename(file);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(INTRO_AD_BUCKET_NAME)
        .upload(uniqueFileName, file, {
          cacheControl: '3600',
          upsert: false, // Ensure it's a new file, uniqueFileName should handle this
        });

      if (uploadError) throw uploadError;

      // 3. Get the public URL
      const { data: urlData } = supabase.storage
        .from(INTRO_AD_BUCKET_NAME)
        .getPublicUrl(uniqueFileName);
      const newImageUrl = urlData.publicUrl;

      // 4. Upsert the record in intro_advertisements table
      const { error: dbError } = await supabase
        .from('intro_advertisements')
        .upsert(
          { slot_id: slotId, image_url: newImageUrl, image_name: uniqueFileName },
          { onConflict: 'slot_id' } // If slot_id exists, update it; otherwise, insert.
        );

      if (dbError) throw dbError;

      // 5. Update state with new DB details
      setUploadedImages(prev => prev.map(slot =>
        slot.id === slotId
          ? {
              ...slot,
              image: newImageUrl, // Update preview to permanent URL
              dbImageUrl: newImageUrl,
              dbImageName: uniqueFileName,
              file: null, // Clear the local file object
            }
          : slot
      ));
      alert(`Image for slot ${slotId} updated successfully!`);

    } catch (error) {
      console.error(`Error processing image for slot ${slotId}:`, error);
      setIntroAdError(`Failed to update image for slot ${slotId}: ${error.message}`);
      // Revert preview to old DB image if available, or null
      setUploadedImages(prev => prev.map(slot =>
        slot.id === slotId
          ? { ...slot, image: selectedSlot?.dbImageUrl || null, file: null }
          : slot
      ));
    } finally {
      setUploadedImages(prev => prev.map(slot =>
        slot.id === slotId ? { ...slot, isUploading: false } : slot
      ));
      event.target.value = null; // Reset file input in all cases
    }
  };

  const handleRemoveImageClick = (slotId) => {
    setAdSlotToRemove(slotId);
    setShowAdDeleteModal(true);
  };

  const confirmRemoveAdImage = async () => {
    if (!adSlotToRemove) return;
    const slotId = adSlotToRemove;
    const imageToRemove = uploadedImages.find(img => img.id === slotId);

    if (!imageToRemove || !imageToRemove.dbImageUrl) {
      alert(`No image to remove for slot ${slotId}.`);
      return;
    }

    setUploadedImages(prev => prev.map(slot =>
      slot.id === slotId ? { ...slot, isUploading: true } : slot // Use isUploading as a general processing flag here
    ));
    setIntroAdError('');

    try {
      // 1. Remove from Supabase Storage if dbImageName exists
      if (imageToRemove.dbImageName) {
        const { error: storageError } = await supabase.storage
          .from(INTRO_AD_BUCKET_NAME)
          .remove([imageToRemove.dbImageName]);

        if (storageError) {
          // Log error but attempt to remove from DB anyway
          console.error(`Error removing image ${imageToRemove.dbImageName} from storage:`, storageError);
          // Potentially alert user or set a specific error if removal is critical
        }
      }

      // 2. Remove from intro_advertisements table
      const { error: dbError } = await supabase
        .from('intro_advertisements')
        .delete()
        .eq('slot_id', slotId);

      if (dbError) throw dbError;

      // 3. Update state to clear the image for this slot
      setUploadedImages(prev => prev.map(slot =>
        slot.id === slotId
          ? {
              ...slot,
              image: null,
              dbImageUrl: null,
              dbImageName: null,
              file: null,
            }
          : slot
      ));
      alert(`Image for slot ${slotId} removed successfully!`);
      toast.success(`Image removed successfully!`);

    } catch (error) {
      console.error(`Error removing image for slot ${slotId}:`, error);
      setIntroAdError(`Failed to remove image for slot ${slotId}: ${error.message}`);
      toast.error(`Failed to remove image: ${error.message}`);
      // State is already showing the image, so no need to revert on error unless desired
    } finally {
      setUploadedImages(prev => prev.map(slot =>
        slot.id === slotId ? { ...slot, isUploading: false } : slot
      ));
      setShowAdDeleteModal(false);
      setAdSlotToRemove(null);
    }
  };

  const handleSubmit = async (e) => { // Made async
    e.preventDefault();
    if (accountForm.password !== accountForm.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (!accountForm.securityAnswer.trim()) {
      alert("Security answer is required!");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(accountForm.email)) { // Changed to accountForm.email
      alert("Please enter a valid email address.");
      return;
    }
    
    // IMPORTANT: Storing plain text passwords is a security risk.
    // Consider using Supabase Auth for proper password hashing.
    try {
      // Attempt a select to potentially refresh schema cache for 'security_answ'
      const { error: selectError } = await supabase
        .from('account_table')
        .select('security_question, security_answer') // Also check security_question
        .limit(1);

      if (selectError && selectError.code !== 'PGRST116') { // PGRST116: no rows found, not an error for this test
        console.warn('Pre-insert select check for security_answ failed or column not found by select:', selectError);
        // We can still proceed to the insert to see if the original error persists or changes
      } else if (!selectError) {
        console.log('Pre-insert select check for security_answ was successful.');
      }

      const { data, error } = await supabase
        .from('account_table')
        .insert([
          {
            email: accountForm.email, // Changed from username, ensure 'email' is the column name in Supabase
            password: accountForm.password, // Plain text password
            role: accountForm.role,
            security_question: accountForm.securityQuestion, // Changed from security_quest
            security_answer: accountForm.securityAnswer, 
          },
        ]);

      if (error) {
        console.error("Error adding account:", error);
        alert(`Failed to add account: ${error.message}`);
      } else {
        alert("Account added successfully!");
        fetchAccounts(); // Refresh the accounts list
        setAccountForm({ // Reset form
          email: "", // Changed from username
          role: "Cashier", // Reset to default role
          password: "",
          confirmPassword: "",
          securityQuestion: "What was your first pet's name?",
          securityAnswer: "",
        });
        // Optionally, you might want to refresh a list of accounts if displayed from DB
      }
    } catch (error) {
      console.error("Unexpected error adding account:", error);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  const handleDelete = (account) => {
    setSelectedAccount(account);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedAccount) return;

    // Prevent deleting the last admin account
    if (selectedAccount.role === 'admin') {
      const adminAccounts = accounts.filter(acc => acc.role === 'admin');
      if (adminAccounts.length <= 1) {
        alert('Cannot delete the last admin account.');
        setShowDeleteModal(false);
        setSelectedAccount(null);
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('account_table')
        .delete()
        .eq('id', selectedAccount.id);

      if (error) {
        console.error('Error deleting account:', error);
        alert(`Failed to delete account: ${error.message}`);
      } else {
        alert('Account deleted successfully!');
        fetchAccounts(); // Refresh the accounts list
      }
    } catch (err) {
      console.error('Unexpected error deleting account:', err);
      alert('An unexpected error occurred while deleting the account.');
    }

    setShowDeleteModal(false);
    setSelectedAccount(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 pt-0">
        {/* Left Column - Account Management Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm h-fit">
          <h2 className="text-xl font-semibold mb-4">Account Management</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">
                Email:
              </label>
              <input
                type="email" // Changed type to email
                className="w-full p-2 border rounded"
                value={accountForm.email} // Changed to accountForm.email
                onChange={(e) =>
                  setAccountForm({ ...accountForm, email: e.target.value }) // Changed to accountForm.email
                }
                required
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Role:</label>
              <select
                className="w-full p-2 border rounded"
                value={accountForm.role}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, role: e.target.value })
                }
              >
                <option value="Cashier">Cashier</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">
                Password:
              </label>
              <input
                type="password"
                className="w-full p-2 border rounded"
                value={accountForm.password}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, password: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">
                Confirm Password:
              </label>
              <input
                type="password"
                className="w-full p-2 border rounded"
                value={accountForm.confirmPassword}
                onChange={(e) =>
                  setAccountForm({
                    ...accountForm,
                    confirmPassword: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">
                Security Question:
              </label>
              <select
                className="w-full p-2 border rounded"
                value={accountForm.securityQuestion}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, securityQuestion: e.target.value })
                }
                required
              >
                <option value="What was your first pet's name?">What was your first pet's name?</option>
                <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                <option value="What was the name of your elementary school?">What was the name of your elementary school?</option>
                <option value="What was your childhood nickname?">What was your childhood nickname?</option>
                <option value="In what city were you born?">In what city were you born?</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">
                Security Answer:
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={accountForm.securityAnswer}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, securityAnswer: e.target.value })
                }
                required
              />
            </div>
            <div className="col-span-2 mt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Account
              </button>
            </div>
          </form>
        </div>

        {/* Right Column - Two Sections */}
        <div className="flex flex-col space-y-6">
          {/* Existing Accounts Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Existing Accounts</h3>
            <div className="overflow-auto max-h-48">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th className="border p-2 text-left">Email</th>
                    <th className="border p-2 text-left">Role</th>
                    <th className="border p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id}>
                      <td className="border p-2">{account.email}</td>
                      <td className="border p-2 capitalize">{account.role}</td>
                      <td className="border p-2">
                        <button
                          className={`px-3 py-1 text-sm ${accounts.length <= 1 || account.role === "admin" ? "text-gray-400 cursor-not-allowed" : "text-red-600 hover:text-red-800"}`}
                          onClick={() => handleDelete(account)}
                          disabled={account.role === 'admin' && accounts.filter(acc => acc.role === 'admin').length <= 1}
                          title={
                            account.role === "admin"
                              ? "Admin account cannot be deleted"
                              : accounts.length <= 1
                              ? "Cannot delete the only account"
                              : ""
                          }
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Advertisement Images Section */}
          {/* Advertisement Images Section - Adjusted for overflow */}
          <div className="bg-white pt-1 pb-2 px-2 md:pt-2 md:pb-3 md:px-3 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-1">Advertisement Images</h2>
            <p className="mb-1 text-sm text-gray-600">
              Upload up to 3 images for your intro page.
            </p>
            {/* Responsive grid for advertisement images */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 justify-center">
              {uploadedImages.map((img) => (
                <div
                  key={img.id}
                  className="relative flex flex-col items-center border-2 border-dashed border-gray-300 rounded-lg p-0.5 max-w-[120px]"
                >
                  {/* Ensure spinner or loading text is centered and doesn't cause overflow */}
                  {img.isUploading ? (
                    <div className="w-full aspect-square rounded-md overflow-hidden mb-1 flex justify-center">
                      <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : !img.image ? (
                    <label className="cursor-pointer flex flex-col items-center">
                      {/* Adjusted button text/padding for smaller views if necessary */}
                      <span className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs sm:text-sm whitespace-nowrap">
                        Choose Image
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, img.id)}
                      />
                    </label>
                  ) : (
                    <>
                      <div className="w-full aspect-square">
                        <img
                          src={img.image}
                          alt="Advertisement preview"
                          className="rounded-lg object-cover w-full h-full"
                        />
                      </div>
                      <button
                        className="mt-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs sm:text-sm whitespace-nowrap"
                        onClick={() => handleRemoveImageClick(img.id)}
                      >
                        Remove
                      </button>
                    </>                    
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
    </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg w-80">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete the account for{" "}
              {selectedAccount?.email}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ad Image Delete Confirmation Modal (Embedded) */}
      {showAdDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Confirm Image Deletion</h2>
            <div className="mb-6 text-gray-700">
              <p>Are you sure you want to remove this advertisement image? This action cannot be undone.</p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAdDeleteModal(false);
                  setAdSlotToRemove(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-150 ease-in-out"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveAdImage}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-150 ease-in-out"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions (outside component for clarity and potential reuse)
const sanitizeFilename = (filename) => {
  // Replace spaces and special characters, except for '.', '_', '-'
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
};

const createUniqueFilename = (file) => {
  const sanitized = sanitizeFilename(file.name);
  const extension = sanitized.substring(sanitized.lastIndexOf('.'));
  const nameWithoutExtension = sanitized.substring(0, sanitized.lastIndexOf('.'));
  // Ensure name isn't overly long after timestamp, truncate if necessary
  const shortName = nameWithoutExtension.length > 50 ? nameWithoutExtension.substring(0, 50) : nameWithoutExtension;
  return `${Date.now()}_${shortName}${extension}`;
};

export default Settings;
