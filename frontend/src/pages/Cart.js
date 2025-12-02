import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Cart.css';

const Cart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadCart = async () => {
      try {
        const items = await api.getCart(user.customer_id);
        setCartItems(items);
      } catch (error) {
        console.error('Failed to load cart:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [user, navigate]);

  const handleRemoveItem = async (productId) => {
    try {
      await api.removeFromCart(user.customer_id, productId);
      setCartItems(items => items.filter(item => item.product_id !== productId));
    } catch (error) {
      alert('Failed to remove item: ' + error.message);
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId);
      return;
    }

    try {
      // Remove and re-add with new quantity
      await api.removeFromCart(user.customer_id, productId);
      await api.addToCart(user.customer_id, productId, newQuantity);
      
      setCartItems(items =>
        items.map(item =>
          item.product_id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    } catch (error) {
      alert('Failed to update quantity: ' + error.message);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + parseFloat(item.price) * item.quantity;
    }, 0);
  };

  const handleCheckout = () => {
    navigate('/checkout', { state: { cartItems } });
  };

  if (loading) {
    return <div className="loading">LOADING...</div>;
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1 className="page-title">🛒 YOUR CART</h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h3>Your Cart is Empty</h3>
            <p>Looks like you haven't added any games to your cart yet. Let's find something amazing!</p>
            <button 
              className="pixel-button"
              onClick={() => navigate('/products')}
            >
              🎨 Shop Now
            </button>
          </div>
        ) : (
          <div className="cart-content">
            <div className="cart-items">
              {cartItems.map(item => (
                <div key={item.product_id} className="cart-item">
                  <img 
                    src={item.image || '/placeholder-game.png'} 
                    alt={item.product_name}
                    className="cart-item-image"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"%3E%3Cdefs%3E%3ClinearGradient id="grad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%232d5a4a;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%231a3a2f;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill="url(%23grad)" width="400" height="500"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23faf6f0" font-family="Georgia, serif" font-size="60"%3E🎮%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <div className="cart-item-info">
                    <h3>{item.product_name}</h3>
                    <p className="cart-item-type">{item.product_type.toUpperCase()}</p>
                    <div className="cart-item-price">${parseFloat(item.price).toFixed(2)}</div>
                  </div>
                  <div className="cart-item-controls">
                    <div className="quantity-controls">
                      <button
                        className="quantity-btn"
                        onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="quantity-display">{item.quantity}</span>
                      <button
                        className="quantity-btn"
                        onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="cart-item-total">
                      ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveItem(item.product_id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping:</span>
                <span>$10.00</span>
              </div>
              <div className="summary-row total">
                <span>Total:</span>
                <span>${(calculateTotal() + 10).toFixed(2)}</span>
              </div>
              <button 
                className="checkout-btn"
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;

