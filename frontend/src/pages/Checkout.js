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
            <p>No items to checkout</p>
            <button
              className="pixel-button"
              onClick={() => navigate('/cart')}
            >
              Go to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <div className="checkout-header">
          <h1 className="page-title">Checkout</h1>
        </div>

        <div className="checkout-content">
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="form-section checkout-section">
              <h2>
                <span className="section-number">1</span>
                Delivery Address
              </h2>

              {savedAddresses.length > 0 && (
                <div className="form-group">
                  <label htmlFor="delivery-address-select">Select Saved Address</label>
                  <select
                    id="delivery-address-select"
                    className="form-input"
                    value={selectedDeliveryId}
                    onChange={(e) => handleAddressSelect('delivery', e.target.value)}
                  >
                    <option value="new">Enter New Address</option>
                    {savedAddresses.map(addr => (
                      <option key={addr.address_id} value={addr.address_id}>
                        {addr.address_type} - {addr.city}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="delivery-city">City</label>
                <input
                  id="delivery-city"
                  type="text"
                  name="delivery_city"
                  className="form-input"
                  value={formData.delivery_city}
                  onChange={handleChange}
                  required
                  readOnly={selectedDeliveryId !== 'new'}
                  disabled={selectedDeliveryId !== 'new'}
                />
              </div>
              <div className="form-group">
                <label htmlFor="delivery-address">Full Address</label>
                <textarea
                  id="delivery-address"
                  name="delivery_address"
                  className="form-input"
                  rows="3"
                  value={formData.delivery_address}
                  onChange={handleChange}
                  required
                  readOnly={selectedDeliveryId !== 'new'}
                  disabled={selectedDeliveryId !== 'new'}
                />
              </div>
            </div>

            <div className="form-section checkout-section">
              <h2>
                <span className="section-number">2</span>
                Billing Address
              </h2>

              {savedAddresses.length > 0 && (
                <div className="form-group">
                  <label htmlFor="billing-address-select">Select Saved Address</label>
                  <select
                    id="billing-address-select"
                    className="form-input"
                    value={selectedBillingId}
                    onChange={(e) => handleAddressSelect('billing', e.target.value)}
                  >
                    <option value="new">Enter New Address</option>
                    {savedAddresses.map(addr => (
                      <option key={addr.address_id} value={addr.address_id}>
                        {addr.address_type} - {addr.city}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="billing-city">City</label>
                <input
                  id="billing-city"
                  type="text"
                  name="billing_city"
                  className="form-input"
                  value={formData.billing_city}
                  onChange={handleChange}
                  required
                  readOnly={selectedBillingId !== 'new'}
                  disabled={selectedBillingId !== 'new'}
                />
              </div>
              <div className="form-group">
                <label htmlFor="billing-address">Full Address</label>
                <textarea
                  id="billing-address"
                  name="billing_address"
                  className="form-input"
                  rows="3"
                  value={formData.billing_address}
                  onChange={handleChange}
                  required
                  readOnly={selectedBillingId !== 'new'}
                  disabled={selectedBillingId !== 'new'}
                />
              </div>
            </div>

            <div className="form-section checkout-section">
              <h2>
                <span className="section-number">3</span>
                Payment Method
              </h2>
              <div className="form-group">
                <label htmlFor="payment-method">Payment Method</label>
                <select
                  id="payment-method"
                  name="payment_method"
                  className="form-input"
                  value={formData.payment_method}
                  onChange={handleChange}
                >
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="place-order-btn"
              disabled={loading}
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </form>

          <div className="order-summary">
            <h2>Order Summary</h2>
            <div className="summary-items">
              {cartItems.map(item => (
                <div key={item.product_id} className="summary-item">
                  <div className="summary-item-info">
                    <h4>{item.product_name}</h4>
                    <p>Quantity: {item.quantity}</p>
                  </div>
                  <div className="summary-item-price">
                    ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${(calculateTotal() - 10).toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>$10.00</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
            <div className="secure-note">
              <span>🔒</span>
              <span>Secure checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

