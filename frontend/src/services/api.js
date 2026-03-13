// src/api.js
import axios from "axios";
const base = import.meta.env.VITE_BACKEND_URL || "https://api-site-mateai.co.uk";

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

// Site Management APIs
export const fetchSites = async (search = "") => {
  const response = await api.get(`/sites?search=${encodeURIComponent(search)}`);
  return response.data;
};

export const createSite = async (siteData) => {
  const response = await api.post("/sites", siteData);
  return response.data;
};

export const updateSite = async (id, siteData) => {
  const response = await api.put(`/sites/${id}`, siteData);
  return response.data;
};

export const deleteSite = async (id) => {
  const response = await api.delete(`/sites/${id}`);
  return response.data;
};

export const fetchSiteManagers = async () => {
  const response = await api.get("/sites/managers");
  return response.data;
};

// Sitepack Document APIs
export const uploadDocument = async (formData) => {
  const response = await api.post("/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const fetchDocuments = async (siteId, category) => {
  const response = await api.get(`/documents`, {
    params: { siteId, category }
  });
  return response.data;
};

export const fetchDocumentCounts = async (siteId) => {
  const response = await api.get(`/documents/counts`, {
    params: { siteId }
  });
  return response.data;
};

export const deleteDocument = async (id) => {
  const response = await api.delete(`/documents/${id}`);
  return response.data;
};
