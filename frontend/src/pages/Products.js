import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import './Products.css';
import './ErrorDisplay.css';

const Products = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [genres, setGenres] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [filtersVisible, setFiltersVisible] = useState(true);

  // Initialize filters from URL params
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    genre: searchParams.get('genre') || '',
    search: searchParams.get('search') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    sort_by: searchParams.get('sort_by') || 'newest',
    platform: searchParams.get('platform') || '',
    min_rating: searchParams.get('min_rating') || '',
    multiplayer: searchParams.get('multiplayer') === 'true',
    esrb: searchParams.get('esrb') || '',
    page: parseInt(searchParams.get('page')) || 1
  });
  const [totalPages, setTotalPages] = useState(1);

  // Sync filters to URL
  useEffect(() => {
    const params = {};
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params[key] = filters[key];
      }
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [productsResponse, genresData, platformsData] = await Promise.all([
          api.getProducts(filters),
          api.getGenres(),
          api.getPlatforms()
        ]);
        setProducts(productsResponse.products);
        setTotalPages(productsResponse.total_pages);
        setGenres(genresData);
        setPlatforms(platformsData);
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
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    setError(null);
  };

  const toggleFilters = useCallback((e) => {
    e?.stopPropagation();
    setFiltersVisible(prev => !prev);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
      window.scrollTo(0, 0);
    }
  };

  const handleAddToCart = async (e, productId) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to add items to cart');
      navigate('/login');
      return;
    }

    try {
      await api.addToCart(user.customer_id, productId);
      alert('Added to cart!');
    } catch (error) {
      alert('Failed to add to cart: ' + error.message);
    }
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
        <div className="page-header">
          <h1 className="page-title">Products</h1>
        </div>

        <div className="filters-section">
          <div className="filters-header">
            <button
              className="filters-toggle"
              onClick={toggleFilters}
              aria-expanded={filtersVisible}
              aria-label={filtersVisible ? 'Hide filters' : 'Show filters'}
              type="button"
            >
              <span className="filters-title">Filters</span>
              <span className="toggle-icon" aria-hidden="true">{filtersVisible ? '−' : '+'}</span>
            </button>
            
            {/* View Toggle - Always Visible */}
            <div className="view-toggle">
              <button
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setViewMode('grid');
                }}
                aria-label="Grid View"
                aria-pressed={viewMode === 'grid'}
                type="button"
              >
                <span aria-hidden="true">⊞</span>
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setViewMode('list');
                }}
                aria-label="List View"
                aria-pressed={viewMode === 'list'}
                type="button"
              >
                <span aria-hidden="true">☰</span>
              </button>
            </div>
          </div>
          
          <div className={`filters-content ${filtersVisible ? 'visible' : 'hidden'}`}>
          <div className="filter-group">
            <label htmlFor="search-input">Search</label>
            <input
              id="search-input"
              type="text"
              className="pixel-input"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          {/* TYPE FILTER */}
          <div className="filter-group">
            <label htmlFor="type-select">Type</label>
            <select
              id="type-select"
              className="pixel-input"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">All</option>
              <option value="game">Games</option>
              <option value="console">Consoles</option>
            </select>
          </div>

          {/* GAME SPECIFIC FILTERS */}
          {(filters.type === 'game' || filters.type === '') && (
            <>
              <div className="filter-group">
                <label htmlFor="platform-select">Platform</label>
                <select
                  id="platform-select"
                  className="pixel-input"
                  value={filters.platform}
                  onChange={(e) => handleFilterChange('platform', e.target.value)}
                >
                  <option value="">All Platforms</option>
                  {platforms.map((platform, idx) => (
                    <option key={idx} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="genre-select">Genre</label>
                <select
                  id="genre-select"
                  className="pixel-input"
                  value={filters.genre}
                  onChange={(e) => handleFilterChange('genre', e.target.value)}
                >
                  <option value="">All Genres</option>
                  {genres.map(genre => (
                    <option key={genre.genre_id} value={genre.genre_name}>
                      {genre.genre_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="rating-select">Rating</label>
                <select
                  id="rating-select"
                  className="pixel-input"
                  value={filters.min_rating}
                  onChange={(e) => handleFilterChange('min_rating', e.target.value)}
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">ESRB Rating</label>
                <div className="checkbox-list">
                  {['EC', 'E', 'E10+', 'T', 'M', 'AO', 'RP'].map(rating => (
                    <label key={rating} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filters.esrb ? filters.esrb.split(',').includes(rating) : false}
                        onChange={(e) => {
                          const current = filters.esrb ? filters.esrb.split(',') : [];
                          let next;
                          if (e.target.checked) {
                            next = [...current, rating];
                          } else {
                            next = current.filter(r => r !== rating);
                          }
                          handleFilterChange('esrb', next.join(','));
                        }}
                      />
                      {rating}
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.multiplayer}
                    onChange={(e) => handleFilterChange('multiplayer', e.target.checked)}
                  />
                  Multiplayer Only
                </label>
              </div>
            </>
          )}

          {/* CONSOLE SPECIFIC FILTERS */}
          {filters.type === 'console' && (
            <>
              <div className="filter-group">
                <label htmlFor="manufacturer-select">Manufacturer</label>
                <select
                  id="manufacturer-select"
                  className="pixel-input"
                  value={filters.manufacturer || ''}
                  onChange={(e) => handleFilterChange('manufacturer', e.target.value)}
                >
                  <option value="">All Manufacturers</option>
                  <option value="Sony">Sony (PlayStation)</option>
                  <option value="Microsoft">Microsoft (Xbox)</option>
                  <option value="Nintendo">Nintendo</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="storage-select">Storage</label>
                <select
                  id="storage-select"
                  className="pixel-input"
                  value={filters.storage || ''}
                  onChange={(e) => handleFilterChange('storage', e.target.value)}
                >
                  <option value="">Any Storage</option>
                  <option value="500GB">500GB</option>
                  <option value="1TB">1TB</option>
                  <option value="2TB">2TB</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="color-select">Color</label>
                <select
                  id="color-select"
                  className="pixel-input"
                  value={filters.color || ''}
                  onChange={(e) => handleFilterChange('color', e.target.value)}
                >
                  <option value="">Any Color</option>
                  <option value="Black">Black</option>
                  <option value="White">White</option>
                  <option value="Grey">Grey</option>
                  <option value="Blue">Blue</option>
                  <option value="Limited Edition">Limited Edition</option>
                </select>
              </div>
            </>
          )}

          <div className="filter-group">
            <label htmlFor="price-min">Price Range</label>
            <div className="price-inputs">
              <input
                id="price-min"
                type="number"
                className="pixel-input"
                placeholder="Min"
                value={filters.min_price}
                onChange={(e) => handleFilterChange('min_price', e.target.value)}
              />
              <span className="separator" aria-hidden="true">-</span>
              <input
                id="price-max"
                type="number"
                className="pixel-input"
                placeholder="Max"
                value={filters.max_price}
                onChange={(e) => handleFilterChange('max_price', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="sort-select">Sort By</label>
            <select
              id="sort-select"
              className="pixel-input"
              value={filters.sort_by}
              onChange={(e) => handleFilterChange('sort_by', e.target.value)}
            >
              <option value="name_asc">Name: A-Z</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Rating: High to Low</option>
              <option value="rating_asc">Rating: Low to High</option>
            </select>
            </div>
          </div>
        </div>

        {/* Active Filters Feedback */}
        {(filters.genre || filters.platform || filters.min_rating || filters.multiplayer || filters.esrb) && (
          <div className="active-filters">
            <span className="active-filters-label">Active Filters:</span>
            {filters.genre && (
              <span className="filter-chip" onClick={() => handleFilterChange('genre', '')}>
                Genre: {filters.genre}
                <span className="close">×</span>
              </span>
            )}
            {filters.platform && (
              <span className="filter-chip" onClick={() => handleFilterChange('platform', '')}>
                Platform: {filters.platform}
                <span className="close">×</span>
              </span>
            )}
            {filters.min_rating && (
              <span className="filter-chip" onClick={() => handleFilterChange('min_rating', '')}>
                {filters.min_rating}+ Stars
                <span className="close">×</span>
              </span>
            )}
            {filters.multiplayer && (
              <span className="filter-chip" onClick={() => handleFilterChange('multiplayer', false)}>
                Multiplayer
                <span className="close">×</span>
              </span>
            )}
            {filters.esrb && (
              <span className="filter-chip" onClick={() => handleFilterChange('esrb', '')}>
                ESRB: {filters.esrb}
                <span className="close">×</span>
              </span>
            )}
            <button
              className="clear-all-btn"
              onClick={() => setFilters({
                type: '',
                genre: '',
                search: '',
                min_price: '',
                max_price: '',
                sort_by: 'newest',
                platform: '',
                min_rating: '',
                multiplayer: false,
                esrb: ''
              })}
            >
              Clear All
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-container" style={{ textAlign: 'center', padding: '50px' }}>
            <div className="loading">LOADING...</div>
          </div>
        ) : (
          <>
            {products.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="products-grid">
                  {products.map(product => (
                    <ProductCard key={product.product_id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="products-list">
                  {products.map(product => (
                    <div key={product.product_id} className="product-list-item">
                      <div className="list-item-image">
                        <Link to={`/products/${product.product_id}`}>
                          <img
                            src={product.main_image || product.image || '/placeholder-game.png'}
                            alt={product.product_name}
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%234a90e2" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-family="monospace" font-size="20"%3E🎮%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        </Link>
                      </div>

                      <div className="list-item-info">
                        <Link to={`/products/${product.product_id}`} className="list-item-title">
                          {product.product_name}
                        </Link>

                        <div className="list-item-meta">
                          {product.platform && (
                            <span className="meta-badge platform">{product.platform}</span>
                          )}
                          {product.genres && product.genres.length > 0 && (
                            <span className="meta-badge genre">{product.genres[0]}</span>
                          )}
                          {product.release_date && (
                            <span className="meta-text">
                              📅 {new Date(product.release_date).toLocaleDateString()}
                            </span>
                          )}
                          {product.avg_rating > 0 && (
                            <span className="meta-text rating" style={{ color: '#ffd700' }}>
                              ★ {parseFloat(product.avg_rating).toFixed(1)}
                            </span>
                          )}
                        </div>

                        {product.description && (
                          <p className="list-item-description">
                            {product.description.length > 150
                              ? product.description.substring(0, 150) + '...'
                              : product.description}
                          </p>
                        )}
                      </div>

                      <div className="list-item-actions">
                        <div className="list-item-price">${parseFloat(product.price).toFixed(2)}</div>
                        <button
                          className="pixel-button add-cart-btn"
                          onClick={(e) => handleAddToCart(e, product.product_id)}
                        >
                          ADD TO CART
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="no-products">
                <p>NO PRODUCTS FOUND</p>
              </div>
            )}
          </>
        )}

        {/* Pagination Controls */}
        {!loading && products.length > 0 && (
          <div className="pagination-controls">
            <button
              className="pixel-button small"
              disabled={filters.page <= 1}
              onClick={() => handlePageChange(filters.page - 1)}
            >
              PREV
            </button>
            <span className="page-info">
              PAGE {filters.page} OF {totalPages}
            </span>
            <button
              className="pixel-button small"
              disabled={filters.page >= totalPages}
              onClick={() => handlePageChange(filters.page + 1)}
            >
              NEXT
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
