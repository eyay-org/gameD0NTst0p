const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${text || response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      // Provide more helpful error messages
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to backend server. Make sure Flask is running on http://localhost:5000');
      }
      throw error;
    }
  }

  // Products
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/products${queryString ? `?${queryString}` : ''}`);
  }

  async getProduct(productId) {
    return this.request(`/products/${productId}`);
  }

  async getGenres() {
    return this.request('/genres');
  }

  // Customers
  async registerCustomer(customerData) {
    return this.request('/customers/register', {
      method: 'POST',
      body: customerData,
    });
  }

  async loginCustomer(credentials) {
    return this.request('/customers/login', {
      method: 'POST',
      body: credentials,
    });
  }

  // Cart
  async getCart(customerId) {
    return this.request(`/cart/${customerId}`);
  }

  async addToCart(customerId, productId, quantity = 1) {
    return this.request('/cart', {
      method: 'POST',
      body: {
        customer_id: customerId,
        product_id: productId,
        quantity,
      },
    });
  }

  async removeFromCart(customerId, productId) {
    return this.request(`/cart/${customerId}/${productId}`, {
      method: 'DELETE',
    });
  }

  // Orders
  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: orderData,
    });
  }

  async getOrders(customerId) {
    return this.request(`/orders/${customerId}`);
  }

  // Reviews
  async createReview(reviewData) {
    return this.request('/reviews', {
      method: 'POST',
      body: reviewData,
    });
  }

  async updateOrderStatus(orderId, status) {
    return this.request(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: { status },
    });
  }

  async checkReviewEligibility(productId, customerId) {
    return this.request(`/products/${productId}/eligibility/${customerId}`);
  }

  // Admin
  async getAdminStats() {
    return this.request('/admin/stats');
  }

  async getAdminInventory() {
    return this.request('/admin/inventory');
  }

  async getAdminOrders() {
    return this.request('/admin/orders');
  }
}

export default new ApiService();

