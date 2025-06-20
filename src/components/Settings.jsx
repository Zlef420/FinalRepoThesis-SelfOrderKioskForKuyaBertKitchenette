import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { toast } from 'react-hot-toast';


const Settings = () => {

  const [accountForm, setAccountForm] = useState({
    email: "",
    role: "cashier",
    password: "",
    confirmPassword: "",
    securityQuestion: "What was your first pet's name?",
    securityAnswer: "",
  });

  const [accounts, setAccounts] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  {/* State for Forgot Password Modal */}
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordForm, setForgotPasswordForm] = useState({
    email: "",
    securityQuestion: "What was your first pet's name?",
    securityAnswer: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [targetAccount, setTargetAccount] = useState(null);

  {/* State for Ad Deletion Modal */}
  const [showAdDeleteModal, setShowAdDeleteModal] = useState(false);
  const [adSlotToRemove, setAdSlotToRemove] = useState(null);

  {/* State for Intro Advertisement Images */}
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isProcessingIntroAd, setIsProcessingIntroAd] = useState(false);
  const [introAdError, setIntroAdError] = useState('');
  const NUMBER_OF_AD_SLOTS = 3;
  const INTRO_AD_BUCKET_NAME = 'intro-advertisement-images';

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('account_table')
        .select('id, email, role');
      if (error) {
        console.error('Error fetching accounts:', error);
        toast.error(`Failed to fetch accounts: ${error.message}`, { id: 'fetch-accounts-error' });
                  setAccounts([]);
      } else {
        setAccounts(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching accounts:', err);
      toast.error('An unexpected error occurred while fetching accounts.', { id: 'fetch-accounts-unexpected-error' });
      setAccounts([]);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchIntroAds();
  }, []);

  const createUniqueFilename = (file) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.substring(file.name.lastIndexOf('.'));
    return `intro_ad_${timestamp}_${randomString}${extension}`;
  };

  // Functions for Intro Advertisement Images
  const fetchIntroAds = async () => {
    setIntroAdError('');
    setIsProcessingIntroAd(true);
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
      toast.error('Please select an image file.', { id: 'invalid-file-type' });
      event.target.value = null;
      setUploadedImages(prev => prev.map(img => 
        img.id === slotId ? { ...img, image: null, file: null, dbImageUrl: null, dbImageName: null, isUploading: false } : img
      ));
      setIntroAdError('');
      return;
    }

    setUploadedImages(prev => prev.map(slot =>
      slot.id === slotId ? { ...slot, isUploading: true, image: URL.createObjectURL(file) } : slot
    ));
    setIntroAdError('');

    const selectedSlot = uploadedImages.find(s => s.id === slotId);

    try {
      if (selectedSlot && selectedSlot.dbImageName) {
        const { error: removeError } = await supabase.storage
          .from(INTRO_AD_BUCKET_NAME)
          .remove([selectedSlot.dbImageName]);
        if (removeError) {
          console.warn(`Could not remove old image ${selectedSlot.dbImageName} from storage:`, removeError.message);
        }
      }

      const uniqueFileName = createUniqueFilename(file);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(INTRO_AD_BUCKET_NAME)
        .upload(uniqueFileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(INTRO_AD_BUCKET_NAME)
        .getPublicUrl(uniqueFileName);
      const newImageUrl = urlData.publicUrl;

      const { error: dbError } = await supabase
        .from('intro_advertisements')
        .upsert(
          { slot_id: slotId, image_url: newImageUrl, image_name: uniqueFileName },
          { onConflict: 'slot_id' }
        );

      if (dbError) throw dbError;

      setUploadedImages(prev => prev.map(slot =>
        slot.id === slotId
          ? {
              ...slot,
              image: newImageUrl,
              dbImageUrl: newImageUrl,
              dbImageName: uniqueFileName,
              file: null,
            }
          : slot
      ));
      toast.success(`Image for slot ${slotId} updated successfully!`, { id: `image-update-success-${slotId}` });

    } catch (error) {
      console.error(`Error processing image for slot ${slotId}:`, error);
      toast.error(`Failed to update image for slot ${slotId}: ${error.message}`, { id: `image-update-error-${slotId}` });
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
      event.target.value = null;
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
      toast.error(`No image to remove for slot ${slotId}.`, { id: `no-image-to-remove-${slotId}` });
      return;
    }

    setUploadedImages(prev => prev.map(slot =>
      slot.id === slotId ? { ...slot, isUploading: true } : slot
    ));
    setIntroAdError('');

    try {
      if (imageToRemove.dbImageName) {
        const { error: storageError } = await supabase.storage
          .from(INTRO_AD_BUCKET_NAME)
          .remove([imageToRemove.dbImageName]);

        if (storageError) {
          console.error(`Error removing image ${imageToRemove.dbImageName} from storage:`, storageError);
        }
      }

      const { error: dbError } = await supabase
        .from('intro_advertisements')
        .delete()
        .eq('slot_id', slotId);

      if (dbError) throw dbError;

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
      toast.success(`Image for slot ${slotId} removed successfully!`, { id: `image-remove-success-${slotId}` });

    } catch (error) {
      console.error(`Error removing image for slot ${slotId}:`, error);
      setIntroAdError(`Failed to remove image for slot ${slotId}: ${error.message}`);
      toast.error(`Failed to remove image for slot ${slotId}: ${error.message}`, { id: `image-remove-error-${slotId}` });
    } finally {
      setUploadedImages(prev => prev.map(slot =>
        slot.id === slotId ? { ...slot, isUploading: false } : slot
      ));
      setShowAdDeleteModal(false);
      setAdSlotToRemove(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (accountForm.password !== accountForm.confirmPassword) {
      toast.error("Passwords do not match!", { id: 'password-mismatch-add' });
      return;
    }

    if (!accountForm.securityAnswer.trim()) {
      toast.error("Security answer is required!", { id: 'security-answer-required' });
      return;
    }

    // Email validation - only accept Gmail and Yahoo emails
    const emailRegex = /^[^\s@]+@(gmail\.com|yahoo\.com)$/i;
    if (!emailRegex.test(accountForm.email)) {
      toast.error("Please enter a valid Gmail or Yahoo email address.", { id: 'invalid-email' });
      return;
    }
    

    try {
      const { error: selectError } = await supabase
        .from('account_table')
        .select('security_question, security_answer')
        .limit(1);

      if (selectError && selectError.code !== 'PGRST116') {
        console.warn('Pre-insert select check for security_answer failed or column not found by select:', selectError);
      } else if (!selectError) {
        console.log('Pre-insert select check for security_answer was successful.');
      }

      const { data, error } = await supabase
        .from('account_table')
        .insert([
          {
            email: accountForm.email,
          password: accountForm.password,
          role: accountForm.role,
          security_question: accountForm.securityQuestion,
          security_answer: accountForm.securityAnswer, 
          },
        ]);

      if (error) {
        console.error("Error adding account:", error);
        toast.error(`Failed to add account: ${error.message}`, { id: 'add-account-error' });
      } else {
        toast.success("Account added successfully!", { id: 'add-account-success' });
        fetchAccounts(); // Refresh the accounts list
        setAccountForm({
          email: "",
          role: "cashier",
          password: "",
          confirmPassword: "",
          securityQuestion: "What was your first pet's name?",
          securityAnswer: "",
        });
      }
    } catch (error) {
      console.error("Unexpected error adding account:", error);
      toast.error("An unexpected error occurred. Please try again.", { id: 'add-account-unexpected-error' });
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
        toast.error('Cannot delete the last admin account.', { id: 'last-admin-error' });
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
        toast.error(`Failed to delete account: ${error.message}`, { id: 'delete-account-error' });
      } else {
        toast.success('Account deleted successfully!', { id: 'delete-account-success' });
        fetchAccounts(); // Refresh the accounts list
      }
    } catch (err) {
      console.error('Unexpected error deleting account:', err);
      toast.error('An unexpected error occurred while deleting the account.', { id: 'delete-account-unexpected-error' });
    }

    setShowDeleteModal(false);
    setSelectedAccount(null);
  };

  const resetForgotPasswordForm = () => {
    setForgotPasswordForm({
      email: "",
      securityQuestion: "What was your first pet's name?",
      securityAnswer: "",
      newPassword: "",
      confirmNewPassword: "",
    });
    setIsVerified(false);
    setIsLoading(false);
    setTargetAccount(null);
    setShowForgotPasswordModal(false);
  };

  const handleVerify = async () => {
    setIsLoading(true);
    const { email, securityQuestion, securityAnswer } = forgotPasswordForm;

    try {
      const { data, error } = await supabase
        .from('account_table')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !data) {
        toast.error('Account not found. Please check the email address.', { id: 'account-not-found' });
        setIsLoading(false);
        return;
      }
      
      if (data.security_question === securityQuestion && data.security_answer === securityAnswer) {
        toast.success('Verification successful! You can now reset your password.', { id: 'verification-success' });
        setIsVerified(true);
        setTargetAccount(data);
      } else {
        toast.error('Security question or answer is incorrect.', { id: 'verification-failed' });
      }
    } catch (err) {
      toast.error('An unexpected error occurred during verification.', { id: 'verification-error' });
      console.error('Verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const { newPassword, confirmNewPassword } = forgotPasswordForm;

    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match.', { id: 'password-mismatch' });
      return;
    }
    if (!newPassword) {
        toast.error('Password cannot be empty.', { id: 'empty-password' });
        return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('account_table')
        .update({ password: newPassword })
        .eq('id', targetAccount.id);

      if (error) {
        throw error;
      }

      toast.success('Password updated successfully!', { id: 'password-reset-success' });
      resetForgotPasswordForm();
      
    } catch (err) {
      toast.error('Failed to update password. Please try again.', { id: 'password-reset-error' });
      console.error('Password reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
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
                <option value="cashier">Cashier</option>
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
            <div className="col-span-2 mt-4 flex items-center gap-4">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Account
              </button>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot your password?
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

      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Reset Password</h2>
            
            {!isVerified ? (
              // Verification Step
              <div>
                <div className="mb-4">
                  <label className="block mb-1 text-sm font-medium">Email:</label>
                  <input
                    type="email"
                    className="w-full p-2 border rounded"
                    value={forgotPasswordForm.email}
                    onChange={(e) => setForgotPasswordForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your account email"
                    disabled={isLoading}
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 text-sm font-medium">Security Question:</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={forgotPasswordForm.securityQuestion}
                    onChange={(e) => setForgotPasswordForm(prev => ({...prev, securityQuestion: e.target.value}))}
                    disabled={isLoading}
                  >
                    <option value="What was your first pet's name?">What was your first pet's name?</option>
                    <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                    <option value="What was the name of your elementary school?">What was the name of your elementary school?</option>
                    <option value="What was your childhood nickname?">What was your childhood nickname?</option>
                    <option value="In what city were you born?">In what city were you born?</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block mb-1 text-sm font-medium">Security Answer:</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={forgotPasswordForm.securityAnswer}
                    onChange={(e) => setForgotPasswordForm(prev => ({...prev, securityAnswer: e.target.value}))}
                    placeholder="Enter your security answer"
                    disabled={isLoading}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={resetForgotPasswordForm}
                    className="px-4 py-2 border rounded text-sm hover:bg-gray-100"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerify}
                    className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              </div>
            ) : (
              // Password Reset Step
              <div>
                <div className="mb-4">
                  <label className="block mb-1 text-sm font-medium">New Password:</label>
                  <input
                    type="password"
                    className="w-full p-2 border rounded"
                    value={forgotPasswordForm.newPassword}
                    onChange={(e) => setForgotPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                    disabled={isLoading}
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 text-sm font-medium">Confirm New Password:</label>
                  <input
                    type="password"
                    className="w-full p-2 border rounded"
                    value={forgotPasswordForm.confirmNewPassword}
                    onChange={(e) => setForgotPasswordForm(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                    placeholder="Confirm new password"
                    disabled={isLoading}
                  />
                </div>
                <div className="flex justify-end gap-3">
                   <button
                    onClick={resetForgotPasswordForm}
                    className="px-4 py-2 border rounded text-sm hover:bg-gray-100"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordReset}
                    className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save New Password'}
                  </button>
                </div>
              </div>
            )}
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
