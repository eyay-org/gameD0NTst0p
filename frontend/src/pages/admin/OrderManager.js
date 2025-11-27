import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const OrderManager = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        totalPages: 1,
        total: 0
    });
    const [sortConfig, setSortConfig] = useState({
        key: 'date',
        direction: 'desc'
    });

    const loadOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                sort_by: sortConfig.key,
                order: sortConfig.direction
            };
            const response = await api.getAdminOrders(params);
            setOrders(response.data);
            setPagination(prev => ({
                ...prev,
                totalPages: response.pages,
                total: response.total
            }));
        } catch (error) {
            console.error('Failed to load orders:', error);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, sortConfig.key, sortConfig.direction]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await api.updateOrderStatus(orderId, newStatus);
            loadOrders(); // Refresh list
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on sort
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleRowsPerPageChange = (e) => {
        setPagination(prev => ({
            ...prev,
            limit: Number(e.target.value),
            page: 1
        }));
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return '↕';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    if (loading && !orders.length) return <div className="loading">LOADING...</div>;

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h1 className="admin-title">ORDER MANAGEMENT</h1>
            </div>

            <div className="admin-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
                                ORDER ID {getSortIcon('id')}
                            </th>
                            <th onClick={() => handleSort('customer')} style={{ cursor: 'pointer' }}>
                                CUSTOMER {getSortIcon('customer')}
                            </th>
                            <th onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>
                                DATE {getSortIcon('date')}
                            </th>
                            <th onClick={() => handleSort('total')} style={{ cursor: 'pointer' }}>
                                TOTAL {getSortIcon('total')}
                            </th>
                            <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                                STATUS {getSortIcon('status')}
                            </th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.order_id}>
                                <td>#{order.order_id}</td>
                                <td>
                                    {order.customer_name}
                                    <br />
                                    <small style={{ color: '#94a3b8' }}>{order.email}</small>
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
                                        style={{ padding: '5px', background: '#0f172a', color: 'white', border: '1px solid #334155' }}
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

                {/* Pagination Controls */}
                <div className="pagination-controls">
                    <div className="rows-per-page">
                        Rows per page:
                        <select value={pagination.limit} onChange={handleRowsPerPageChange}>
                            <option value={20}>20</option>
                            <option value={30}>30</option>
                            <option value={50}>50</option>
                        </select>
                    </div>

                    <div className="pagination-info">
                        Page {pagination.page} of {pagination.totalPages} ({pagination.total} items)
                    </div>

                    <div className="pagination-actions">
                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                        >
                            Previous
                        </button>
                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderManager;
