import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const cartItems = location.state?.cartItems || [];

  const [formData, setFormData] = useState({
    delivery_address: '',
    delivery_city: '',
    billing_address: '',
    billing_city: '',
    payment_method: 'credit_card',
  });
  const [loading, setLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState('new');
  const [selectedBillingId, setSelectedBillingId] = useState('new');

  useEffect(() => {
    if (user) {
      fetchSavedAddresses();
    }
  }, [user]);

  const fetchSavedAddresses = async () => {
    try {
      const data = await api.getProfile(user.customer_id);
      setSavedAddresses(data.addresses);
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddressSelect = (type, addressId) => {
    if (type === 'delivery') {
      setSelectedDeliveryId(addressId);
      if (addressId === 'new') {
        setFormData(prev => ({ ...prev, delivery_city: '', delivery_address: '' }));
      } else {
        const addr = savedAddresses.find(a => a.address_id === parseInt(addressId));
        if (addr) {
          setFormData(prev => ({ ...prev, delivery_city: addr.city, delivery_address: addr.full_address }));
        }
      }
    } else if (type === 'billing') {
      setSelectedBillingId(addressId);
      if (addressId === 'new') {
        setFormData(prev => ({ ...prev, billing_city: '', billing_address: '' }));
      } else {
        const addr = savedAddresses.find(a => a.address_id === parseInt(addressId));
        if (addr) {
          setFormData(prev => ({ ...prev, billing_city: addr.city, billing_address: addr.full_address }));
        }
      }
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + parseFloat(item.price) * item.quantity;
    }, 0) + 10; // + shipping
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        customer_id: user.customer_id,
        total_amount: calculateTotal() - 10,
        shipping_fee: 10,
        items: cartItems.map((item, idx) => ({
          line_no: idx + 1,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: parseFloat(item.price),
        })),
        ...formData,
      };

      await api.createOrder(orderData);
      alert('Order placed successfully!');
      navigate('/orders');
    } catch (error) {
      if (error.message.includes('Out of Stock')) {
        alert('ORDER FAILED: ' + error.message);
      } else {
        alert('Failed to place order: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="empty-checkout">
            <p>NO ITEMS TO CHECKOUT</p>
            <button
              className="pixel-button"
              onClick={() => navigate('/cart')}
            >
              GO TO CART
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="page-title">💳 CHECKOUT</h1>

        <div className="checkout-content">
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="form-section">
              <h2>DELIVERY ADDRESS</h2>

              {savedAddresses.length > 0 && (
                <div className="form-group">
                  <label style={{ color: '#4ade80' }}>SELECT SAVED ADDRESS:</label>
                  <select
                    className="pixel-input"
                    value={selectedDeliveryId}
                    onChange={(e) => handleAddressSelect('delivery', e.target.value)}
                    style={{ marginBottom: '15px', borderColor: '#4ade80' }}
                  >
                    <option value="new">-- Enter New Address --</option>
                    {savedAddresses.map(addr => (
                      <option key={addr.address_id} value={addr.address_id}>
                        {addr.address_type} - {addr.city}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>CITY:</label>
                <input
                  type="text"
                  name="delivery_city"
                  className="pixel-input"
                  value={formData.delivery_city}
                  onChange={handleChange}
                  required
                  readOnly={selectedDeliveryId !== 'new'}
                  style={{ opacity: selectedDeliveryId !== 'new' ? 0.7 : 1 }}
                />
              </div>
              <div className="form-group">
                <label>FULL ADDRESS:</label>
                <textarea
                  name="delivery_address"
                  className="pixel-input"
                  rows="3"
                  value={formData.delivery_address}
                  onChange={handleChange}
                  required
                  readOnly={selectedDeliveryId !== 'new'}
                  style={{ opacity: selectedDeliveryId !== 'new' ? 0.7 : 1 }}
                />
              </div>
            </div>

            <div className="form-section">
              <h2>BILLING ADDRESS</h2>

              {savedAddresses.length > 0 && (
                <div className="form-group">
                  <label style={{ color: '#4ade80' }}>SELECT SAVED ADDRESS:</label>
                  <select
                    className="pixel-input"
                    value={selectedBillingId}
                    onChange={(e) => handleAddressSelect('billing', e.target.value)}
                    style={{ marginBottom: '15px', borderColor: '#4ade80' }}
                  >
                    <option value="new">-- Enter New Address --</option>
                    {savedAddresses.map(addr => (
                      <option key={addr.address_id} value={addr.address_id}>
                        {addr.address_type} - {addr.city}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>CITY:</label>
                <input
                  type="text"
                  name="billing_city"
                  className="pixel-input"
                  value={formData.billing_city}
                  onChange={handleChange}
                  required
                  readOnly={selectedBillingId !== 'new'}
                  style={{ opacity: selectedBillingId !== 'new' ? 0.7 : 1 }}
                />
              </div>
              <div className="form-group">
                <label>FULL ADDRESS:</label>
                <textarea
                  name="billing_address"
                  className="pixel-input"
                  rows="3"
                  value={formData.billing_address}
                  onChange={handleChange}
                  required
                  readOnly={selectedBillingId !== 'new'}
                  style={{ opacity: selectedBillingId !== 'new' ? 0.7 : 1 }}
                />
              </div>
            </div>

            <div className="form-section">
              <h2>PAYMENT METHOD</h2>
              <div className="form-group">
                <select
                  name="payment_method"
                  className="pixel-input"
                  value={formData.payment_method}
                  onChange={handleChange}
                >
                  <option value="credit_card">CREDIT CARD</option>
                  <option value="debit_card">DEBIT CARD</option>
                  <option value="paypal">PAYPAL</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="pixel-button success checkout-submit"
              disabled={loading}
            >
              {loading ? 'PLACING ORDER...' : 'PLACE ORDER'}
            </button>
          </form>

          <div className="order-summary">
            <h2>ORDER SUMMARY</h2>
            <div className="summary-items">
              {cartItems.map(item => (
                <div key={item.product_id} className="summary-item">
                  <span>{item.product_name} x{item.quantity}</span>
                  <span>${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="summary-totals">
              <div className="summary-row">
                <span>SUBTOTAL:</span>
                <span>${(calculateTotal() - 10).toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>SHIPPING:</span>
                <span>$10.00</span>
              </div>
              <div className="summary-row total">
                <span>TOTAL:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

