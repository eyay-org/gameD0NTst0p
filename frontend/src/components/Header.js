import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="pixel-header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-text">🎮 GAME STORE</span>
          </Link>

          <nav className="nav-menu">
            <Link to="/" className="nav-link">HOME</Link>
            <Link to="/products" className="nav-link">PRODUCTS</Link>
            {user ? (
              <>
                {user.is_admin && (
                  <Link to="/admin" className="nav-link admin-link">DASHBOARD</Link>
                )}
                <Link to="/cart" className="nav-link">CART</Link>
                <Link to="/orders" className="nav-link">ORDERS</Link>
                <Link to="/profile" className="nav-link user-name" style={{ color: '#4ade80', textDecoration: 'none' }}>
                  {user.first_name} {user.last_name}
                </Link>
                <button onClick={handleLogout} className="pixel-button secondary">
                  LOGOUT
                </button>
              </>
            ) : (
              <Link to="/login" className="pixel-button">
                LOGIN
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;

