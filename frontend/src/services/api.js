import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    if (error.response) {
      // Server responded with a status code outside 2xx
      throw new Error(error.response.data.error || `Request failed with status ${error.response.status}`);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Cannot connect to backend server. Make sure Flask is running on http://localhost:5000');
    } else {
      // Something happened in setting up the request
      throw error;
    }
  }
);

const apiService = {
  // Products
  getProducts: (params = {}) => api.get('/products', { params }),
  getProduct: (productId) => api.get(`/products/${productId}`),
  getGenres: () => api.get('/genres'),
  getPlatforms: () => api.get('/platforms'),

  // Customers
  registerCustomer: (customerData) => api.post('/customers/register', customerData),
  loginCustomer: (credentials) => api.post('/customers/login', credentials),

  // Profile
  getProfile: (customerId) => api.get('/profile', { params: { customer_id: customerId } }),
  updateProfile: (data) => api.put('/profile/update', data),
  changePassword: (data) => api.put('/profile/password', data),
  addAddress: (data) => api.post('/profile/address', data),
  deleteAddress: (addressId, customerId) => api.delete(`/profile/address/${addressId}`, { params: { customer_id: customerId } }),

  // Cart
  getCart: (customerId) => api.get(`/cart/${customerId}`),
  addToCart: (customerId, productId, quantity = 1) => api.post('/cart', { customer_id: customerId, product_id: productId, quantity }),
  removeFromCart: (customerId, productId) => api.delete(`/cart/${customerId}/${productId}`),

  // Orders
  createOrder: (orderData) => api.post('/orders', orderData),
  getOrders: (customerId) => api.get(`/orders/${customerId}`),
  updateOrderStatus: (orderId, status) => api.put(`/orders/${orderId}/status`, { status }),

  // Reviews
  createReview: (reviewData) => api.post('/reviews', reviewData),
  checkReviewEligibility: (productId, customerId) => api.get(`/products/${productId}/eligibility/${customerId}`),

  // Admin
  getAdminStats: () => api.get('/admin/stats'),
  getAdminInventory: (params = {}) => api.get('/admin/inventory', { params }),
  getAdminOrders: (params = {}) => api.get('/admin/orders', { params }),
  getAdminStockLogs: (limit = 50) => api.get('/admin/stock-logs', { params: { limit } }),
  getAdminAnalytics: () => api.get('/admin/analytics'),
  getSuppliers: () => api.get('/admin/suppliers'),
  restockInventory: (data) => api.post('/admin/restock', data),
  getBranches: (params = {}) => api.get('/admin/branches', { params }),
  transferInventory: (data) => api.post('/admin/inventory/transfer', data),
  recordOfflineSale: (data) => api.post('/admin/sales/offline', data),
  getAdminReturns: (params = {}) => api.get('/admin/returns', { params }),
  requestReturn: (orderId, reason) => api.post('/returns/request', {
    order_id: orderId,
    reason
  }),
  updateReturnStatus: (returnId, status) => api.put(`/admin/returns/${returnId}/status`, { status }),
};

export default apiService;
