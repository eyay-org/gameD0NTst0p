import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Branches = () => {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const data = await api.getBranches();
                setBranches(data);
            } catch (error) {
                console.error('Failed to load branches:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBranches();
    }, []);

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
                            <th>ID</th>
                            <th>BRANCH NAME</th>
                            <th>ADDRESS</th>
                            <th>PHONE</th>
                            <th>MANAGER</th>
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
