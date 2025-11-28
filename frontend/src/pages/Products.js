import React, { useState, useEffect } from 'react';
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

          <div className="filter-group">
            <label>PLATFORM:</label>
            <select
              className="pixel-input"
              value={filters.platform}
              onChange={(e) => handleFilterChange('platform', e.target.value)}
            >
              <option value="">ALL PLATFORMS</option>
              {platforms.map((platform, idx) => (
                <option key={idx} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>

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

          <div className="filter-group">
            <label>RATING:</label>
            <select
              className="pixel-input"
              value={filters.min_rating}
              onChange={(e) => handleFilterChange('min_rating', e.target.value)}
            >
              <option value="">ANY RATING</option>
              <option value="4">4+ STARS</option>
              <option value="3">3+ STARS</option>
              <option value="2">2+ STARS</option>
            </select>
          </div>

          <div className="filter-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.multiplayer}
                onChange={(e) => handleFilterChange('multiplayer', e.target.checked)}
              />
              MULTIPLAYER ONLY
            </label>
          </div>

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
              <option value="name_asc">NAME: A-Z</option>
              <option value="newest">NEWEST</option>
              <option value="oldest">OLDEST</option>
              <option value="price_asc">PRICE: LOW TO HIGH</option>
              <option value="price_desc">PRICE: HIGH TO LOW</option>
              <option value="rating_desc">RATING: HIGH TO LOW</option>
              <option value="rating_asc">RATING: LOW TO HIGH</option>
            </select>
          </div>

          <div className="filter-group view-toggle-group">
            <label>VIEW:</label>
            <div className="view-toggle">
              <button
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                ⊞ GRID
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                ☰ LIST
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Feedback */}
        {(filters.genre || filters.platform || filters.min_rating || filters.multiplayer) && (
          <div className="active-filters" style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 'bold', alignSelf: 'center' }}>FILTERING BY:</span>
            {filters.genre && (
              <button
                className="pixel-button small"
                onClick={() => handleFilterChange('genre', '')}
                style={{ fontSize: '0.8rem', padding: '5px 10px' }}
              >
                GENRE: {filters.genre} ✖
              </button>
            )}
            {filters.platform && (
              <button
                className="pixel-button small"
                onClick={() => handleFilterChange('platform', '')}
                style={{ fontSize: '0.8rem', padding: '5px 10px' }}
              >
                PLATFORM: {filters.platform} ✖
              </button>
            )}
            {filters.min_rating && (
              <button
                className="pixel-button small"
                onClick={() => handleFilterChange('min_rating', '')}
                style={{ fontSize: '0.8rem', padding: '5px 10px' }}
              >
                {filters.min_rating}+ STARS ✖
              </button>
            )}
            {filters.multiplayer && (
              <button
                className="pixel-button small"
                onClick={() => handleFilterChange('multiplayer', false)}
                style={{ fontSize: '0.8rem', padding: '5px 10px' }}
              >
                MULTIPLAYER ✖
              </button>
            )}
            <button
              className="pixel-button small danger"
              onClick={() => setFilters({
                type: '',
                genre: '',
                search: '',
                min_price: '',
                max_price: '',
                sort_by: 'newest',
                platform: '',
                min_rating: '',
                multiplayer: false
              })}
              style={{ fontSize: '0.8rem', padding: '5px 10px', marginLeft: 'auto' }}
            >
              CLEAR ALL
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
