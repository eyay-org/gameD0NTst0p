import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Orders.css';

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadOrders = async () => {
      try {
        const data = await api.getOrders(user.customer_id);
        setOrders(data);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user, navigate]);

  if (loading) {
    return <div className="loading">LOADING...</div>;
  }

  return (
    <div className="orders-page">
      <div className="container">
        <h1 className="page-title">📦 YOUR ORDERS</h1>

        {orders.length === 0 ? (
          <div className="empty-orders">
            <p>YOU HAVE NO ORDERS YET</p>
            <button
              className="pixel-button"
              onClick={() => navigate('/products')}
            >
              SHOP NOW
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order.order_id} className="order-item">
                <div className="order-header">
                  <div className="order-info">
                    <h3>ORDER #{order.order_id}</h3>
                    <p className="order-date">
                      {new Date(order.order_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="order-status">
                    <span className={`status-badge ${order.order_status}`}>
                      {order.order_status.toUpperCase()}
                    </span>
                    {order.order_status !== 'delivered' && (
                      <button
                        className="pixel-button small"
                        style={{ marginLeft: '10px' }}
                        onClick={async () => {
                          if (window.confirm('Did you receive this order?')) {
                            try {
                              await api.updateOrderStatus(order.order_id, 'delivered');
                              // Refresh orders
                              const data = await api.getOrders(user.customer_id);
                              setOrders(data);
                            } catch (error) {
                              alert('Failed to update status');
                            }
                          }
                        }}
                      >
                        TESLİM ALDIM
                      </button>
                    )}
                  </div>
                </div>
                <div className="order-details">
                  <div className="detail-item">
                    <span className="detail-label">TOTAL:</span>
                    <span className="detail-value">${parseFloat(order.total_amount).toFixed(2)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">PAYMENT:</span>
                    <span className="detail-value">{order.payment_status}</span>
                  </div>
                  {order.tracking_number && (
                    <div className="detail-item">
                      <span className="detail-label">TRACKING:</span>
                      <span className="detail-value">{order.tracking_number}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;

