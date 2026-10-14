// Unified API Client for ParkCloud Desktop Application

const getApiBaseUrl = () => {
  if (window.PARKCLOUD_API_URL) return window.PARKCLOUD_API_URL;
  return 'http://parkcloud-alb-2029168588.ap-south-1.elb.amazonaws.com';
};

export const API_BASE_URL = getApiBaseUrl();

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // If token is stored in memory or storage as fallback
  const token = localStorage.getItem('parkcloud_token');
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Includes HttpOnly cookies
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.error || `Request failed with status ${res.status}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.code = data?.code;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const netErr = new Error('Cannot connect to ParkCloud Cloud API server. Please check your network or ALB connection.');
      netErr.isNetworkError = true;
      throw netErr;
    }
    throw err;
  }
}

export const api = {
  // Auth
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (payload) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  getMe: () => request('/api/auth/me'),

  // Lots & Slots
  getLots: () => request('/api/lots'),
  getLot: (id) => request(`/api/lots/${id}`),
  createLot: (payload) => request('/api/lots', { method: 'POST', body: JSON.stringify(payload) }),
  updateLot: (id, payload) => request(`/api/lots/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  getLotAvailability: (lotId, startTime, endTime, vehicleType) =>
    request(`/api/lots/${lotId}/availability?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}&vehicleType=${vehicleType || 'FOUR_WHEELER'}`),
  createSlot: (lotId, payload) => request(`/api/lots/${lotId}/slots`, { method: 'POST', body: JSON.stringify(payload) }),

  // Vehicles
  getVehicles: () => request('/api/vehicles'),
  createVehicle: (payload) => request('/api/vehicles', { method: 'POST', body: JSON.stringify(payload) }),
  deleteVehicle: (id) => request(`/api/vehicles/${id}`, { method: 'DELETE' }),

  // Bookings
  createBooking: (payload) => request('/api/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  getMyBookings: () => request('/api/bookings/my'),
  getBooking: (id) => request(`/api/bookings/${id}`),
  cancelBooking: (id, reason) => request(`/api/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  checkIn: (bookingReference) => request('/api/bookings/check-in', { method: 'POST', body: JSON.stringify({ bookingReference }) }),
  checkOut: (bookingReference) => request('/api/bookings/check-out', { method: 'POST', body: JSON.stringify({ bookingReference }) }),
  getAdminBookings: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/bookings/admin/all?${qs}`);
  },

  // Analytics
  getAnalyticsSummary: (lotId) => request(`/api/analytics/summary${lotId ? `?lotId=${lotId}` : ''}`),
  getPeakHours: (lotId) => request(`/api/analytics/peak-hours${lotId ? `?lotId=${lotId}` : ''}`),
  getHeatmap: (lotId) => request(`/api/analytics/heatmap${lotId ? `?lotId=${lotId}` : ''}`),
  getForecast: (lotId) => request(`/api/analytics/forecast${lotId ? `?lotId=${lotId}` : ''}`),

  // File Storage & Reports
  generateReport: (format, lotId) => request('/api/files/generate-report', { method: 'POST', body: JSON.stringify({ format, lotId }) }),
  getFiles: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/files?${qs}`);
  },
  getDownloadUrl: (fileId) => request(`/api/files/${fileId}/download-url`),
};
