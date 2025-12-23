import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import './Home.css';
import './ErrorDisplay.css';

const Home = () => {
  const [featuredGames, setFeaturedGames] = useState([]);
  const [featuredConsoles, setFeaturedConsoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const [gamesResponse, consolesResponse] = await Promise.all([
          api.getProducts({ type: 'game', limit: 6 }),
          api.getProducts({ type: 'console', limit: 3 })
        ]);
        setFeaturedGames(gamesResponse.products);
        setFeaturedConsoles(consolesResponse.products);
        setError(null);
      } catch (error) {
        console.error('Failed to load products:', error);
        setError(error.message || 'Failed to load products. Make sure the backend server is running on http://localhost:5000');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <span>Preparing the canvas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message-box">
          <h2>🎨 Oops! A Happy Little Accident</h2>
          <p>{error}</p>
          <p className="error-help">
            Let's fix this together:
            <br />1. Make sure the backend server is running
            <br />2. Check that the database is set up
            <br />3. Refresh the page and try again
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-mountains">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path className="mountain-far" d="M0,320 L0,200 Q360,80 720,180 T1440,120 L1440,320 Z" />
            <path className="mountain-mid" d="M0,320 L0,240 Q280,140 560,220 Q840,100 1120,200 Q1280,150 1440,180 L1440,320 Z" />
            <path className="mountain-near" d="M0,320 L0,280 Q200,220 400,260 Q600,200 800,270 Q1000,230 1200,280 L1440,260 L1440,320 Z" />
          </svg>
        </div>
        <div className="hero-trees"></div>
        
        <div className="hero-content">
          <h1 className="hero-title">
            Discover Your Next
            <span className="hero-title-accent">Adventure</span>
          </h1>
          
          <p className="hero-subtitle">
            Explore our curated collection of games and consoles. Every title tells a story, 
            every console opens a world. Find your perfect match today.
          </p>
          
          <div className="hero-actions">
            <Link to="/products" className="hero-btn-primary">
              Browse Collection
            </Link>
            <Link to="/products?type=game" className="hero-btn-secondary">
              View Games →
            </Link>
          </div>
        </div>
        
        <div className="scroll-indicator">
          <span>Scroll to explore</span>
          <div className="scroll-mouse"></div>
        </div>
      </section>

      {/* Featured Games Section */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Games</h2>
            <p className="section-description">
              Dive into worlds of wonder. These are our most beloved titles that 
              players can't stop talking about.
            </p>
          </div>
          
          <div className="products-grid">
            {featuredGames.map(product => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
          
          <div className="section-footer">
            <Link to="/products?type=game" className="view-all-btn">
              Explore All Games →
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Fast Shipping</h3>
              <p>Get your games delivered to your doorstep in no time. We know you can't wait to play!</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Secure Checkout</h3>
              <p>Shop with confidence. Your payments and personal data are always protected.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💎</div>
              <h3>Authentic Products</h3>
              <p>100% genuine games and consoles. No counterfeits, ever. That's our promise.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Expert Curation</h3>
              <p>Our team of gamers handpicks every title. Only the best makes it to our shelves.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Consoles Section */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Premium Consoles</h2>
            <p className="section-description">
              Power up your gaming setup with the latest and greatest gaming hardware.
            </p>
          </div>
          
          <div className="products-grid">
            {featuredConsoles.map(product => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
          
          <div className="section-footer">
            <Link to="/products?type=console" className="view-all-btn">
              View All Consoles →
            </Link>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="quote-section">
        <div className="container">
          <div className="quote-content">
            <div className="quote-icon">🎨</div>
            <p className="quote-text">
              "There are no mistakes in gaming, only happy adventures 
              waiting to be discovered."
            </p>
            <p className="quote-author">— Inspired by Bob Ross</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
