// src/api.js
import axios from "axios";
const base = "https://safetynet-tech-7qme.vercel.app";

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
