import React, { useState } from 'react';

export default function ReceiptBookView({ receipts }) {
  const [filterPeriod, setFilterPeriod] = useState('ALL'); // ALL, TODAY, CUSTOM
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const filteredReceipts = receipts.filter(r => {
    // Search filter
    const matchesSearch = r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.customer_name && r.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (r.payment_method && r.payment_method.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Date range filter
    const receiptDate = new Date(r.timestamp);
    if (filterPeriod === 'TODAY') {
      const today = new Date().toDateString();
      return receiptDate.toDateString() === today;
    }
    if (filterPeriod === 'CUSTOM' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      return receiptDate >= start && receiptDate <= end;
    }

    return true;
  });

  const handlePrint = (receipt) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt ${receipt.id}</title>
          <style>
            body { font-family: monospace; padding: 20px; width: 300px; }
            h2 { text-align: center; margin-bottom: 5px; }
            .center { text-align: center; }
            .border { border-top: 1px dashed #000; margin: 10px 0; }
            .item { display: flex; justify-content: space-between; font-size: 12px; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>HardwareDesk Uganda</h2>
          <div class="center" style="font-size:11px;">Hardware Store Management (UGX)</div>
          <div class="border"></div>
          <div><strong>Receipt #:</strong> ${receipt.id}</div>
          <div><strong>Date:</strong> ${new Date(receipt.timestamp).toLocaleString()}</div>
          <div><strong>Payment:</strong> ${receipt.payment_method}</div>
          ${receipt.customer_name ? `<div><strong>Customer:</strong> ${receipt.customer_name}</div>` : ''}
          <div class="border"></div>
          ${(receipt.items || []).map(i => `
            <div class="item">
              <span>${i.quantity}x ${i.name}</span>
              <span>UGX ${((i.selling_price || 0) * i.quantity).toLocaleString()}</span>
            </div>
          `).join('')}
          <div class="border"></div>
          <div class="item bold font-size:14px;">
            <span>TOTAL:</span>
            <span>UGX ${(receipt.total || 0).toLocaleString()}</span>
          </div>
          <div class="border"></div>
          <div class="center" style="font-size:10px; margin-top:15px;">Webale Nnyo / Thank you for your business!</div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Digital Receipt Book (UGX)</h2>
          <p className="text-xs text-gray-500">Every POS sale, customer prepayment deposit, and debt settlement in chronological order.</p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'TODAY', 'CUSTOM'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPeriod(p)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                filterPeriod === p ? 'bg-amber-500 text-slate-900 shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {p}
            </button>
          ))}
          <input 
            type="text"
            placeholder="Search receipt #, customer, MTN/Airtel..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-xs w-full sm:w-60 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Custom Date Range Selector Bar */}
      {filterPeriod === 'CUSTOM' && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center space-x-4 text-xs">
          <span className="font-semibold text-amber-900">Custom Date Period:</span>
          <div className="flex items-center space-x-2">
            <label className="text-amber-800">From:</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              className="border rounded px-2 py-1 bg-white focus:outline-none"
            />
            <label className="text-amber-800">To:</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              className="border rounded px-2 py-1 bg-white focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Receipts Table (Most recent first) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-gray-700 text-xs uppercase border-b">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Party / Customer</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Items Count</th>
                <th className="py-3 px-4">Total Amount (UGX)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-400 text-xs">
                    No receipts found for the selected period.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        r.id.startsWith('REC-PREPAY-') ? 'bg-blue-100 text-blue-800' :
                        r.id.startsWith('REC-DEBT-PAY-') ? 'bg-purple-100 text-purple-800' :
                        r.id.startsWith('REC-SUP-PAY-') ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {r.id}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600">
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {r.customer_name || 'Walk-in Customer'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                        r.payment_method.includes('MTN') ? 'bg-yellow-100 text-yellow-800' :
                        r.payment_method.includes('Airtel') ? 'bg-red-100 text-red-800' :
                        r.payment_method === 'Cash' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {r.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600">
                      {(r.items || []).reduce((sum, i) => sum + (i.quantity || 1), 0)} items
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      UGX {(r.total || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button 
                        onClick={() => setSelectedReceipt(r)}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded transition"
                      >
                        View Slip
                      </button>
                      <button 
                        onClick={() => handlePrint(r)}
                        className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-2.5 py-1 rounded transition shadow-sm"
                      >
                        🖨 Print
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Slip Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 space-y-4 shadow-xl font-mono text-xs">
            <div className="text-center border-b pb-2">
              <h3 className="text-sm font-bold">HardwareDesk Uganda</h3>
              <p className="text-gray-500 text-[10px]">Digital Audit Copy</p>
            </div>
            
            <div className="space-y-1">
              <div><strong>Receipt:</strong> {selectedReceipt.id}</div>
              <div><strong>Date:</strong> {new Date(selectedReceipt.timestamp).toLocaleString()}</div>
              <div><strong>Party:</strong> {selectedReceipt.customer_name || 'Walk-in'}</div>
              <div><strong>Payment:</strong> {selectedReceipt.payment_method}</div>
            </div>

            <div className="border-t border-b py-2 space-y-1">
              {(selectedReceipt.items || []).map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.quantity}x {item.name}</span>
                  <span>UGX {((item.selling_price || 0) * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL:</span>
              <span>UGX {(selectedReceipt.total || 0).toLocaleString()}</span>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t font-sans">
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
              >
                Close
              </button>
              <button 
                onClick={() => handlePrint(selectedReceipt)}
                className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-900 rounded"
              >
                🖨 Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
