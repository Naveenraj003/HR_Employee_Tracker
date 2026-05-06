import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  retry?: number;
}

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor: add auth token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor: handle token refresh on 401
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as CustomAxiosRequestConfig;
        const requestUrl = config?.url || '';
        const isAuthEndpoint =
          requestUrl.includes('/auth/login') ||
          requestUrl.includes('/auth/refresh') ||
          requestUrl.includes('/auth/logout');

        if (error.response?.status === 401 && config && !config.retry && !isAuthEndpoint) {
          config.retry = 1;
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              // Use plain axios for refresh to avoid recursive interceptor loops.
              const response = await axios.post(`${this.baseURL}/auth/refresh`, { refreshToken });
              localStorage.setItem('accessToken', response.data.accessToken);
              if (response.data.refreshToken) {
                localStorage.setItem('refreshToken', response.data.refreshToken);
              }
              return this.client(config);
            }
          } catch {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      },
    );
  }

  // Auth endpoints
  login(loginId: string, password: string) {
    return this.client.post('/auth/login', { loginId, password });
  }

  get<T = unknown>(url: string) {
    return this.client.get<T>(url);
  }

  post<T = unknown>(url: string, data?: unknown) {
    return this.client.post<T>(url, data);
  }

  logout() {
    return this.client.post('/auth/logout');
  }

  changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
    return this.client.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
  }

  setupMfa(mfaMethod: string, phoneNumber?: string) {
    return this.client.post('/auth/mfa/setup', { mfaMethod, phoneNumber });
  }

  verifyMfa(code: string) {
    return this.client.post('/auth/mfa/verify', { code });
  }

  verifyLoginMfa(mfaToken: string, code: string) {
    return this.client.post('/auth/mfa/login-verify', { mfaToken, code });
  }

  getCurrentUser() {
    return this.client.get('/auth/me');
  }

  checkIn() {
    return this.client.post('/dashboard/attendance/check-in');
  }

  checkOut() {
    return this.client.post('/dashboard/attendance/check-out');
  }

  getClient() {
    return this.client;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
