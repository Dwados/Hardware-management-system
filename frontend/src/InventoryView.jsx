import React, { useState } from 'react';
import { createProductApi, deleteProductApi } from './api';

export default function InventoryView({ userRole, products, onAddProduct, onDeleteProduct, onAdjustStock }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(null);

  const [newProduct, setNewProduct] = useState({
    name: '', sku: '', barcode: '', category: 'Building', cost_price: '', selling_price: '', stock_quantity: '', minimum_stock: 5, location: 'A1-S1-B1'
  });

  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('DAMAGE');

  const filteredProducts = (products || []).filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchTerm))
  );

  const getStockBadge = (qty, min) => {
    if (qty === 0) return <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded">OUT OF STOCK</span>;
    if (qty <= min) return <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded">LOW STOCK</span>;
    return <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded">IN STOCK</span>;
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const created = {
      ...newProduct,
      id: `prod-${Date.now()}`,
      cost_price: parseFloat(newProduct.cost_price) || 0,
      selling_price: parseFloat(newProduct.selling_price) || 0,
      stock_quantity: parseInt(newProduct.stock_quantity) || 0,
      minimum_stock: parseInt(newProduct.minimum_stock) || 5
    };
    
    if (onAddProduct) {
      onAddProduct(created);
    }
    await createProductApi(created);

    setShowAddModal(false);
    setNewProduct({ name: '', sku: '', barcode: '', category: 'Building', cost_price: '', selling_price: '', stock_quantity: '', minimum_stock: 5, location: 'A1-S1-B1' });
  };

  const handleDeleteProduct = async (prodId) => {
    if (onDeleteProduct) {
      onDeleteProduct(prodId);
    }
    await deleteProductApi(prodId);
    setConfirmDeleteModal(null);
  };

  const handleAdjustStock = (e) => {
    e.preventDefault();
    const change = parseInt(adjustQty) || 0;
    if (onAdjustStock && showAdjustModal) {
      onAdjustStock(showAdjustModal.id, change);
    }
    setShowAdjustModal(null);
    setAdjustQty('');
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative w-full sm:w-80">
          <input 
            type="text" 
            placeholder="Filter by name, SKU, barcode..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {userRole !== 'VIEWER' && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-3 py-1.5 rounded text-sm transition shadow-sm w-full sm:w-auto"
          >
            + Add Product
          </button>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-gray-700 text-xs uppercase border-b">
              <tr>
                <th className="py-3 px-4">Item & SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Cost Price (UGX)</th>
                <th className="py-3 px-4">Selling Price (UGX)</th>
                <th className="py-3 px-4">Stock Level</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
                {userRole !== 'VIEWER' && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-400 text-xs">
                    No products found. Add one above!
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-400 font-mono">SKU: {p.sku} | Barcode: {p.barcode || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{p.category_id || p.category}</td>
                    <td className="py-3 px-4 text-gray-600">UGX {(p.cost_price || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-gray-900">UGX {(p.selling_price || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 font-semibold">{p.stock_quantity} {p.unit || 'pcs'}</td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-500">{p.storage_location_id || p.location}</td>
                    <td className="py-3 px-4">{getStockBadge(p.stock_quantity, p.minimum_stock)}</td>
                    {userRole !== 'VIEWER' && (
                      <td className="py-3 px-4 text-right space-x-1">
                        <button 
                          onClick={() => setShowAdjustModal(p)}
                          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-2.5 py-1 rounded"
                        >
                          Adjust
                        </button>
                        {(userRole === 'ADMIN' || userRole === 'STOREKEEPER') && (
                          <button 
                            onClick={() => setConfirmDeleteModal(p)}
                            className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-medium px-2 py-1 rounded border border-red-200"
                            title="Delete / Remove Product"
                          >
                            🗑 Delete
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Add New Product (UGX)</h3>
            <form onSubmit={handleAddProduct} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Product Name</label>
                <input required type="text" placeholder="e.g. Iron Sheets 30 Gauge" className="w-full border rounded px-3 py-1.5" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">SKU</label>
                  <input required type="text" placeholder="IRN-030" className="w-full border rounded px-3 py-1.5" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Barcode (Optional)</label>
                  <input type="text" placeholder="Scan or enter" className="w-full border rounded px-3 py-1.5" value={newProduct.barcode} onChange={e => setNewProduct({...newProduct, barcode: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Cost Price (UGX)</label>
                  <input required type="number" placeholder="45000" className="w-full border rounded px-3 py-1.5" value={newProduct.cost_price} onChange={e => setNewProduct({...newProduct, cost_price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Selling Price (UGX)</label>
                  <input required type="number" placeholder="55000" className="w-full border rounded px-3 py-1.5" value={newProduct.selling_price} onChange={e => setNewProduct({...newProduct, selling_price: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Initial Stock Qty</label>
                  <input required type="number" placeholder="50" className="w-full border rounded px-3 py-1.5" value={newProduct.stock_quantity} onChange={e => setNewProduct({...newProduct, stock_quantity: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Storage Location</label>
                  <input type="text" placeholder="A1-S2-B3" className="w-full border rounded px-3 py-1.5" value={newProduct.location} onChange={e => setNewProduct({...newProduct, location: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-900 rounded">Save & Add to Sales</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 space-y-3 shadow-xl">
            <h3 className="text-sm font-bold text-red-600 border-b pb-2">Delete Product</h3>
            <p className="text-xs text-gray-600">
              Are you sure you want to remove <strong>{confirmDeleteModal.name}</strong> ({confirmDeleteModal.sku})? It will no longer appear in the POS sales screen or inventory list.
            </p>
            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button 
                type="button" 
                onClick={() => setConfirmDeleteModal(null)} 
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => handleDeleteProduct(confirmDeleteModal.id)} 
                className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Adjust Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Quick Stock Adjust: {showAdjustModal.name}</h3>
            <form onSubmit={handleAdjustStock} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Current Stock</label>
                <div className="font-bold text-lg">{showAdjustModal.stock_quantity} {showAdjustModal.unit || 'pcs'}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Adjustment Quantity (+ / -)</label>
                <input required type="number" placeholder="e.g. -2 or +10" className="w-full border rounded px-3 py-1.5" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Reason</label>
                <select className="w-full border rounded px-3 py-1.5" value={adjustReason} onChange={e => setAdjustReason(e.target.value)}>
                  <option value="DAMAGE">Damage / Broken</option>
                  <option value="EXPIRED">Defective</option>
                  <option value="AUDIT">Stock Count Variance</option>
                  <option value="RETURN">Customer Return</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAdjustModal(null)} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-900 rounded">Apply Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
