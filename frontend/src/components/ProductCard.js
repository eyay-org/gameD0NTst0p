import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { user } = useAuth();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to add items to cart');
      return;
    }

    try {
      await api.addToCart(user.customer_id, product.product_id);
      alert('Added to cart!');
    } catch (error) {
      alert('Failed to add to cart: ' + error.message);
    }
  };

  const imageUrl = product.main_image || product.image || '/placeholder-game.png';
  const price = parseFloat(product.price).toFixed(2);

  return (
    <Link to={`/products/${product.product_id}`} className="product-card-link">
      <div className="pixel-product-card">
        <div className={`product-image-container type-${product.product_type}`}>
          <img
            src={imageUrl}
            alt={product.product_name}
            className="product-image"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%234a90e2" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-family="monospace" font-size="20"%3E🎮%3C/text%3E%3C/svg%3E';
            }}
          />
          {product.product_type === 'game' && product.genres && (
            <div className="product-badge">
              {product.genres[0] || 'GAME'}
            </div>
          )}
        </div>

        <div className="product-info">
          <h3 className="product-name">{product.product_name}</h3>

          {product.product_type === 'game' && (
            <div className="product-details">
              {product.platform && (
                <span className="detail-tag">{product.platform}</span>
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
                <span className="detail-tag">{product.model}</span>
              )}
            </div>
          )}

          <div className="product-footer">
            <span className="product-price">${price}</span>
            <button
              className="pixel-button add-cart-btn"
              onClick={handleAddToCart}
            >
              ADD TO CART
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;

