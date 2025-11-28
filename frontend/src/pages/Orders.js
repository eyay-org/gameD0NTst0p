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
  const [expandedOrderId, setExpandedOrderId] = useState(null);

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

  const toggleOrder = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

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
              <div key={order.order_id} className={`order-item ${expandedOrderId === order.order_id ? 'expanded' : ''}`}>
                <div
                  className="order-header"
                  onClick={() => toggleOrder(order.order_id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="order-info">
                    <h3>ORDER #{order.order_id} {expandedOrderId === order.order_id ? '▲' : '▼'}</h3>
                    <p className="order-date">
                      {new Date(order.order_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="order-status">
                    <span className={`status-badge ${order.order_status}`}>
                      {order.order_status.toUpperCase()}
                    </span>

                  </div>
                </div>

                {/* Order Summary Details */}
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

                {/* Expanded Items List */}
                {expandedOrderId === order.order_id && (
                  <div className="order-items-container" style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '20px' }}>
                    <h4 style={{ marginBottom: '15px', color: '#4ade80' }}>ORDER ITEMS</h4>
                    {order.items && order.items.map((item, index) => (
                      <div key={index} className="order-product-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '4px' }}>
                        <div
                          className="product-thumbnail"
                          style={{ width: '60px', height: '60px', marginRight: '15px', cursor: 'pointer', overflow: 'hidden', borderRadius: '4px' }}
                          onClick={() => navigate(`/products/${item.product_id}`)}
                        >
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: '#333' }} />
                          )}
                        </div>
                        <div className="product-info" style={{ flex: 1 }}>
                          <div
                            className="product-name"
                            style={{ fontWeight: 'bold', cursor: 'pointer', marginBottom: '5px' }}
                            onClick={() => navigate(`/products/${item.product_id}`)}
                          >
                            {item.product_name}
                          </div>
                          <div className="product-meta" style={{ fontSize: '0.9em', color: '#aaa' }}>
                            Qty: {item.quantity} × ${item.unit_price.toFixed(2)}
                          </div>
                        </div>
                        <div className="product-total" style={{ fontWeight: 'bold', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                          <span>${(item.quantity * item.unit_price).toFixed(2)}</span>

                          {/* Show Return Status if exists */}
                          {item.return_status && (
                            <span className={`status-badge ${item.return_status}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                              {item.return_status.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Full Order Return Button */}
                    {order.order_status === 'delivered' && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid #333', paddingTop: '15px' }}>
                        <button
                          className="pixel-button"
                          style={{ background: '#ef4444', fontSize: '12px' }}
                          onClick={async () => {
                            const reason = prompt("Please enter the reason for returning the ENTIRE order:");
                            if (reason) {
                              try {
                                await api.requestReturn(order.order_id, reason);
                                alert("Return requested for the entire order!");
                                // Refresh orders
                                const data = await api.getOrders(user.customer_id);
                                setOrders(data);
                              } catch (error) {
                                alert("Failed to request return: " + (error.response?.data?.error || error.message));
                              }
                            }
                          }}
                        >
                          RETURN ENTIRE ORDER
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
