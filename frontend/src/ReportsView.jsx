import React, { useState } from 'react';

const MOCK_SALES_HISTORY = [
  { id: 'REC-849102', date: '2026-08-20', revenue: 450000, profit: 90000, itemsCount: 10 },
  { id: 'REC-391045', date: '2026-08-20', revenue: 160000, profit: 40000, itemsCount: 5 },
  { id: 'REC-110293', date: '2026-08-19', revenue: 780000, profit: 195000, itemsCount: 18 },
  { id: 'REC-903124', date: '2026-08-18', revenue: 1250000, profit: 320000, itemsCount: 22 },
  { id: 'REC-551029', date: '2026-08-14', revenue: 650000, profit: 140000, itemsCount: 12 },
  { id: 'REC-441920', date: '2026-08-01', revenue: 3200000, profit: 850000, itemsCount: 65 }
];

const MOCK_PURCHASES_HISTORY = [
  { id: 'PUR-101', date: '2026-08-20', supplier: 'Plumbing World Uganda', cost: 550000 },
  { id: 'PUR-098', date: '2026-08-18', supplier: 'Roofings Ltd', cost: 1650000 },
  { id: 'PUR-092', date: '2026-08-05', supplier: 'Tororo Cement Ltd', cost: 2200000 }
];

function exportToCSV(sales, purchases, period) {
  const salesRows = [
    ['--- SALES (UGX) ---'],
    ['Receipt #', 'Date', 'Revenue (UGX)', 'Gross Profit (UGX)', 'Items Sold'],
    ...sales.map(s => [s.id, s.date, s.revenue, s.profit, s.itemsCount])
  ];
  const purchaseRows = [
    [],
    ['--- STOCK EXPENSES (UGX) ---'],
    ['PO #', 'Date', 'Supplier', 'Amount (UGX)'],
    ...purchases.map(p => [p.id, p.date, p.supplier, p.cost])
  ];
  const totalRevenue = sales.reduce((sum, s) => sum + s.revenue, 0);
  const totalExpenses = purchases.reduce((sum, p) => sum + p.cost, 0);
  const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);
  const summaryRows = [
    [],
    ['--- SUMMARY (UGX) ---'],
    ['Total Revenue', totalRevenue],
    ['Stock Expenses', totalExpenses],
    ['Est. Gross Profit', totalProfit],
    ['Net Cash Flow', totalRevenue - totalExpenses]
  ];
  const allRows = [
    [`HardwareDesk Uganda Financial Report - ${period}`],
    [`Generated: ${new Date().toLocaleString()}`],
    [],
    ...salesRows,
    ...purchaseRows,
    ...summaryRows
  ];
  const csvContent = allRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `HardwareDesk_Report_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsView() {
  const [period, setPeriod] = useState('TODAY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const today = new Date('2026-08-20');

  const filterByPeriod = (itemDateStr) => {
    const d = new Date(itemDateStr);
    if (period === 'TODAY') return itemDateStr === '2026-08-20';
    if (period === 'WEEKLY') { const diffDays = (today - d) / (1000 * 3600 * 24); return diffDays >= 0 && diffDays <= 7; }
    if (period === 'MONTHLY') return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    if (period === 'CUSTOM' && startDate && endDate) return d >= new Date(startDate) && d <= new Date(endDate);
    return true;
  };

  const filteredSales = MOCK_SALES_HISTORY.filter(s => filterByPeriod(s.date));
  const filteredPurchases = MOCK_PURCHASES_HISTORY.filter(p => filterByPeriod(p.date));

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.revenue, 0);
  const totalStockPurchases = filteredPurchases.reduce((sum, p) => sum + p.cost, 0);
  const totalProfit = filteredSales.reduce((sum, s) => sum + s.profit, 0);
  const netCashFlow = totalRevenue - totalStockPurchases;
  const totalTransactions = filteredSales.length;
  const totalItemsSold = filteredSales.reduce((sum, s) => sum + s.itemsCount, 0);
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  const handlePrintReport = () => {
    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <html>
        <head>
          <title>Financial Report - ${period}</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #111; }
            h2 { border-bottom: 2px solid #333; padding-bottom: 5px; }
            .metrics { display: flex; flex-wrap: wrap; gap: 20px; margin: 20px 0; }
            .metric { border: 1px solid #ddd; border-radius: 8px; padding: 12px 20px; min-width: 160px; }
            .label { font-size: 11px; color: #666; font-weight: bold; text-transform: uppercase; }
            .val { font-size: 22px; font-weight: bold; margin-top: 4px; }
            .red { color: #dc2626; } .green { color: #16a34a; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
            th { background: #f4f4f4; font-weight: bold; }
            h3 { margin-top: 25px; color: #333; }
            .footer { margin-top: 30px; font-size: 11px; color: #999; text-align: center; }
          </style>
        </head>
        <body>
          <h2>HardwareDesk Uganda — Financial Report (${period})</h2>
          <div>Generated: ${new Date().toLocaleString()}</div>
          <div class="metrics">
            <div class="metric"><div class="label">Total Revenue</div><div class="val">UGX ${totalRevenue.toLocaleString()}</div></div>
            <div class="metric"><div class="label">Stock Expenses</div><div class="val red">UGX ${totalStockPurchases.toLocaleString()}</div></div>
            <div class="metric"><div class="label">Est. Gross Profit</div><div class="val green">UGX ${totalProfit.toLocaleString()}</div></div>
            <div class="metric"><div class="label">Net Cash Flow</div><div class="val ${netCashFlow >= 0 ? 'green' : 'red'}">UGX ${netCashFlow.toLocaleString()}</div></div>
            <div class="metric"><div class="label">Profit Margin</div><div class="val">${profitMargin}%</div></div>
            <div class="metric"><div class="label">Transactions</div><div class="val">${totalTransactions}</div></div>
          </div>
          <h3>Sales Breakdown</h3>
          <table>
            <thead><tr><th>Receipt #</th><th>Date</th><th>Items</th><th>Revenue (UGX)</th><th>Est. Profit (UGX)</th></tr></thead>
            <tbody>
              ${filteredSales.map(s => `<tr><td>${s.id}</td><td>${s.date}</td><td>${s.itemsCount}</td><td>UGX ${s.revenue.toLocaleString()}</td><td>UGX ${s.profit.toLocaleString()}</td></tr>`).join('')}
            </tbody>
          </table>
          <h3>Stock Purchase Expenses</h3>
          <table>
            <thead><tr><th>PO #</th><th>Date</th><th>Supplier</th><th>Amount (UGX)</th></tr></thead>
            <tbody>
              ${filteredPurchases.map(p => `<tr><td>${p.id}</td><td>${p.date}</td><td>${p.supplier}</td><td>UGX ${p.cost.toLocaleString()}</td></tr>`).join('')}
            </tbody>
          </table>
          <div class="footer">HardwareDesk Uganda — Confidential Financial Document</div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Financial Reports & Analytics (UGX)</h2>
          <p className="text-xs text-gray-500">Revenue, expenses, and profit breakdown in Ugandan Shillings.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {['TODAY', 'WEEKLY', 'MONTHLY', 'CUSTOM'].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition ${period === p ? 'bg-amber-500 text-slate-900 shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
              {p}
            </button>
          ))}
          <button onClick={handlePrintReport} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3 py-1.5 rounded text-xs">
            🖨 Print PDF
          </button>
          <button onClick={() => exportToCSV(filteredSales, filteredPurchases, period)}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1.5 rounded text-xs">
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {period === 'CUSTOM' && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center space-x-4 text-xs">
          <span className="font-semibold text-amber-900">Custom Period Range:</span>
          <label className="text-amber-800">From:</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded px-2 py-1 bg-white" />
          <label className="text-amber-800">To:</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded px-2 py-1 bg-white" />
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Revenue', val: `UGX ${totalRevenue.toLocaleString()}`, color: 'text-gray-900', sub: 'Cash in from sales' },
          { label: 'Stock Expenses', val: `UGX ${totalStockPurchases.toLocaleString()}`, color: 'text-red-600', sub: 'Inventory purchased' },
          { label: 'Est. Gross Profit', val: `UGX ${totalProfit.toLocaleString()}`, color: 'text-green-600', sub: 'Sell price − cost' },
          { label: 'Net Cash Flow', val: `UGX ${netCashFlow.toLocaleString()}`, color: netCashFlow >= 0 ? 'text-slate-900' : 'text-red-600', sub: 'Revenue − expenses' },
          { label: 'Profit Margin', val: `${profitMargin}%`, color: 'text-indigo-600', sub: 'Of total revenue' },
          { label: 'Items Sold', val: totalItemsSold, color: 'text-gray-900', sub: `${totalTransactions} transactions` }
        ].map((card) => (
          <div key={card.label} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.label}</span>
            <p className={`text-lg font-bold mt-1 ${card.color}`}>{card.val}</p>
            <span className="text-xs text-gray-400">{card.sub}</span>
          </div>
        ))}
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Sales Revenue</h3>
            <span className="text-xs text-gray-500">{filteredSales.length} sales</span>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-gray-700 text-xs uppercase border-b">
              <tr>
                <th className="py-2.5 px-3">Receipt #</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Revenue</th>
                <th className="py-2.5 px-3">Est. Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSales.length === 0 ? (
                <tr><td colSpan="4" className="py-6 text-center text-gray-400 text-xs">No sales in selected period.</td></tr>
              ) : filteredSales.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 text-xs">
                  <td className="py-2.5 px-3 font-mono font-bold text-gray-900">{s.id}</td>
                  <td className="py-2.5 px-3 text-gray-600">{s.date}</td>
                  <td className="py-2.5 px-3 font-semibold text-gray-900">UGX {s.revenue.toLocaleString()}</td>
                  <td className="py-2.5 px-3 font-bold text-green-600">UGX {s.profit.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider">Stock Purchase Expenses</h3>
            <span className="text-xs text-gray-500">{filteredPurchases.length} purchases</span>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-gray-700 text-xs uppercase border-b">
              <tr>
                <th className="py-2.5 px-3">PO #</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Supplier</th>
                <th className="py-2.5 px-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPurchases.length === 0 ? (
                <tr><td colSpan="4" className="py-6 text-center text-gray-400 text-xs">No purchases in selected period.</td></tr>
              ) : filteredPurchases.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 text-xs">
                  <td className="py-2.5 px-3 font-mono font-bold text-gray-900">{p.id}</td>
                  <td className="py-2.5 px-3 text-gray-600">{p.date}</td>
                  <td className="py-2.5 px-3 font-medium text-gray-800">{p.supplier}</td>
                  <td className="py-2.5 px-3 font-bold text-red-600">UGX {p.cost.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
