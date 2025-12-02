import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;
  
  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return '?';
  };

  return (
    <header className={`header header-glass ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <div className="logo-icon">
              <img src="/logo.jpg" alt="Arcade Gallery Logo" />
            </div>
            <div className="logo-text">
              <span className="logo-brand">Arcade Gallery</span>
              <span className="logo-tagline">Happy gaming awaits</span>
            </div>
          </Link>

          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <nav className={`nav-menu ${isMobileMenuOpen ? 'open' : ''}`}>
            <Link 
              to="/" 
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className={`nav-link ${isActive('/products') ? 'active' : ''}`}
            >
              Browse Games
          </Link>

            {user ? (
              <>
                {user.is_admin && (
                  <Link to="/admin" className="nav-link admin-link">
                    ✨ Dashboard
                  </Link>
                )}
                <Link 
                  to="/cart" 
                  className={`nav-link cart-link ${isActive('/cart') ? 'active' : ''}`}
                >
                  🛒 Cart
                </Link>
                <Link 
                  to="/orders" 
                  className={`nav-link ${isActive('/orders') ? 'active' : ''}`}
                >
                  Orders
                </Link>
                <Link to="/profile" className="user-greeting">
                  <div className="user-avatar">{getInitials()}</div>
                  <span className="user-name">{user.first_name}</span>
                </Link>
                <button onClick={handleLogout} className="header-logout-btn">
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" className="header-auth-btn">
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
