import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Profile.css';

const Profile = () => {
    const { user, login } = useAuth(); // login is used to update user context
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [addresses, setAddresses] = useState([]);

    // Forms State
    const [profileForm, setProfileForm] = useState({
        first_name: '',
        last_name: '',
        phone: ''
    });

    const [passwordForm, setPasswordForm] = useState({
        old_password: '',
        new_password: ''
    });

    const [addressForm, setAddressForm] = useState({
        address_type: '',
        city: '',
        full_address: ''
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchProfileData();
    }, [user, navigate]);

    const fetchProfileData = async () => {
        try {
            const data = await api.getProfile(user.customer_id);
            setProfileForm({
                first_name: data.user.first_name,
                last_name: data.user.last_name,
                phone: data.user.phone || ''
            });
            setAddresses(data.addresses);
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.updateProfile({
                customer_id: user.customer_id,
                ...profileForm
            });
            alert('Profile updated successfully!');
            // Update local user context if needed (optional, but good for UI consistency)
            // For now, we just rely on the form state
        } catch (error) {
            alert('Update failed: ' + (error.response?.data?.error || error.message));
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        try {
            await api.changePassword({
                customer_id: user.customer_id,
                ...passwordForm
            });
            alert('Password changed successfully!');
            setPasswordForm({ old_password: '', new_password: '' });
        } catch (error) {
            alert('Password change failed: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        try {
            await api.addAddress({
                customer_id: user.customer_id,
                ...addressForm
            });
            alert('Address added successfully!');
            setAddressForm({ address_type: '', city: '', full_address: '' });
            fetchProfileData(); // Refresh list
        } catch (error) {
            alert('Failed to add address: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleDeleteAddress = async (addressId) => {
        if (!window.confirm('Are you sure you want to delete this address?')) return;
        try {
            await api.deleteAddress(addressId, user.customer_id);
            fetchProfileData();
        } catch (error) {
            alert('Failed to delete address');
        }
    };

    if (loading) return <div className="loading">LOADING...</div>;

    return (
        <div className="profile-page">
            <div className="container">
                <h1 className="page-title">MY PROFILE</h1>

                <div className="profile-grid">
                    {/* Card 1: Personal Info */}
                    <div className="profile-card">
                        <h2>PERSONAL INFO</h2>
                        <form onSubmit={handleProfileUpdate}>
                            <div className="form-group">
                                <label>First Name</label>
                                <input
                                    type="text"
                                    className="pixel-input"
                                    value={profileForm.first_name}
                                    onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    className="pixel-input"
                                    value={profileForm.last_name}
                                    onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input
                                    type="text"
                                    className="pixel-input"
                                    value={profileForm.phone}
                                    onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="pixel-button">UPDATE INFO</button>
                        </form>
                    </div>

                    {/* Card 2: Security */}
                    <div className="profile-card">
                        <h2>SECURITY</h2>
                        <form onSubmit={handlePasswordChange}>
                            <div className="form-group">
                                <label>Current Password</label>
                                <input
                                    type="password"
                                    className="pixel-input"
                                    value={passwordForm.old_password}
                                    onChange={e => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    className="pixel-input"
                                    value={passwordForm.new_password}
                                    onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="pixel-button secondary">CHANGE PASSWORD</button>
                        </form>
                    </div>

                    {/* Card 3: Address Book */}
                    <div className="profile-card full-width">
                        <h2>ADDRESS BOOK</h2>

                        <div className="address-list">
                            {addresses.map(addr => (
                                <div key={addr.address_id} className="address-item">
                                    <div className="address-header">
                                        <strong>{addr.address_type}</strong>
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDeleteAddress(addr.address_id)}
                                        >×</button>
                                    </div>
                                    <p>{addr.full_address}</p>
                                    <p className="city">{addr.city}</p>
                                </div>
                            ))}
                            {addresses.length === 0 && <p style={{ color: '#888' }}>No addresses saved.</p>}
                        </div>

                        <h3 style={{ marginTop: '20px', fontSize: '14px', color: '#4ade80' }}>ADD NEW ADDRESS</h3>
                        <form onSubmit={handleAddAddress} className="address-form">
                            <div className="form-row">
                                <input
                                    type="text"
                                    placeholder="Title (e.g. Home)"
                                    className="pixel-input"
                                    value={addressForm.address_type}
                                    onChange={e => setAddressForm({ ...addressForm, address_type: e.target.value })}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="City"
                                    className="pixel-input"
                                    value={addressForm.city}
                                    onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                                    required
                                />
                            </div>
                            <textarea
                                placeholder="Full Address"
                                className="pixel-input"
                                value={addressForm.full_address}
                                onChange={e => setAddressForm({ ...addressForm, full_address: e.target.value })}
                                required
                                style={{ width: '100%', marginTop: '10px', height: '60px' }}
                            />
                            <button type="submit" className="pixel-button small" style={{ marginTop: '10px' }}>ADD ADDRESS</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
