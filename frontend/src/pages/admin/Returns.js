import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Returns = () => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReturns = async () => {
            try {
                const data = await api.getAdminReturns();
                setReturns(data);
            } catch (error) {
                console.error('Failed to load returns:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchReturns();
    }, []);

    if (loading) return <div className="loading">LOADING...</div>;

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h1 className="admin-title">RETURNS MANAGEMENT</h1>
            </div>

            <div className="admin-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>ORDER</th>
                            <th>CUSTOMER</th>
                            <th>PRODUCT</th>
                            <th>REASON</th>
                            <th>AMOUNT</th>
                            <th>DATE</th>
                            <th>STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {returns.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>No returns found.</td>
                            </tr>
                        ) : (
                            returns.map((ret) => (
                                <tr key={ret.return_id}>
                                    <td>#{ret.return_id}</td>
                                    <td>#{ret.order_id}</td>
                                    <td>{ret.customer_email}</td>
                                    <td>{ret.product_name}</td>
                                    <td>{ret.return_reason}</td>
                                    <td style={{ color: '#ef4444', fontWeight: 'bold' }}>
                                        -${parseFloat(ret.refund_amount).toFixed(2)}
                                    </td>
                                    <td>
                                        {ret.refund_date && new Date(ret.refund_date).getFullYear() > 1970
                                            ? new Date(ret.refund_date).toLocaleDateString()
                                            : '-'}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${ret.return_status}`}>
                                            {ret.return_status}
                                        </span>
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
