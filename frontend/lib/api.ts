import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { getSession } from "next-auth/react";

const API_URL = "";

const apiClient: AxiosInstance = axios.create({
  baseURL: `/api/backend`,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// Automatically attach access token from NextAuth session
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

// Response error interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ?? error.message ?? "An error occurred";
    return Promise.reject(new Error(message));
  }
);

// ─── Typed API methods ────────────────────────────────────

export const petsApi = {
  list: () => apiClient.get("/pets/"),
  get: (id: string) => apiClient.get(`/pets/${id}`),
  create: (data: unknown) => apiClient.post("/pets/", data),
  update: (id: string, data: unknown) => apiClient.patch(`/pets/${id}`, data),
  delete: (id: string) => apiClient.delete(`/pets/${id}`),
  logWeight: (petId: string, data: unknown) =>
    apiClient.post(`/pets/${petId}/weight-logs`, data),
  getWeightLogs: (petId: string, limit = 90) =>
    apiClient.get(`/pets/${petId}/weight-logs`, { params: { limit } }),
};

export const nutritionApi = {
  getRequirements: (petId: string) =>
    apiClient.get(`/nutrition/requirements/${petId}`),
  scoreFood: (data: unknown) => apiClient.post("/nutrition/score-food", data),
  getPlans: (petId: string) => apiClient.get(`/nutrition/plans/${petId}`),
  getRecommendations: (petId: string) =>
    apiClient.get(`/nutrition/recommend/${petId}`),
  getEstimate: (petId: string, productId: string) =>
    apiClient.get(`/nutrition/estimate`, { params: { pet_id: petId, product_id: productId } }),
};

export const analyticsApi = {
  getHealthAlerts: (petId: string) =>
    apiClient.get(`/analytics/health-alerts/${petId}`),
  getSummary: (petId: string) =>
    apiClient.get(`/analytics/summary/${petId}`),
  getDietAnalysis: (petId: string) =>
    apiClient.get(`/analytics/diet/${petId}`),
};

export const supplyChainApi = {
  verifyBarcode: (barcode: string) =>
    apiClient.post("/supply-chain/verify/barcode", { barcode }),
  verifyQR: (payload: string) =>
    apiClient.post("/supply-chain/verify/qr", { barcode: payload }),
};

export const healthRecordsApi = {
  list: (petId: string) => apiClient.get(`/pets/${petId}/health-records`),
  create: (petId: string, data: unknown) => apiClient.post(`/pets/${petId}/health-records`, data),
  delete: (petId: string, recordId: string) => apiClient.delete(`/pets/${petId}/health-records/${recordId}`),
};

export const subscriptionsApi = {
  list: () => apiClient.get("/subscriptions/"),
  create: (data: unknown) => apiClient.post("/subscriptions/", data),
  pause: (id: string) => apiClient.patch(`/subscriptions/${id}/pause`),
  resume: (id: string) => apiClient.patch(`/subscriptions/${id}/resume`),
};

export default apiClient;
