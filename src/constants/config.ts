import Constants from 'expo-constants';

// Get configuration from Expo extra or environment
const extra = Constants.expoConfig?.extra || {};

export const ENV = {
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || extra.googleMapsApiKey || '',
  NVIDIA_NIM_API_KEY: process.env.NVIDIA_NIM_API_KEY || extra.nvidiaNimApiKey || '<<PUT_YOUR_NVIDIA_API_KEY_HERE>>',
  
  // NVIDIA NIM Chat Completions Endpoint
  NVIDIA_NIM_BASE_URL: 'https://integrate.api.nvidia.com/v1/chat/completions',
  NVIDIA_MODEL: 'meta/llama-3.1-70b-instruct',
};

export const hasValidGoogleMapsKey = () => {
  return (
    ENV.GOOGLE_MAPS_API_KEY &&
    !ENV.GOOGLE_MAPS_API_KEY.includes('<<PUT_') &&
    ENV.GOOGLE_MAPS_API_KEY !== 'GOOGLE_MAPS_API_KEY' &&
    ENV.GOOGLE_MAPS_API_KEY.length > 10
  );
};

export const hasValidNvidiaKey = () => {
  return (
    ENV.NVIDIA_NIM_API_KEY &&
    !ENV.NVIDIA_NIM_API_KEY.includes('<<PUT_') &&
    ENV.NVIDIA_NIM_API_KEY.length > 10
  );
};
