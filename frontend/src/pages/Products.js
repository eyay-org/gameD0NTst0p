import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import './Products.css';
import './ErrorDisplay.css';

const Products = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    genre: '',
    search: '',
    min_price: '',
    max_price: '',
    sort_by: 'newest'
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [productsData, genresData] = await Promise.all([
          api.getProducts(filters),
          api.getGenres()
        ]);
        setProducts(productsData);
        setGenres(genresData);
        setError(null);
      } catch (error) {
        console.error('Failed to load products:', error);
        setError(error.message || 'Failed to load products. Make sure the backend server is running on http://localhost:5000');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      loadData();
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Do NOT set loading here to avoid unmounting inputs
    setError(null);
  };

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
    <div className="products-page">
      <div className="container">
        <h1 className="page-title">🛒 PRODUCTS</h1>

        <div className="filters-section">
          <div className="filter-group">
            <label>SEARCH:</label>
            <input
              type="text"
              className="pixel-input"
              placeholder="SEARCH PRODUCTS..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>TYPE:</label>
            <select
              className="pixel-input"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">ALL</option>
              <option value="game">GAMES</option>
              <option value="console">CONSOLES</option>
            </select>
          </div>

          {filters.type === 'game' && (
            <div className="filter-group">
              <label>GENRE:</label>
              <select
                className="pixel-input"
                value={filters.genre}
                onChange={(e) => handleFilterChange('genre', e.target.value)}
              >
                <option value="">ALL GENRES</option>
                {genres.map(genre => (
                  <option key={genre.genre_id} value={genre.genre_name}>
                    {genre.genre_name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="filter-group">
            <label>PRICE RANGE:</label>
            <div className="price-inputs">
              <input
                type="number"
                className="pixel-input"
                placeholder="MIN"
                value={filters.min_price}
                onChange={(e) => handleFilterChange('min_price', e.target.value)}
              />
              <span className="separator">-</span>
              <input
                type="number"
                className="pixel-input"
                placeholder="MAX"
                value={filters.max_price}
                onChange={(e) => handleFilterChange('max_price', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>SORT BY:</label>
            <select
              className="pixel-input"
              value={filters.sort_by}
              onChange={(e) => handleFilterChange('sort_by', e.target.value)}
            >
              <option value="newest">NEWEST</option>
              <option value="price_asc">PRICE: LOW TO HIGH</option>
              <option value="price_desc">PRICE: HIGH TO LOW</option>
              <option value="name_asc">NAME: A-Z</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-container" style={{ textAlign: 'center', padding: '50px' }}>
            <div className="loading">LOADING...</div>
          </div>
        ) : (
          <div className="products-grid">
            {products.length > 0 ? (
              products.map(product => (
                <ProductCard key={product.product_id} product={product} />
              ))
            ) : (
              <div className="no-products">
                <p>NO PRODUCTS FOUND</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;

