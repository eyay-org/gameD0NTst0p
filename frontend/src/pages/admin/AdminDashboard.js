import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.getAdminStats();
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div className="loading">LOADING...</div>;
    if (!stats) return <div className="error">Failed to load stats</div>;

    return (
        <div className="admin-dashboard">
            <div className="admin-page-header">
                <h1 className="admin-title">DASHBOARD OVERVIEW</h1>
            </div>

            <div className="stats-grid">
                <div className="stat-card sales">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                        <h3>TOTAL SALES</h3>
                        <p className="stat-value">${stats.total_sales.toLocaleString()}</p>
                    </div>
                </div>

                <div className="stat-card orders">
                    <div className="stat-icon">📦</div>
                    <div className="stat-info">
                        <h3>TOTAL ORDERS</h3>
                        <p className="stat-value">{stats.total_orders}</p>
                    </div>
                </div>

                <div className="stat-card products">
                    <div className="stat-icon">🎮</div>
                    <div className="stat-info">
                        <h3>PRODUCTS</h3>
                        <p className="stat-value">{stats.total_products}</p>
                    </div>
                </div>

                <div className="stat-card alerts">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-info">
                        <h3>LOW STOCK</h3>
                        <p className="stat-value">{stats.low_stock_count}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
