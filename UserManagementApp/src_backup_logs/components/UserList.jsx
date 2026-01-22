import React, { useEffect, useState } from "react";
import { getAllUsers, deleteUser } from "../api/userApi";
import { Users, Trash2 } from "lucide-react";
import axios from "axios";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Fetch All Users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();

      const formattedUsers = (data.users || []).map((u) => ({
        ...u,
        is_active: u.is_active ?? 1,
        status: u.is_active === 1 ? "active" : "inactive",
      }));

      setUsers(formattedUsers);
    } catch (err) {
      setMessage("Error fetching users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (email) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteUser(email);
      setMessage("User deleted successfully");
      setTimeout(() => setMessage(""), 3000);
      fetchUsers();
    } catch (err) {
      setMessage("Error deleting user");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const action = currentStatus === "active" ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      await axios.post(
        "https://notes-app-plum-three.vercel.app/api/v1/auth/deactivate-user",
        { userId }
      );

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? {
              ...user,
              is_active: currentStatus === "active" ? 0 : 1,
              status: currentStatus === "active" ? "inactive" : "active",
            }
            : user
        )
      );

      setMessage(
        `User ${currentStatus === "active" ? "deactivated" : "activated"} successfully`
      );
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("Error updating user status");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center bg-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-bold text-blue-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-h-screen bg-blue-50 p-6">
      <div className="w-full bg-white rounded-2xl shadow-xl border border-blue-100 p-6">

        {/* Title */}
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-blue-100">
          <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
            <Users size={30} className="text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-blue-700">
            All Registered Users
          </h2>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`p-4 mb-6 rounded-xl font-semibold shadow-md border
              ${message.includes("Error")
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-green-50 text-green-700 border-green-200"
              }`}
          >
            {message}
          </div>
        )}

        {/* Table */}
        <div className="w-full overflow-x-auto rounded-xl border border-blue-200 shadow-md">
          <table className="w-full divide-y divide-blue-200">
            <thead className="bg-blue-600">
              <tr>
                <HeaderCell>Sr. No</HeaderCell>
                <HeaderCell>ID</HeaderCell>
                <HeaderCell>Email</HeaderCell>
                <HeaderCell>Full Name</HeaderCell>
                <HeaderCell>Watermark</HeaderCell> {/* NEW COLUMN */}
                <HeaderCell>Created</HeaderCell>
                <HeaderCell>Actions</HeaderCell>
                <HeaderCell>Status</HeaderCell>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-blue-100">
              {users.length ? (
                users.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`${index % 2 === 0 ? "bg-blue-50/50" : "bg-white"} hover:bg-blue-100 transition`}
                  >
                    <BodyCell>{index + 1}</BodyCell>
                    <BodyCell className="font-mono text-sm">{user.id}</BodyCell>
                    <BodyCell className="text-blue-700 font-medium">{user.email}</BodyCell>
                    <BodyCell>{user.full_name || "-"}</BodyCell>
                    <BodyCell>{user.watermark || "-"}</BodyCell> {/* DISPLAY WATERMARK */}
                    <BodyCell>{new Date(user.created_at).toLocaleDateString()}</BodyCell>

                    <BodyCell>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          className={`px-4 py-2 font-semibold rounded-lg shadow-sm transition
                            ${user.is_active === 1 ? "bg-gray-300 hover:bg-gray-400 text-gray-800" : "bg-green-500 hover:bg-green-600 text-white"}`}
                        >
                          {user.is_active === 1 ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          onClick={() => handleDelete(user.email)}
                          className="px-3 py-2 bg-red-500 text-white text-sm rounded-lg shadow hover:bg-red-600 transition flex items-center gap-1"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </BodyCell>

                    <BodyCell>
                      <div className="flex justify-center items-center">
                        <span
                          className={`h-4 w-4 rounded-full ${user.is_active === 1 ? "bg-green-500" : "bg-red-500"
                            }`}
                        ></span>
                      </div>
                    </BodyCell>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-gray-500 bg-blue-50">
                    No users available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const HeaderCell = ({ children }) => (
  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
    {children}
  </th>
);

const BodyCell = ({ children, className = "" }) => (
  <td className={`px-6 py-4 whitespace-nowrap text-gray-700 ${className}`}>
    {children}
  </td>
);

export default UserList;
