import axios from 'axios';

const api = axios.create({
  baseURL: 'https://helpdesk.4D-gile.com/api',
});

// Injecte le token JWT automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ✅ Intercepte les erreurs et extrait toujours une STRING
api.interceptors.response.use(
  response => response,
  error => {
    const data = error.response?.data;
    const message =
      typeof data === 'string'     ? data :
      data?.message                ? data.message :
      data?.error                  ? data.error :
      'Une erreur est survenue';

    if (error.response) {
      error.response.data = message;
    }
    return Promise.reject(error);
  }
);

export default api;
