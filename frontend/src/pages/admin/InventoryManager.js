import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const InventoryManager = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        totalPages: 1,
        total: 0
    });
    const [sortConfig, setSortConfig] = useState({
        key: 'product_name',
        direction: 'asc'
    });

    const fetchInventory = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                sort_by: sortConfig.key,
                order: sortConfig.direction
            };
            const response = await api.getAdminInventory(params);
            setInventory(response.data);
            setPagination(prev => ({
                ...prev,
                totalPages: response.pages,
                total: response.total
            }));
        } catch (error) {
            console.error('Failed to load inventory:', error);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, sortConfig.key, sortConfig.direction]);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

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

    const [showHistory, setShowHistory] = useState(false);
    const [stockLogs, setStockLogs] = useState([]);

    const fetchStockLogs = async () => {
        try {
            const response = await api.getAdminStockLogs();
            console.log("API Response:", response);

            // Safe extraction logic
            const logsData = response.logs || response;

            if (Array.isArray(logsData)) {
                setStockLogs(logsData);
                setShowHistory(true);
            } else {
                console.error("Data format error. Received:", response);
                setStockLogs([]); // Fallback to empty array
                alert('Received invalid data format from server');
            }
        } catch (error) {
            console.error('Failed to load stock logs:', error);
            alert('Failed to load history');
        }
    };



    if (loading && !inventory.length) return <div className="loading">LOADING...</div>;

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h1 className="admin-title">INVENTORY MANAGEMENT</h1>
                <button
                    className="pixel-button"
                    onClick={fetchStockLogs}
                >
                    VIEW HISTORY (LOGS)
                </button>
            </div>

            {showHistory && (
                <div className="modal-overlay" onClick={() => setShowHistory(false)} style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(2px)'
                }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                        maxWidth: '800px',
                        background: '#2a2a3e',
                        border: '4px solid #4a90e2',
                        padding: '20px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        position: 'relative',
                        boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)'
                    }}>
                        <div className="modal-header" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px',
                            borderBottom: '2px solid #4a90e2',
                            paddingBottom: '10px'
                        }}>
                            <h2 style={{ fontSize: '16px', color: '#4a90e2', margin: 0 }}>STOCK UPDATE HISTORY (TRIGGER LOGS)</h2>
                            <button
                                className="close-btn"
                                onClick={() => setShowHistory(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    fontFamily: '"Press Start 2P", cursive'
                                }}
                            >×</button>
                        </div>
                        <div className="modal-body">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>DATE</th>
                                        <th>PRODUCT</th>
                                        <th>BRANCH</th>
                                        <th>OLD QTY</th>
                                        <th>NEW QTY</th>
                                        <th>CHANGE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stockLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No logs found.</td>
                                        </tr>
                                    ) : (
                                        stockLogs.map(log => (
                                            <tr key={log.log_id}>
                                                <td>{new Date(log.change_date).toLocaleString()}</td>
                                                <td>{log.product_name}</td>
                                                <td>{log.branch_name}</td>
                                                <td>{log.old_quantity}</td>
                                                <td>{log.new_quantity}</td>
                                                <td style={{
                                                    color: log.new_quantity > log.old_quantity ? '#4ade80' : '#ef4444',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {log.new_quantity > log.old_quantity ? '+' : ''}
                                                    {log.new_quantity - log.old_quantity}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <div className="admin-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('product_name')} style={{ cursor: 'pointer' }}>
                                PRODUCT NAME {getSortIcon('product_name')}
                            </th>
                            <th onClick={() => handleSort('branch_name')} style={{ cursor: 'pointer' }}>
                                BRANCH {getSortIcon('branch_name')}
                            </th>
                            <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer' }}>
                                QUANTITY {getSortIcon('quantity')}
                            </th>
                            <th onClick={() => handleSort('last_update')} style={{ cursor: 'pointer' }}>
                                LAST UPDATE {getSortIcon('last_update')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.map((item) => (
                            <tr key={`${item.product_id}-${item.branch_name}`} className={item.quantity <= item.stock_alert_level ? 'low-stock' : ''}>
                                <td>
                                    {item.product_name}
                                    {item.quantity <= item.stock_alert_level && (
                                        <span className="low-stock-badge">LOW STOCK</span>
                                    )}
                                </td>
                                <td>{item.branch_name}</td>
                                <td>{item.quantity}</td>
                                <td>{new Date(item.last_update_date).toLocaleDateString()}</td>
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
                            <option value={100}>100</option>
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

export default InventoryManager;
