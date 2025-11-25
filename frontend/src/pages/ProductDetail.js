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
  const [canReview, setCanReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    review_title: '',
    review_text: ''
  });
  const [lightboxIndex, setLightboxIndex] = useState(null);

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
    loadProduct();
  }, [productId, navigate]);

  useEffect(() => {
    const checkEligibility = async () => {
      if (user && product) {
        try {
          const result = await api.checkReviewEligibility(product.product_id, user.customer_id);
          setCanReview(result.can_review);
        } catch (error) {
          console.error('Failed to check eligibility:', error);
        }
      }
    };
    checkEligibility();
  }, [user, product]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;

      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev + 1) % product.media.length);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev - 1 + product.media.length) % product.media.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, product]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createReview({
        customer_id: user.customer_id,
        product_id: product.product_id,
        ...reviewForm
      });
      alert('Review submitted!');
      // Reload product to show new review
      const data = await api.getProduct(productId);
      setProduct(data);
      setReviewForm({ rating: 5, review_title: '', review_text: '' });
    } catch (error) {
      alert('Failed to submit review: ' + error.message);
    }
  };

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

  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev + 1) % product.media.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev - 1 + product.media.length) % product.media.length);
  };

  if (loading) {
    return <div className="loading">LOADING...</div>;
  }

  if (!product) {
    return null;
  }

  const price = parseFloat(product.price).toFixed(2);

  return (
    <div className={'product-detail-page ' + (product.product_type === 'console' ? 'is-console' : '')}>
      {lightboxIndex !== null && product.media && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-nav-btn prev" onClick={prevImage}>&#10094;</button>

            {product.media[lightboxIndex].media_type === 'video' ? (
              <div className="lightbox-video-wrapper" style={{ width: '80vw', height: '80vh' }}>
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${getYouTubeId(product.media[lightboxIndex].media_url)}?autoplay=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="lightbox-iframe"
                ></iframe>
              </div>
            ) : (
              <img
                src={product.media[lightboxIndex].media_url}
                alt="Fullscreen view"
                className="lightbox-image"
              />
            )}

            <button className="lightbox-nav-btn next" onClick={nextImage}>&#10095;</button>
            <button className="lightbox-close" onClick={closeLightbox}>×</button>

            <div className="lightbox-counter">
              {lightboxIndex + 1} / {product.media.length}
            </div>
          </div>
        </div>
      )}

      <div className="container">
        <div className="product-detail-content">
          <div className="product-images">
            {/* Main Cover Section */}
            <div className={`main-image-wrapper type-${product.product_type}`}>
              <img
                src={product.main_image || product.media?.[0]?.media_url || '/placeholder-game.png'}
                alt={product.product_name}
                className="main-product-image"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%234a90e2" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-family="monospace" font-size="40"%3E🎮%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>

            {/* Screenshots Gallery Section */}
            {product.media && product.media.length > 0 && (
              <div className="screenshots-section">
                <h3 className="section-title">SCREENSHOTS & MEDIA</h3>
                <div className="product-gallery">
                  {product.media.map((media, idx) => {
                    const isVideo = media.media_type === 'video';
                    const videoId = isVideo ? getYouTubeId(media.media_url) : null;
                    const thumbnailUrl = isVideo
                      ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
                      : media.media_url;

                    return (
                      <div key={idx} className="gallery-item" onClick={() => openLightbox(idx)}>
                        {isVideo ? (
                          <div className="video-placeholder-container">
                            <img src={thumbnailUrl} alt="Video Thumbnail" className="video-thumb" />
                            <div className="play-icon-overlay">
                              <svg className="play-icon-svg" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={thumbnailUrl}
                            alt={`${product.product_name} screenshot ${idx + 1}`}
                            className="gallery-image"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="product-info-section">
            <h1 className="product-title">{product.product_name}</h1>

            <div className="product-price-large">
              ${price}
              {product.total_stock > 0 ? (
                <span className={`stock-badge ${product.total_stock < 5 ? 'low' : 'in-stock'}`}>
                  {product.total_stock < 5 ? `ONLY ${product.total_stock} LEFT!` : 'IN STOCK'}
                </span>
              ) : (
                <span className="stock-badge out-of-stock">OUT OF STOCK</span>
              )}
            </div>

            {product.available_at && product.available_at.length > 0 && (
              <div className="branch-availability">
                <span className="spec-label">AVAILABLE AT:</span>
                <div className="branch-list">
                  {product.available_at.map((branch, idx) => (
                    <span key={idx} className="branch-tag">
                      {branch}
                    </span>
                  ))}
                </div>
              </div>
            )}

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
                  max={product.total_stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(product.total_stock, Math.max(1, parseInt(e.target.value) || 1)))}
                  disabled={product.total_stock === 0}
                />
              </div>
              <button
                className={`pixel-button success add-cart-large ${product.total_stock === 0 ? 'disabled' : ''}`}
                onClick={handleAddToCart}
                disabled={product.total_stock === 0}
              >
                {product.total_stock === 0 ? 'OUT OF STOCK' : 'ADD TO CART'}
              </button>
            </div>

            {/* Review Section */}
            <div className="product-reviews-section">
              <h3>REVIEWS ({product.reviews?.length || 0})</h3>

              {user && canReview ? (
                <form onSubmit={handleReviewSubmit} className="review-form">
                  <h4>WRITE A REVIEW</h4>
                  <div className="form-group">
                    <label>RATING:</label>
                    <div className="star-rating-input">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span
                          key={star}
                          className={`star ${star <= reviewForm.rating ? 'active' : ''}`}
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>TITLE:</label>
                    <input
                      type="text"
                      className="pixel-input"
                      value={reviewForm.review_title}
                      onChange={e => setReviewForm({ ...reviewForm, review_title: e.target.value })}
                      placeholder="Review Title"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>REVIEW:</label>
                    <textarea
                      className="pixel-input"
                      value={reviewForm.review_text}
                      onChange={e => setReviewForm({ ...reviewForm, review_text: e.target.value })}
                      placeholder="Write your review here..."
                      required
                      rows="4"
                    />
                  </div>
                  <button type="submit" className="pixel-button success">SUBMIT REVIEW</button>
                </form>
              ) : (
                user && (
                  <div className="review-notice">
                    <p>Bu ürünü değerlendirmek için satın almalı ve teslim almalısınız.</p>
                  </div>
                )
              )}

              {product.reviews && product.reviews.length > 0 ? (
                <div className="reviews-list">
                  {product.reviews.map(review => (
                    <div key={review.review_id} className="review-item">
                      <div className="review-header">
                        <span className="review-author">
                          {review.first_name} {review.last_name}
                        </span>
                        <span className="review-rating">
                          {'⭐'.repeat(review.rating)}
                        </span>
                        <span className="review-date">
                          {new Date(review.review_date).toLocaleDateString()}
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
              ) : (
                <div className="no-reviews">
                  <p>Henüz yorum yapılmamış.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
