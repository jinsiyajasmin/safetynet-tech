// src/api.js
import axios from "axios";
const base =  'http://localhost:4000';

const api = axios.create({
  baseURL: base + '/api',
  timeout: 15000,
});


export default api;
