import axios from "axios";

const API_URL = import.meta.env.VITE_APP_API_URL;
console.log(API_URL)
export const registerUser = async (formData) => {
  for (let pair of formData.entries()) {
    console.log(pair[0], pair[1]);
  }
  const res = await axios.post(`${API_URL}/auth/register`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  console.log(res.data);

  return res.data;
};

export const getAllUsers = async () => {
  const res = await axios.get(`${API_URL}/auth/get-users`);
  console.log(res);

  return res.data;
};

export const deleteUser = async (email) => {
  const res = await axios.delete(`${API_URL}/auth/delete-user`, {
    data: { email }, // Pass email in the request body
  });
  return res.data;
};