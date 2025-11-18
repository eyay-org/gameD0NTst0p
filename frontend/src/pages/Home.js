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
        const [games, consoles] = await Promise.all([
          api.getProducts({ type: 'game', limit: 6 }),
          api.getProducts({ type: 'console', limit: 3 })
        ]);
        setFeaturedGames(games);
        setFeaturedConsoles(consoles);
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
    return <div className="loading">LOADING...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message-box">
          <h2>⚠️ ERROR</h2>
          <p>{error}</p>
          <p className="error-help">
            Please make sure:
            <br />1. Backend server is running (python app.py)
            <br />2. Database is set up and has data
            <br />3. Check browser console for details
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="container">
          <h1 className="hero-title">🎮 WELCOME TO GAME STORE 🎮</h1>
          <p className="hero-subtitle">YOUR ULTIMATE DESTINATION FOR GAMES & CONSOLES</p>
          <Link to="/products" className="pixel-button hero-cta">
            SHOP NOW
          </Link>
        </div>
      </section>

      <section className="featured-section">
        <div className="container">
          <h2 className="section-title">🎯 FEATURED GAMES</h2>
          <div className="products-grid">
            {featuredGames.map(product => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
          <div className="section-footer">
            <Link to="/products?type=game" className="pixel-button">
              VIEW ALL GAMES
            </Link>
          </div>
        </div>
      </section>

      <section className="featured-section">
        <div className="container">
          <h2 className="section-title">🎮 FEATURED CONSOLES</h2>
          <div className="products-grid">
            {featuredConsoles.map(product => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
          <div className="section-footer">
            <Link to="/products?type=console" className="pixel-button">
              VIEW ALL CONSOLES
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

