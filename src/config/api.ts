// Configuração da API para Vercel + Railway
// Sempre usar produção para funcionar no Vercel

// URL da API - sempre usar Railway
export const API_BASE_URL = 'https://cupidomcz-production.up.railway.app';

// Para desenvolvimento, usar Railway também
export const API_BASE_URL_DEV = 'https://cupidomcz-production.up.railway.app';

// Configuração do Socket.IO
export const SOCKET_URL = 'https://cupidomcz-production.up.railway.app';

// Configuração de upload
export const UPLOAD_URL = `${API_BASE_URL}/api/upload`;

// Configurações específicas para Maceió
export const MACEIO_CONFIG = {
  city: 'Maceió',
  state: 'AL',
  country: 'Brasil',
  coordinates: [-35.7351, -9.6498], // [longitude, latitude]
  timezone: 'America/Maceio'
};

// Configurações da aplicação
export const APP_CONFIG = {
  name: 'Cupido Maceió',
  version: '1.0.0',
  description: 'Rede social de namoro para Maceió',
  maxPhotos: 6,
  maxBioLength: 500,
  minAge: 18,
  maxAge: 100,
  maxDistance: 50 // km
};
