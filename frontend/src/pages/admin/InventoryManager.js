import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const InventoryManager = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const data = await api.getAdminInventory();
                setInventory(data);
            } catch (error) {
                console.error('Failed to load inventory:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInventory();
    }, []);

    if (loading) return <div className="loading">LOADING...</div>;

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h1 className="admin-title">INVENTORY MANAGEMENT</h1>
            </div>

            <div className="admin-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>PRODUCT NAME</th>
                            <th>BRANCH</th>
                            <th>QUANTITY</th>
                            <th>LAST UPDATE</th>
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
            </div>
        </div>
    );
};

export default InventoryManager;
