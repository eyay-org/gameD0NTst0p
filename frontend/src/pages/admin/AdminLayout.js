import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout = () => {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <h3>ADMIN PANEL</h3>
                </div>
                <nav className="sidebar-nav">
                    <Link to="/admin" className={`sidebar-link ${isActive('/admin')}`}>
                        📊 OVERVIEW
                    </Link>
                    <Link to="/admin/inventory" className={`sidebar-link ${isActive('/admin/inventory')}`}>
                        📦 INVENTORY
                    </Link>
                    <Link to="/admin/orders" className={`sidebar-link ${isActive('/admin/orders')}`}>
                        🛒 ORDERS
                    </Link>
                </nav>
            </aside>
            <main className="admin-content">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
