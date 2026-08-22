import React, { useState, useEffect } from 'react';
import InventoryView from './InventoryView';
import SalesView from './SalesView';
import PurchasesView from './PurchasesView';
import DebtorsCreditorsLedgerView from './DebtorsCreditorsLedgerView';
import StockTakeView from './StockTakeView';
import ReportsView from './ReportsView';
import ReceiptBookView from './ReceiptBookView';
import { fetchProducts } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [userRole, setUserRole] = useState('ADMIN');

  // Dynamic state for receipts, sales, and products
  const [receipts, setReceipts] = useState([
    {
      id: 'REC-849102',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      payment_method: 'Cash',
      total: 450000,
      items: [{ name: 'Portland Cement 50kg', quantity: 10, selling_price: 45000 }]
    },
    {
      id: 'REC-391045',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      payment_method: 'MTN Mobile Money',
      total: 160000,
      items: [{ name: 'PVC Pipe 2 inch (3m)', quantity: 5, selling_price: 32000 }]
    }
  ]);

  const [productsList, setProductsList] = useState([]);

  useEffect(() => {
    fetchProducts().then(prods => {
      if (prods && prods.length > 0) {
        setProductsList(prods);
      }
    });
  }, []);

  // When a sale is completed, add to dynamic receipts list
  const handleSaleComplete = (newReceipt) => {
    setReceipts(prev => [newReceipt, ...prev]);
  };

  // Keyboard shortcut listener ('/' hotkey to focus global search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const roleNavMap = {
    ADMIN: ['Dashboard', 'Sales', 'Inventory', 'Purchases', 'Stock Take', 'Debtors & Creditors', 'Reports', 'Receipt Book'],
    SALES_STAFF: ['Dashboard', 'Sales', 'Receipt Book', 'Debtors & Creditors'],
    STOREKEEPER: ['Dashboard', 'Inventory', 'Purchases', 'Stock Take', 'Debtors & Creditors'],
    VIEWER: ['Dashboard', 'Reports', 'Receipt Book']
  };

  const currentNav = roleNavMap[userRole] || roleNavMap.VIEWER;

  // Compute dynamic dashboard metrics
  const totalSalesRevenue = receipts.reduce((sum, r) => sum + (r.total || 0), 0);
  const totalItemsSold = receipts.reduce((sum, r) => sum + (r.items ? r.items.reduce((iSum, item) => iSum + (item.quantity || 1), 0) : 0), 0);

  // Compute top sold products dynamically from receipts
  const productSalesMap = {};
  receipts.forEach(r => {
    (r.items || []).forEach(item => {
      const name = item.name || 'Unknown Item';
      productSalesMap[name] = (productSalesMap[name] || 0) + (item.quantity || 1);
    });
  });
  const topSellers = Object.entries(productSalesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white h-14 flex items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <span className="text-xl font-bold tracking-wide text-amber-500">HardwareDesk</span>
          <span className="text-xs bg-slate-800 text-amber-400 font-bold px-2 py-0.5 rounded border border-slate-700">UGX Currency</span>
        </div>

        {/* Global Search & Quick Actions */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input 
              id="global-search-input"
              type="text" 
              placeholder="Search products, SKU, barcode... (/)" 
              className="bg-slate-800 text-sm text-gray-200 rounded px-3 py-1.5 w-72 focus:outline-none focus:ring-1 focus:ring-amber-500 border border-slate-700"
            />
          </div>

          {(userRole === 'ADMIN' || userRole === 'SALES_STAFF') && (
            <button 
              onClick={() => setActiveTab('Sales')}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-3 py-1.5 rounded text-sm transition"
            >
              + Quick POS Sale
            </button>
          )}

          {/* Role Switcher for Testing/Role Simulation */}
          <div className="flex items-center space-x-2 bg-slate-800 rounded px-2 py-1 border border-slate-700">
            <span className="text-xs text-gray-400">Role:</span>
            <select 
              value={userRole} 
              onChange={(e) => {
                const newRole = e.target.value;
                setUserRole(newRole);
                const allowed = roleNavMap[newRole];
                if (!allowed.includes(activeTab)) {
                  setActiveTab('Dashboard');
                }
              }}
              className="bg-slate-900 text-xs text-amber-400 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="SALES_STAFF">SALES_STAFF</option>
              <option value="STOREKEEPER">STOREKEEPER</option>
              <option value="VIEWER">VIEWER</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 bg-slate-900 text-slate-300 flex flex-col justify-between p-3 border-r border-slate-800">
          <nav className="space-y-1">
            {currentNav.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition ${
                  activeTab === tab
                    ? 'bg-amber-500 text-slate-900 font-bold'
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
          <div className="text-xs text-slate-500 p-2 border-t border-slate-800">
            HardwareDesk v1.2 (UGX)
          </div>
        </aside>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {activeTab === 'Sales' ? (
            <SalesView onSaleComplete={handleSaleComplete} />
          ) : activeTab === 'Inventory' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Stock & Inventory</h1>
                <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded">
                  Active Role: {userRole}
                </span>
              </div>
              <InventoryView userRole={userRole} />
            </div>
          ) : activeTab === 'Purchases' ? (
            <PurchasesView />
          ) : activeTab === 'Debtors & Creditors' || activeTab === 'Customers & Debtors' || activeTab === 'Suppliers & Creditors' ? (
            <DebtorsCreditorsLedgerView onAddReceipt={handleSaleComplete} />
          ) : activeTab === 'Stock Take' ? (
            <StockTakeView userRole={userRole} />
          ) : activeTab === 'Reports' ? (
            <ReportsView />
          ) : activeTab === 'Receipt Book' ? (
            <ReceiptBookView receipts={receipts} />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Operational Dashboard</h1>
                <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded">
                  Active Role: {userRole}
                </span>
              </div>

              {/* Key Metrics Dashboard Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today's Sales Revenue</span>
                  <p className="text-2xl font-bold text-gray-900 mt-1">UGX {totalSalesRevenue.toLocaleString()}</p>
                  <span className="text-xs text-green-600 font-medium">{receipts.length} transactions processed</span>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Items Sold</span>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{totalItemsSold}</p>
                  <span className="text-xs text-gray-500 font-medium">Total units dispatched</span>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Low Stock Alerts</span>
                  <p className="text-2xl font-bold text-amber-600 mt-1">1</p>
                  <span className="text-xs text-amber-600 font-medium">PVC Pipe 2" low</span>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customers Owe Us</span>
                  <p className="text-2xl font-bold text-red-600 mt-1">UGX 1,650,000</p>
                  <span className="text-xs text-red-500 font-medium">2 Active debtor accounts</span>
                </div>
              </div>

              {/* Recent Operations & Best Sellers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Recent Sales & Transactions</h2>
                    <button 
                      onClick={() => setActiveTab('Receipt Book')}
                      className="text-xs text-amber-600 hover:text-amber-700 font-semibold"
                    >
                      View All →
                    </button>
                  </div>
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs border-b">
                      <tr>
                        <th className="py-2 px-3">Receipt #</th>
                        <th className="py-2 px-3">Items</th>
                        <th className="py-2 px-3">Amount (UGX)</th>
                        <th className="py-2 px-3">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {receipts.slice(0, 5).map(r => {
                        const firstItem = r.items && r.items.length > 0 ? r.items[0].name : (r.type_label || 'Sale');
                        const itemCount = r.items ? r.items.reduce((s, i) => s + (i.quantity || 1), 0) : 1;
                        return (
                          <tr key={r.id} className="hover:bg-gray-50">
                            <td className="py-2 px-3 font-mono font-bold text-xs text-gray-900">{r.id}</td>
                            <td className="py-2 px-3 font-medium text-xs text-gray-800">
                              {firstItem} {r.items && r.items.length > 1 ? `(+${r.items.length - 1} more)` : `(${itemCount} pcs)`}
                            </td>
                            <td className="py-2 px-3 font-semibold text-xs text-gray-900">UGX {(r.total || 0).toLocaleString()}</td>
                            <td className="py-2 px-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                (r.payment_method || '').includes('MTN') ? 'bg-yellow-100 text-yellow-800' :
                                (r.payment_method || '').includes('Airtel') ? 'bg-red-100 text-red-800' :
                                (r.payment_method || '') === 'Cash' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {r.payment_method}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Live Best Sellers</h2>
                  {topSellers.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6 text-center">No sales recorded yet.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {topSellers.map(([name, qty], index) => (
                        <li key={name} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                          <span className="font-medium text-gray-800 text-xs">
                            <span className="text-amber-600 font-bold mr-1.5">{index + 1}.</span>
                            {name}
                          </span>
                          <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                            {qty} units sold
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
