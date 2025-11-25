import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const OrderManager = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            const data = await api.getAdminOrders();
            setOrders(data);
        } catch (error) {
            console.error('Failed to load orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await api.updateOrderStatus(orderId, newStatus);
            loadOrders(); // Refresh list
        } catch (error) {
            alert('Failed to update status');
        }
    };

    if (loading) return <div className="loading">LOADING...</div>;

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h1 className="admin-title">ORDER MANAGEMENT</h1>
            </div>

            <div className="admin-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ORDER ID</th>
                            <th>CUSTOMER</th>
                            <th>DATE</th>
                            <th>TOTAL</th>
                            <th>STATUS</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.order_id}>
                                <td>#{order.order_id}</td>
                                <td>
                                    {order.first_name} {order.last_name}
                                    <br />
                                    <small style={{ color: '#7f8c8d' }}>{order.email}</small>
                                </td>
                                <td>{new Date(order.order_date).toLocaleDateString()}</td>
                                <td>${parseFloat(order.total_amount).toFixed(2)}</td>
                                <td>
                                    <span className={`status-badge ${order.order_status}`}>
                                        {order.order_status}
                                    </span>
                                </td>
                                <td>
                                    <select
                                        className="pixel-input small"
                                        value={order.order_status}
                                        onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                                        style={{ padding: '5px' }}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OrderManager;
