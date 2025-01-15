import React, { useState } from "react";

const Settings = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountForm, setAccountForm] = useState({
    username: "",
    email: "",
    role: "staff",
    password: "",
    confirmPassword: "",
  });

  // Sample accounts data
  const [accounts, setAccounts] = useState([
    {
      id: 1,
      username: "admin",
      email: "admin@example.com",
      role: "admin",
    },
    {
      id: 2,
      username: "staff1",
      email: "staff1@example.com",
      role: "staff",
    },
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (accountForm.password !== accountForm.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const newAccount = {
      id: accounts.length + 1,
      username: accountForm.username,
      email: accountForm.email,
      role: accountForm.role,
    };

    setAccounts([...accounts, newAccount]);
    setAccountForm({
      username: "",
      email: "",
      role: "staff",
      password: "",
      confirmPassword: "",
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
    <div className="p-4 h-[calc(100vh-160px)] overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">Account Management</h2>

          {/* Add Account Form */}
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mb-6">
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
            <div className="col-span-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Account
              </button>
            </div>
          </form>

          {/* Account List */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Existing Accounts</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
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
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                          onClick={() => handleDelete(account)}
                          disabled={account.role === "admin"}
                          title={
                            account.role === "admin"
                              ? "Admin account cannot be deleted"
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
        </div>

        {/* Security Settings */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
              <div>
                <h3 className="font-medium">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-600">
                  Add an extra layer of security to your account
                </p>
              </div>
              <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                Enable
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
              <div>
                <h3 className="font-medium">Session Management</h3>
                <p className="text-sm text-gray-600">
                  Manage your active sessions
                </p>
              </div>
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                View Sessions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
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
