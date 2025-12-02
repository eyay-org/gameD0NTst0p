import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Returns = () => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({
        key: 'date',
        direction: 'desc'
    });

    useEffect(() => {
        const fetchReturns = async () => {
            try {
                const params = {
                    sort_by: sortConfig.key,
                    order: sortConfig.direction
                };
                const data = await api.getAdminReturns(params);
                setReturns(data);
            } catch (error) {
                console.error('Failed to load returns:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchReturns();
    }, [sortConfig]);

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return '↕';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    if (loading) return <div className="loading">LOADING...</div>;

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h1 className="admin-title">RETURNS MANAGEMENT</h1>
            </div>

            <div className="admin-card" style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th style={{ width: '50px', cursor: 'pointer' }} onClick={() => handleSort('id')}>
                                ID {getSortIcon('id')}
                            </th>
                            <th style={{ width: '50px', cursor: 'pointer' }} onClick={() => handleSort('order')}>
                                ORDER {getSortIcon('order')}
                            </th>
                            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('customer')}>
                                CUSTOMER {getSortIcon('customer')}
                            </th>
                            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('product')}>
                                PRODUCT {getSortIcon('product')}
                            </th>
                            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('reason')}>
                                REASON {getSortIcon('reason')}
                            </th>
                            <th style={{ whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={() => handleSort('amount')}>
                                AMOUNT {getSortIcon('amount')}
                            </th>
                            <th style={{ whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={() => handleSort('date')}>
                                DATE {getSortIcon('date')}
                            </th>
                            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>
                                STATUS {getSortIcon('status')}
                            </th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {returns.length === 0 ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>No returns found.</td>
                            </tr>
                        ) : (
                            returns.map((ret) => (
                                <tr key={ret.return_id}>
                                    <td>#{ret.return_id}</td>
                                    <td>#{ret.order_id}</td>
                                    <td
                                        style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                        title={ret.customer_email}
                                    >
                                        {ret.customer_email}
                                    </td>
                                    <td
                                        style={{ maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                        title={ret.product_name}
                                    >
                                        {ret.product_name}
                                    </td>
                                    <td
                                        style={{ maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                        title={ret.return_reason}
                                    >
                                        {ret.return_reason}
                                    </td>
                                    <td style={{ color: '#ef4444', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                        -${parseFloat(ret.refund_amount).toFixed(2)}
                                    </td>
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                        {ret.refund_date && new Date(ret.refund_date).getFullYear() > 1970
                                            ? new Date(ret.refund_date).toLocaleDateString()
                                            : '-'}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${ret.return_status}`}>
                                            {ret.return_status}
                                        </span>
                                    </td>
                                    <td>
                                        <select
                                            value={ret.return_status}
                                            onChange={async (e) => {
                                                const newStatus = e.target.value;
                                                await api.updateReturnStatus(ret.return_id, newStatus);
                                                window.location.reload();
                                            }}
                                            style={{
                                                fontFamily: "'Press Start 2P', cursive",
                                                backgroundColor: '#1e293b',
                                                color: '#fff',
                                                border: '2px solid #4a90e2',
                                                padding: '5px',
                                                fontSize: '10px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                outline: 'none'
                                            }}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Returns;
