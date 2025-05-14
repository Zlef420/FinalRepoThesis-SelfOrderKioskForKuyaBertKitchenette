import React, { useState } from "react";
import { useSharedState } from "../context/SharedStateContext";

const Settings = () => {
  const { uploadedImages, setUploadedImages } = useSharedState();

  const [accountForm, setAccountForm] = useState({
    username: "",
    email: "",
    role: "staff",
    password: "",
    confirmPassword: "",
    securityQuestion: "What was your first pet's name?",
    securityAnswer: "",
  });

  const [accounts, setAccounts] = useState([
    {
      id: 1,
      username: "admin",
      email: "admin@example.com",
      role: "admin",
      securityQuestion: "What was your first pet's name?",
      securityAnswer: "Fido",
    },
    {
      id: 2,
      username: "staff1",
      email: "staff1@example.com",
      role: "staff",
      securityQuestion: "What was your first pet's name?",
      securityAnswer: "Whiskers",
    },
  ]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (accountForm.password !== accountForm.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (!accountForm.securityAnswer.trim()) {
      alert("Security answer is required!");
      return;
    }

    const newAccount = {
      id: accounts.length + 1,
      username: accountForm.username,
      email: accountForm.email,
      role: accountForm.role,
      securityQuestion: accountForm.securityQuestion,
      securityAnswer: accountForm.securityAnswer,
    };

    setAccounts([...accounts, newAccount]);
    setAccountForm({
      username: "",
      email: "",
      role: "staff",
      password: "",
      confirmPassword: "",
      securityQuestion: "What was your first pet's name?",
      securityAnswer: "",
    });
  };

  const handleDelete = (account) => {
    setSelectedAccount(account);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setAccounts(accounts.filter((acc) => acc.id !== selectedAccount.id));
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
                Username:
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={accountForm.username}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, username: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Email:</label>
              <input
                type="email"
                className="w-full p-2 border rounded"
                value={accountForm.email}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, email: e.target.value })
                }
                required
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
                <option value="staff">Staff</option>
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
                    <th className="border p-2 text-left">Username</th>
                    <th className="border p-2 text-left">Email</th>
                    <th className="border p-2 text-left">Role</th>
                    <th className="border p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id}>
                      <td className="border p-2">{account.username}</td>
                      <td className="border p-2">{account.email}</td>
                      <td className="border p-2 capitalize">{account.role}</td>
                      <td className="border p-2">
                        <button
                          className={`px-3 py-1 text-sm ${accounts.length <= 1 || account.role === "admin" ? "text-gray-400 cursor-not-allowed" : "text-red-600 hover:text-red-800"}`}
                          onClick={() => handleDelete(account)}
                          disabled={accounts.length <= 1 || account.role === "admin"}
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
              {selectedAccount?.username}? This action cannot be undone.
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
