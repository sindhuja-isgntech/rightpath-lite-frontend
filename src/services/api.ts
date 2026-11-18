import axios from 'axios';

export const TOKEN_KEY = 'token';

export const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

// Attach the JWT to every request when the user is logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
