import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Branches = () => {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({
        key: 'id',
        direction: 'asc'
    });

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const params = {
                    sort_by: sortConfig.key,
                    order: sortConfig.direction
                };
                const data = await api.getBranches(params);
                setBranches(data);
            } catch (error) {
                console.error('Failed to load branches:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBranches();
    }, [sortConfig]);

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return '↕';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    if (loading) return <div className="loading">LOADING BRANCHES...</div>;

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h1 className="admin-title">BRANCH MANAGEMENT</h1>
            </div>

            <div className="admin-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('id')}>
                                ID {getSortIcon('id')}
                            </th>
                            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                                BRANCH NAME {getSortIcon('name')}
                            </th>
                            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('address')}>
                                ADDRESS {getSortIcon('address')}
                            </th>
                            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('phone')}>
                                PHONE {getSortIcon('phone')}
                            </th>
                            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('manager')}>
                                MANAGER {getSortIcon('manager')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {branches.map((branch) => (
                            <tr key={branch.branch_id}>
                                <td>#{branch.branch_id}</td>
                                <td style={{ color: '#4a90e2', fontWeight: 'bold' }}>{branch.branch_name}</td>
                                <td>{branch.address}</td>
                                <td>{branch.phone}</td>
                                <td>{branch.manager_name}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Branches;
