import React, { useState } from "react";
import { registerUser } from "../api/userApi";
import { UserPlus, Image } from "lucide-react";

const RegisterUser = ({ onUserRegistered }) => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    watermark_text: "",
  });
  const [classLogo, setClassLogo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const API_URL = import.meta.env.REACT_APP_API_URL || "https://notes-app-plum-three.vercel.app/api/v1";


  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setClassLogo(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setMessage("");

  if (!form.email || !form.password) {
    setMessage("Email and Password are required");
    return;
  }

  setLoading(true);

  try {
    const formData = new FormData();
    formData.append("email", form.email);
    formData.append("password", form.password);
    formData.append("full_name", form.full_name);
    formData.append("watermark", form.watermark_text);
    console.log("Form Data:", formData);
    if (classLogo) formData.append("logo", classLogo);

    await registerUser(formData);
    

    setMessage("User registered successfully 🎉");
  } catch (err) {
    setMessage(err.response?.data?.error || "Error registering user");
  } finally {
    setLoading(false);
  }
};


  const isError = message.includes("Error");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-2xl">
              <UserPlus size={36} />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold">Register New User</h2>
              <p className="text-white/90 mt-1">
                Create account with logo & watermark
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Inputs Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
            />
            <Input
              label="Full Name"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
            />
            <Input
              label="Watermark Text"
              name="watermark_text"
              value={form.watermark_text}
              onChange={handleChange}
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Class Logo
            </label>
            <div className="border-2 border-dashed border-blue-200 rounded-2xl p-6 flex items-center gap-6 hover:border-blue-400 transition">
              <div className="w-24 h-24 rounded-xl bg-blue-50 flex items-center justify-center overflow-hidden">
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image className="text-blue-400" size={36} />
                )}
              </div>

              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold cursor-pointer hover:bg-blue-700 transition"
                >
                  Upload Logo
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  PNG, JPG (recommended square)
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-bold text-lg text-white transition-all
              ${
                loading
                  ? "bg-blue-400"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.01] shadow-lg"
              }`}
          >
            {loading ? "Registering..." : "Register User"}
          </button>

          {/* Message */}
          {message && (
            <div
              className={`p-4 rounded-2xl text-center font-medium
                ${
                  isError
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
                }`}
            >
              {isError ? "❌ " : "✅ "}
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      {label}
    </label>
    <input
      {...props}
      className="w-full p-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition"
    />
  </div>
);

export default RegisterUser;
