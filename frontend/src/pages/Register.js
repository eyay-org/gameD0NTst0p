import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
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
      await api.registerCustomer(formData);
      // Auto login after registration
      const user = await api.loginCustomer({
        email: formData.email,
        password: formData.password,
      });
      login(user);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="container">
        <div className="register-container">
          <h1 className="register-title">🎮 REGISTER</h1>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-row">
              <div className="form-group">
                <label>FIRST NAME:</label>
                <input
                  type="text"
                  name="first_name"
                  className="pixel-input"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>LAST NAME:</label>
                <input
                  type="text"
                  name="last_name"
                  className="pixel-input"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

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
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label>PHONE (OPTIONAL):</label>
              <input
                type="tel"
                name="phone"
                className="pixel-input"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <button 
              type="submit" 
              className="pixel-button success"
              disabled={loading}
            >
              {loading ? 'REGISTERING...' : 'REGISTER'}
            </button>
          </form>

          <div className="register-footer">
            <p>ALREADY HAVE AN ACCOUNT?</p>
            <Link to="/login" className="pixel-button">
              LOGIN
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

