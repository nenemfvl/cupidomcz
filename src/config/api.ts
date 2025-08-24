const isProduction = false; // Temporariamente fixo para desenvolvimento

// URL da API baseada no ambiente
export const API_BASE_URL = isProduction 
  ? 'https://cupidomcz-backend.onrender.com' 
  : 'http://localhost:5000';

// Configurações da API
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Configurações do Socket.IO
export const SOCKET_CONFIG = {
  url: isProduction 
    ? 'https://cupidomcz-backend.onrender.com' 
    : 'http://localhost:5000',
  options: {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  },
};

// Configurações de upload
export const UPLOAD_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFiles: 6,
};

// Configurações de geolocalização (Maceió)
export const MACEIO_CONFIG = {
  center: {
    lat: -9.6498,
    lng: -35.7089,
  },
  radius: 50000, // 50km
  city: 'Maceió',
  state: 'AL',
  country: 'Brasil',
};
