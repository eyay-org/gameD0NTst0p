import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await api.loginCustomer(formData);
      login(user);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="container">
        <div className="login-container">
          <h1 className="login-title">🎮 LOGIN</h1>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>EMAIL:</label>
              <input
                type="email"
                name="email"
                className="pixel-input"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>PASSWORD:</label>
              <input
                type="password"
                name="password"
                className="pixel-input"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button 
              type="submit" 
              className="pixel-button"
              disabled={loading}
            >
              {loading ? 'LOGGING IN...' : 'LOGIN'}
            </button>
          </form>

          <div className="login-footer">
            <p>DON'T HAVE AN ACCOUNT?</p>
            <Link to="/register" className="pixel-button secondary">
              REGISTER
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

