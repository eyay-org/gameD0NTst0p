import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ProductDetail.css';

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await api.getProduct(productId);
        setProduct(data);
      } catch (error) {
        console.error('Failed to load product:', error);
        alert('Product not found');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, navigate]);

  useEffect(() => {
    if (product) {
      const initialImage = product.main_image || product.media?.[0]?.media_url || '/placeholder-game.png';
      setActiveImage(initialImage);
    }
  }, [product]);

  const handleAddToCart = async () => {
    if (!user) {
      alert('Please login to add items to cart');
      navigate('/login');
      return;
    }

    try {
      await api.addToCart(user.customer_id, product.product_id, quantity);
      alert('Added to cart!');
    } catch (error) {
      alert('Failed to add to cart: ' + error.message);
    }
  };

  if (loading) {
    return <div className="loading">LOADING...</div>;
  }

  if (!product) {
    return null;
  }

  const price = parseFloat(product.price).toFixed(2);

  return (
    <div className="product-detail-page">
      <div className="container">
        <div className="product-detail-content">
          <div className="product-images">
            <img
              src={activeImage}
              alt={product.product_name}
              className="main-product-image"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%234a90e2" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-family="monospace" font-size="40"%3E🎮%3C/text%3E%3C/svg%3E';
              }}
            />
            {product.media && product.media.length > 1 && (
              <div className="product-gallery">
                {product.media.map((media, idx) => (
                  <img
                    key={idx}
                    src={media.media_url}
                    alt={`${product.product_name} ${idx + 1}`}
                    className={`gallery-image ${activeImage === media.media_url ? 'active' : ''}`}
                    onClick={() => setActiveImage(media.media_url)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="product-info-section">
            <h1 className="product-title">{product.product_name}</h1>

            <div className="product-price-large">${price}</div>

            {product.product_type === 'game' && (
              <div className="product-specs">
                {product.platform && (
                  <div className="spec-item">
                    <span className="spec-label">PLATFORM:</span>
                    <span className="spec-value">{product.platform}</span>
                  </div>
                )}
                {product.developer && (
                  <div className="spec-item">
                    <span className="spec-label">DEVELOPER:</span>
                    <span className="spec-value">{product.developer}</span>
                  </div>
                )}
                {product.publisher && (
                  <div className="spec-item">
                    <span className="spec-label">PUBLISHER:</span>
                    <span className="spec-value">{product.publisher}</span>
                  </div>
                )}
                {product.ESRB_rating && (
                  <div className="spec-item">
                    <span className="spec-label">RATING:</span>
                    <span className="spec-value rating-badge">{product.ESRB_rating}</span>
                  </div>
                )}
                {product.genres && product.genres.length > 0 && (
                  <div className="spec-item">
                    <span className="spec-label">GENRES:</span>
                    <div className="genres-list">
                      {product.genres.map((genre, idx) => (
                        <span key={idx} className="genre-tag">
                          {genre.genre_name || genre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {product.product_type === 'console' && (
              <div className="product-specs">
                {product.manufacturer && (
                  <div className="spec-item">
                    <span className="spec-label">MANUFACTURER:</span>
                    <span className="spec-value">{product.manufacturer}</span>
                  </div>
                )}
                {product.model && (
                  <div className="spec-item">
                    <span className="spec-label">MODEL:</span>
                    <span className="spec-value">{product.model}</span>
                  </div>
                )}
                {product.storage_capacity && (
                  <div className="spec-item">
                    <span className="spec-label">STORAGE:</span>
                    <span className="spec-value">{product.storage_capacity}</span>
                  </div>
                )}
                {product.color && (
                  <div className="spec-item">
                    <span className="spec-label">COLOR:</span>
                    <span className="spec-value">{product.color}</span>
                  </div>
                )}
              </div>
            )}

            {product.description && (
              <div className="product-description">
                <h3>DESCRIPTION:</h3>
                <p>{product.description}</p>
              </div>
            )}

            <div className="product-actions">
              <div className="quantity-selector">
                <label>QUANTITY:</label>
                <input
                  type="number"
                  className="pixel-input quantity-input"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <button
                className="pixel-button success add-cart-large"
                onClick={handleAddToCart}
              >
                ADD TO CART
              </button>
            </div>

            {product.reviews && product.reviews.length > 0 && (
              <div className="product-reviews">
                <h3>REVIEWS:</h3>
                {product.reviews.map(review => (
                  <div key={review.review_id} className="review-item">
                    <div className="review-header">
                      <span className="review-author">
                        {review.first_name} {review.last_name}
                      </span>
                      <span className="review-rating">
                        {'⭐'.repeat(review.rating)}
                      </span>
                    </div>
                    {review.review_title && (
                      <h4 className="review-title">{review.review_title}</h4>
                    )}
                    {review.review_text && (
                      <p className="review-text">{review.review_text}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

