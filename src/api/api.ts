import axios from 'axios';

// Define la URL base de tu API en la nube
// En producción, VITE_API_URL debe ser la URL de tu backend real.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Clave para almacenar el token en localStorage
const TOKEN_STORAGE_KEY = 'authToken'; 

// Instancia de Axios
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token de autenticación a cada solicitud
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Para FormData, Axios automáticamente establece el Content-Type correcto con boundary
  // No es necesario eliminarlo manualmente aquí a menos que tengas un caso de uso específico
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
