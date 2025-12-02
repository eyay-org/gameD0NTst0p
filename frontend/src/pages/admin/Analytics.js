import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Analytics.css'; // New CSS file

const Analytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await api.getAdminAnalytics();
                setData(response);
            } catch (err) {
                setError('Failed to load analytics data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) return <div className="loading">LOADING ANALYTICS...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!data) return null;

    return (
        <div className="analytics-dashboard">
            <div className="admin-page-header">
                <h1 className="admin-title">EXECUTIVE DASHBOARD</h1>
            </div>

            {/* KPI Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>TOTAL REVENUE</h3>
                    <div className="stat-value" style={{ color: '#4caf50' }}>
                        ${parseFloat(data.totals.total_revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="stat-card">
                    <h3>TOTAL EXPENSES</h3>
                    <div className="stat-value" style={{ color: '#ef4444' }}>
                        ${parseFloat(data.totals.total_expenses).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="stat-card">
                    <h3>NET INCOME</h3>
                    <div className="stat-value" style={{ color: '#ffd700' }}>
                        ${parseFloat(data.totals.net_income).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="stat-card">
                    <h3>GROSS PROFIT (SALES)</h3>
                    <div className="stat-value" style={{ color: '#60a5fa' }}>
                        ${parseFloat(data.totals.total_profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Branch Performance */}
                <div className="dashboard-section admin-card">
                    <h2>Branch Performance</h2>
                    <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>BRANCH</th>
                                    <th>TXNS</th>
                                    <th>REVENUE</th>
                                    <th>PROFIT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.branch_performance.map((branch, index) => (
                                    <tr key={index}>
                                        <td>{branch.branch_name}</td>
                                        <td>{branch.transaction_count}</td>
                                        <td>${parseFloat(branch.revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td style={{ color: '#4caf50' }}>${parseFloat(branch.profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Products */}
                <div className="dashboard-section admin-card">
                    <h2>Top Selling Products</h2>
                    <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>PRODUCT</th>
                                    <th>SOLD</th>
                                    <th>REVENUE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.top_products.map((product, index) => (
                                    <tr key={index}>
                                        <td>{product.product_name}</td>
                                        <td>{product.total_sold}</td>
                                        <td>${parseFloat(product.revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
