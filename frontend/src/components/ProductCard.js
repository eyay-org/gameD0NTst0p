import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { user } = useAuth();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      alert('Please sign in to add items to your cart');
      return;
    }

    try {
      await api.addToCart(user.customer_id, product.product_id);
      alert('Added to cart! 🎮');
    } catch (error) {
      alert('Failed to add to cart: ' + error.message);
    }
  };

  const imageUrl = product.main_image || product.image || '/placeholder-game.png';
  const price = parseFloat(product.price).toFixed(2);
  
  // Generate star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('★');
    }
    if (hasHalfStar) {
      stars.push('☆');
    }
    return stars.join('');
  };

  return (
    <Link to={`/products/${product.product_id}`} className="product-card-link">
      <article className="product-card">
        <div className={`product-image-container type-${product.product_type}`}>
          <img
            src={imageUrl}
            alt={product.product_name}
            className="product-image"
            loading="lazy"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"%3E%3Cdefs%3E%3ClinearGradient id="grad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%232d5a4a;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%231a3a2f;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill="url(%23grad)" width="400" height="500"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23faf6f0" font-family="Georgia, serif" font-size="60"%3E🎮%3C/text%3E%3C/svg%3E';
            }}
          />
          
          {product.product_type === 'game' && product.genres && product.genres[0] && (
            <span className="product-badge">
              {product.genres[0]}
            </span>
          )}
        </div>

        <div className="product-info">
          <h3 className="product-name">{product.product_name}</h3>

          {product.product_type === 'game' && (
            <div className="product-details">
              {product.platform && (
                <span className="detail-tag platform">{product.platform}</span>
              )}
              {product.ESRB_rating && (
                <span className="detail-tag rating">{product.ESRB_rating}</span>
              )}
            </div>
          )}

          {product.product_type === 'console' && (
            <div className="product-details">
              {product.manufacturer && (
                <span className="detail-tag">{product.manufacturer}</span>
              )}
              {product.model && (
                <span className="detail-tag platform">{product.model}</span>
              )}
            </div>
          )}

          {product.avg_rating > 0 && (
            <div className="product-rating">
              <span className="stars">{renderStars(product.avg_rating)}</span>
              <span className="rating-value">{parseFloat(product.avg_rating).toFixed(1)}</span>
            </div>
          )}

          <div className="product-footer">
            <span className="product-price">{price}</span>
            <button
              className="add-cart-btn"
              onClick={handleAddToCart}
            >
              <span>🛒</span> Add to Cart
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default ProductCard;
