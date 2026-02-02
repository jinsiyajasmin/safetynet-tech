// src/api.js
import axios from "axios";
const base = import.meta.env.VITE_BACKEND_URL || "https://safetynet-tech-7qme.vercel.app";

console.log("🚀 API Base URL:", base);

const api = axios.create({
  baseURL: base + "/api",
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
