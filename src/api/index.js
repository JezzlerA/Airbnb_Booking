const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  const json = await response.json();
  return json.data !== undefined ? json.data : json;
}

export async function getProperties(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });
  const query = params.toString();
  return request(`/properties${query ? `?${query}` : ''}`);
}

export async function getProperty(id) {
  return request(`/properties/${id}`);
}

export async function createProperty(data, token) {
  return request('/properties', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: data
  });
}

export async function updateProperty(id, data, token) {
  return request(`/properties/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: data
  });
}

export async function archiveProperty(id, token) {
  return request(`/properties/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function deletePropertyPermanently(id, token) {
  return request(`/properties/${id}/permanent`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function getPropertyUnits(token) {
  return request('/property-units', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function getPropertyImages(token) {
  return request('/property-images', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function getBookings(token, filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });
  const query = params.toString();
  return request(`/bookings${query ? `?${query}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function getBooking(id, token) {
  return request(`/bookings/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function createBooking(data, token) {
  return request('/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: data
  });
}

export async function updateBookingStatus(id, status, token) {
  return request(`/bookings/${id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: { status }
  });
}

export async function getPayments(token, filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });
  const query = params.toString();
  return request(`/payments${query ? `?${query}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function getReviews() {
  return request('/reviews');
}

export async function getAmenities() {
  return request('/amenities');
}

export async function getNotifications(token, userId) {
  const url = userId ? `/notifications?userId=${userId}` : '/notifications';
  return request(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function getActivityLogs(token) {
  return request('/activity-logs', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function getSettings() {
  return request('/settings');
}

export async function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: { email, password }
  });
}

export async function register(data) {
  return request('/auth/register', {
    method: 'POST',
    body: data
  });
}

export async function registerAdmin(data) {
  return request('/auth/register-admin', {
    method: 'POST',
    body: data
  });
}
