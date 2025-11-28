import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const InventoryManager = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        totalPages: 1,
        total: 0
    });
    const [sortConfig, setSortConfig] = useState({
        key: 'product_name',
        direction: 'asc'
    });

    const [showRestockModal, setShowRestockModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [suppliers, setSuppliers] = useState([]);
    const [branches, setBranches] = useState([]); // New state for branches
    const [selectedBranch, setSelectedBranch] = useState(''); // New state for filter
    const [restockForm, setRestockForm] = useState({
        mode: 'supplier', // 'supplier' or 'transfer'
        supplierId: '',
        fromBranchId: '',
        quantity: 10,
        unitCost: 0
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchInventory = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                sort_by: sortConfig.key,
                order: sortConfig.direction,
                branch_id: selectedBranch // Pass branch_id to backend
            };
            const response = await api.getAdminInventory(params);
            setInventory(response.data);
            setPagination(prev => ({
                ...prev,
                totalPages: response.pages,
                total: response.total
            }));
        } catch (error) {
            console.error('Failed to load inventory:', error);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, sortConfig.key, sortConfig.direction, selectedBranch]); // Add selectedBranch dependency

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on sort
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleRowsPerPageChange = (e) => {
        setPagination(prev => ({
            ...prev,
            limit: Number(e.target.value),
            page: 1
        }));
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return '↕';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    const [showHistory, setShowHistory] = useState(false);
    const [stockLogs, setStockLogs] = useState([]);

    const fetchStockLogs = async () => {
        try {
            const response = await api.getAdminStockLogs();
            console.log("API Response:", response);

            // Safe extraction logic
            const logsData = response.logs || response;

            if (Array.isArray(logsData)) {
                setStockLogs(logsData);
                setShowHistory(true);
            } else {
                console.error("Data format error. Received:", response);
                setStockLogs([]); // Fallback to empty array
                alert('Received invalid data format from server');
            }
        } catch (error) {
            console.error('Failed to load stock logs:', error);
            alert('Failed to load history');
        }
    };



    // Fetch branches on mount
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const data = await api.getBranches();
                setBranches(data);
            } catch (error) {
                console.error('Failed to load branches:', error);
            }
        };
        fetchBranches();
    }, []);

    // Filter inventory based on selected branch
    // const filteredInventory = selectedBranch 
    //     ? inventory.filter(item => item.branch_id == selectedBranch)
    //     : inventory;
    // Backend filtering is now used, so we use 'inventory' directly
    const filteredInventory = inventory;

    const handleOpenRestock = async (item) => {
        setSelectedItem(item);
        setRestockForm({ mode: 'supplier', supplierId: '', fromBranchId: '', quantity: 10, unitCost: 0 });
        setShowRestockModal(true);

        try {
            const supplierList = await api.getSuppliers();
            setSuppliers(supplierList);
            if (supplierList.length > 0) {
                setRestockForm(prev => ({ ...prev, supplierId: supplierList[0].supplier_id }));
            }
        } catch (error) {
            console.error('Failed to load suppliers:', error);
            alert('Failed to load suppliers. Please try again.');
        }
    };

    const handleRestockSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (restockForm.mode === 'supplier') {
                if (!restockForm.supplierId || restockForm.quantity <= 0 || restockForm.unitCost < 0) {
                    alert('Please fill in all fields correctly.');
                    setSubmitting(false);
                    return;
                }

                await api.restockInventory({
                    product_id: selectedItem.product_id,
                    branch_id: selectedItem.branch_id || 1,
                    supplier_id: restockForm.supplierId,
                    quantity: restockForm.quantity,
                    unit_cost: restockForm.unitCost
                });
                alert('Restock successful!');
            } else {
                // Transfer Mode
                if (!restockForm.fromBranchId || restockForm.quantity <= 0) {
                    alert('Please select a source branch and valid quantity.');
                    setSubmitting(false);
                    return;
                }

                await api.transferInventory({
                    product_id: selectedItem.product_id,
                    from_branch_id: restockForm.fromBranchId,
                    to_branch_id: selectedItem.branch_id || 1,
                    quantity: restockForm.quantity
                });
                alert('Transfer successful!');
            }

            setShowRestockModal(false);
            fetchInventory(); // Refresh table
            fetchStockLogs(); // Refresh logs if open
        } catch (error) {
            console.error('Operation failed:', error);
            alert('Operation failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && !inventory.length) return <div className="loading">LOADING...</div>;

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h1 className="admin-title">INVENTORY MANAGEMENT</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="pixel-input"
                        style={{ padding: '8px', background: '#1a1a2e', color: '#fff', border: '2px solid #4a90e2' }}
                    >
                        <option value="">ALL BRANCHES</option>
                        {branches.map(b => (
                            <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>
                        ))}
                    </select>
                    <button
                        className="pixel-button"
                        onClick={fetchStockLogs}
                    >
                        VIEW HISTORY (LOGS)
                    </button>
                </div>
            </div>

            {/* Restock Modal */}
            {showRestockModal && (
                <div className="modal-overlay" onClick={() => setShowRestockModal(false)} style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                    backdropFilter: 'blur(2px)'
                }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                        background: '#2a2a3e', border: '4px solid #4a90e2', padding: '20px',
                        width: '400px', boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)'
                    }}>
                        <h2 style={{ color: '#4a90e2', marginBottom: '20px' }}>
                            {restockForm.mode === 'transfer' ? 'TRANSFER STOCK' : 'RESTOCK'}: {selectedItem?.product_name}
                        </h2>

                        {/* Mode Toggle */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #4a90e2', paddingBottom: '10px' }}>
                            <label style={{ color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="radio"
                                    name="mode"
                                    value="supplier"
                                    checked={restockForm.mode === 'supplier'}
                                    onChange={() => setRestockForm(prev => ({ ...prev, mode: 'supplier' }))}
                                    style={{ marginRight: '8px' }}
                                />
                                Purchase from Supplier
                            </label>
                            <label style={{ color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="radio"
                                    name="mode"
                                    value="transfer"
                                    checked={restockForm.mode === 'transfer'}
                                    onChange={() => setRestockForm(prev => ({ ...prev, mode: 'transfer' }))}
                                    style={{ marginRight: '8px' }}
                                />
                                Transfer from Branch
                            </label>
                        </div>

                        <form onSubmit={handleRestockSubmit}>
                            {restockForm.mode === 'supplier' ? (
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', color: '#fff', marginBottom: '5px' }}>Supplier:</label>
                                    <select
                                        value={restockForm.supplierId}
                                        onChange={e => setRestockForm({ ...restockForm, supplierId: e.target.value })}
                                        style={{ width: '100%', padding: '8px', background: '#1a1a2e', color: '#fff', border: '1px solid #4a90e2' }}
                                        required
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map(s => (
                                            <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', color: '#fff', marginBottom: '5px' }}>Source Branch:</label>
                                    <select
                                        value={restockForm.fromBranchId}
                                        onChange={e => setRestockForm({ ...restockForm, fromBranchId: e.target.value })}
                                        style={{ width: '100%', padding: '8px', background: '#1a1a2e', color: '#fff', border: '1px solid #4a90e2' }}
                                        required
                                    >
                                        <option value="">Select Source Branch</option>
                                        {branches
                                            .filter(b => b.branch_id !== (selectedItem?.branch_id || 1)) // Exclude current branch
                                            .map(b => (
                                                <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            )}

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', color: '#fff', marginBottom: '5px' }}>Quantity:</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={restockForm.quantity}
                                    onChange={e => setRestockForm({ ...restockForm, quantity: parseInt(e.target.value) })}
                                    style={{ width: '100%', padding: '8px', background: '#1a1a2e', color: '#fff', border: '1px solid #4a90e2' }}
                                    required
                                />
                            </div>

                            {restockForm.mode === 'supplier' && (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', color: '#fff', marginBottom: '5px' }}>Unit Cost ($):</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={restockForm.unitCost}
                                        onChange={e => setRestockForm({ ...restockForm, unitCost: parseFloat(e.target.value) })}
                                        style={{ width: '100%', padding: '8px', background: '#1a1a2e', color: '#fff', border: '1px solid #4a90e2' }}
                                        required
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" onClick={() => setShowRestockModal(false)} style={{
                                    padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer'
                                }}>CANCEL</button>
                                <button type="submit" disabled={submitting} style={{
                                    padding: '8px 16px',
                                    background: submitting ? '#666' : '#4ade80',
                                    color: '#000',
                                    border: 'none',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold'
                                }}>
                                    {submitting ? 'PROCESSING...' : (restockForm.mode === 'transfer' ? 'CONFIRM TRANSFER' : 'CONFIRM RESTOCK')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showHistory && (
                <div className="modal-overlay" onClick={() => setShowHistory(false)} style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(2px)'
                }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                        maxWidth: '800px',
                        background: '#2a2a3e',
                        border: '4px solid #4a90e2',
                        padding: '20px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        position: 'relative',
                        boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)'
                    }}>
                        <div className="modal-header" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px',
                            borderBottom: '2px solid #4a90e2',
                            paddingBottom: '10px'
                        }}>
                            <h2 style={{ fontSize: '16px', color: '#4a90e2', margin: 0 }}>STOCK UPDATE HISTORY (TRIGGER LOGS)</h2>
                            <button
                                className="close-btn"
                                onClick={() => setShowHistory(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    fontFamily: '"Press Start 2P", cursive'
                                }}
                            >×</button>
                        </div>
                        <div className="modal-body">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>DATE</th>
                                        <th>PRODUCT</th>
                                        <th>BRANCH</th>
                                        <th>OLD QTY</th>
                                        <th>NEW QTY</th>
                                        <th>CHANGE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stockLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No logs found.</td>
                                        </tr>
                                    ) : (
                                        stockLogs.map(log => (
                                            <tr key={log.log_id}>
                                                <td>{new Date(log.change_date).toLocaleString()}</td>
                                                <td>{log.product_name}</td>
                                                <td>{log.branch_name}</td>
                                                <td>{log.old_quantity}</td>
                                                <td>{log.new_quantity}</td>
                                                <td style={{
                                                    color: log.new_quantity > log.old_quantity ? '#4ade80' : '#ef4444',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {log.new_quantity > log.old_quantity ? '+' : ''}
                                                    {log.new_quantity - log.old_quantity}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <div className="admin-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('product_name')} style={{ cursor: 'pointer' }}>
                                PRODUCT NAME {getSortIcon('product_name')}
                            </th>
                            <th onClick={() => handleSort('branch_name')} style={{ cursor: 'pointer' }}>
                                BRANCH {getSortIcon('branch_name')}
                            </th>
                            <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer' }}>
                                QUANTITY {getSortIcon('quantity')}
                            </th>
                            <th onClick={() => handleSort('last_update')} style={{ cursor: 'pointer' }}>
                                LAST UPDATE {getSortIcon('last_update')}
                            </th>
                            <th>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInventory.map((item) => (
                            <tr key={`${item.product_id}-${item.branch_name}`} className={item.quantity <= item.stock_alert_level ? 'low-stock' : ''}>
                                <td>
                                    {item.product_name}
                                    {item.quantity <= item.stock_alert_level && (
                                        <span className="low-stock-badge">LOW STOCK</span>
                                    )}
                                </td>
                                <td>{item.branch_name}</td>
                                <td>{item.quantity}</td>
                                <td>{new Date(item.last_update_date).toLocaleDateString()}</td>
                                <td>
                                    <button
                                        onClick={() => handleOpenRestock(item)}
                                        style={{
                                            background: '#4ade80', color: '#000', border: 'none',
                                            padding: '4px 8px', cursor: 'pointer', fontWeight: 'bold'
                                        }}
                                    >
                                        + RESTOCK
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                <div className="pagination-controls">
                    <div className="rows-per-page">
                        Rows per page:
                        <select value={pagination.limit} onChange={handleRowsPerPageChange}>
                            <option value={20}>20</option>
                            <option value={30}>30</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>

                    <div className="pagination-info">
                        Page {pagination.page} of {pagination.totalPages} ({pagination.total} items)
                    </div>

                    <div className="pagination-actions">
                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                        >
                            Previous
                        </button>
                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default InventoryManager;
