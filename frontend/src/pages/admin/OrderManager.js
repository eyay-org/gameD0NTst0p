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

    // In-Store Sale State
    const [showSaleModal, setShowSaleModal] = useState(false);
    const [branches, setBranches] = useState([]);
    const [products, setProducts] = useState([]);
    const [saleForm, setSaleForm] = useState({
        branchId: '',
        productId: '',
        quantity: 1
    });

    // Fetch branches and products for modal
    const fetchFormData = async () => {
        try {
            const [branchData, productData] = await Promise.all([
                api.getBranches(),
                api.getAdminInventory({ limit: 1000 }) // Get all products roughly
            ]);
            setBranches(branchData);
            // Extract unique products from inventory list for dropdown
            // Or better, use getProducts if available. Let's use inventory list for now as it has IDs.
            // Actually, getAdminInventory returns { data: [...] }.
            // We need a unique list of products.
            // Let's just use the inventory items, but filter unique product_ids if needed.
            // For simplicity, let's just show all inventory items (Product X at Branch Y) 
            // OR better, let user select Branch FIRST, then show products available at that branch.
            // Let's do: Select Branch -> Select Product (filtered from inventory).
            if (productData && productData.data) {
                setProducts(productData.data);
            } else if (Array.isArray(productData)) {
                setProducts(productData);
            } else {
                setProducts([]);
            }
        } catch (error) {
            console.error('Failed to load form data:', error);
        }
    };

    useEffect(() => {
        if (showSaleModal) {
            fetchFormData();
        }
    }, [showSaleModal]);

    const handleSaleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.recordOfflineSale({
                branch_id: saleForm.branchId,
                product_id: saleForm.productId,
                quantity: saleForm.quantity
            });
            alert('Sale recorded successfully!');
            setShowSaleModal(false);
            loadOrders(); // Refresh orders (though it won't show up here unless we add dummy order)
        } catch (error) {
            alert('Failed to record sale: ' + error.message);
        }
    };

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
                <button
                    className="pixel-button"
                    onClick={() => setShowSaleModal(true)}
                    style={{ background: '#ffd700', color: '#000' }}
                >
                    + NEW IN-STORE SALE
                </button>
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
                                        <option value="returned">Returned</option>
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

            {/* In-Store Sale Modal */}
            {showSaleModal && (
                <div className="modal-overlay" onClick={() => setShowSaleModal(false)} style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                    backdropFilter: 'blur(2px)'
                }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                        background: '#2a2a3e', border: '4px solid #ffd700', padding: '20px',
                        width: '400px', boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)'
                    }}>
                        <h2 style={{ color: '#ffd700', marginBottom: '20px' }}>RECORD IN-STORE SALE</h2>
                        <form onSubmit={handleSaleSubmit}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', color: '#fff', marginBottom: '5px' }}>Branch:</label>
                                <select
                                    value={saleForm.branchId}
                                    onChange={e => setSaleForm({ ...saleForm, branchId: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '8px', background: '#1a1a2e', color: '#fff', border: '1px solid #ffd700' }}
                                >
                                    <option value="">Select Branch</option>
                                    {branches.map(b => (
                                        <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', color: '#fff', marginBottom: '5px' }}>Product:</label>
                                <select
                                    value={saleForm.productId}
                                    onChange={e => setSaleForm({ ...saleForm, productId: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '8px', background: '#1a1a2e', color: '#fff', border: '1px solid #ffd700' }}
                                >
                                    <option value="">Select Product</option>
                                    {/* Show products available at selected branch */}
                                    {products
                                        .filter(p => !saleForm.branchId || p.branch_id === parseInt(saleForm.branchId))
                                        .map(p => (
                                            <option key={`${p.product_id}-${p.branch_id}`} value={p.product_id}>
                                                {p.product_name} (Stock: {p.quantity})
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', color: '#fff', marginBottom: '5px' }}>Quantity:</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={saleForm.quantity}
                                    onChange={e => setSaleForm({ ...saleForm, quantity: parseInt(e.target.value) })}
                                    required
                                    style={{ width: '100%', padding: '8px', background: '#1a1a2e', color: '#fff', border: '1px solid #ffd700' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" onClick={() => setShowSaleModal(false)} style={{
                                    padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer'
                                }}>CANCEL</button>
                                <button type="submit" style={{
                                    padding: '8px 16px', background: '#ffd700', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold'
                                }}>RECORD SALE</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderManager;
