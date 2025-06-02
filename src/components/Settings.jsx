import React, { useState, useEffect } from "react";
import { useSharedState } from "../context/SharedStateContext";
import { supabase } from "../supabaseClient"; // Added Supabase client

const Settings = () => {
  const { uploadedImages, setUploadedImages } = useSharedState();

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
  }, []); // Fetch on component mount

  const handleImageChange = (e, id) => {
    const file = e.target.files[0];
    if (file) {
      // Check if the file is an image
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPEG, PNG, GIF, etc.)');
        return;
      }
      
      const imageUrl = URL.createObjectURL(file);
      setUploadedImages((prevImages) =>
        prevImages.map((img) =>
          img.id === id ? { ...img, image: imageUrl } : img
        )
      );
    }
  };

  const removeImage = (id) => {
    setUploadedImages((prevImages) =>
      prevImages.map((img) => (img.id === id ? { ...img, image: null } : img))
    );
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
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 p-4 pt-0">
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
          <div className="bg-white p-6 rounded-lg shadow-sm py-0">
            <h2 className="text-xl font-semibold mb-4">Advertisement Images</h2>
            <p className="mb-4 text-gray-600">
              Upload up to 3 images for your intro page.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {uploadedImages.map((img) => (
                <div
                  key={img.id}
                  className="relative flex flex-col items-center border-2 border-dashed border-gray-300 rounded-lg p-4"
                >
                  {!img.image ? (
                    <label className="cursor-pointer flex flex-col items-center">
                      <span className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
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
                      <div className="w-full aspect-video">
                        <img
                          src={img.image}
                          alt="Advertisement preview"
                          className="rounded-lg object-cover w-full h-full"
                        />
                      </div>
                      <button
                        className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        onClick={() => removeImage(img.id)}
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
    </div>
  );
};

export default Settings;
